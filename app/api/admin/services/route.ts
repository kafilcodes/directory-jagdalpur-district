/**
 * Admin Services API
 * 
 * GET: Get all services (with all statuses for admin)
 * PATCH: Update service status (approve, reject, etc.)
 * DELETE: Delete a service
 * 
 * These endpoints are for admin panel use only.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import type { Service } from "@/types"

export const dynamic = "force-dynamic"

/**
 * GET - Fetch all services for admin (all statuses)
 */
export async function GET(req: NextRequest) {
    console.log("[API /api/admin/services] GET - Fetching services for admin")

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') // 'pending' | 'live' | 'rejected' | 'all'
        const service = searchParams.get('service') // Filter by service type
        const search = searchParams.get('search') // Search by name
        const limit = Number(searchParams.get('limit') || 50)
        const offset = Number(searchParams.get('offset') || 0)
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

        const db = getAdminDb()

        // Build query
        let query: FirebaseFirestore.Query = db.collection('services')

        // Filter by status
        if (status && status !== 'all') {
            query = query.where('status', '==', status)
        }

        // Filter by service type
        if (service) {
            query = query.where('serviceSlug', '==', service.toLowerCase())
        }

        // Order by field
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'qualityRating', 'chargesPerHour']
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
        query = query.orderBy(sortField, sortOrder)

        // Apply pagination
        if (offset > 0) {
            query = query.offset(offset)
        }
        query = query.limit(limit)

        // Execute query
        const snapshot = await query.get()

        let services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        })) as Service[]

        // Client-side search filter (Firestore doesn't support full-text search)
        if (search) {
            const searchLower = search.toLowerCase()
            services = services.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                s.service.toLowerCase().includes(searchLower) ||
                s.address.toLowerCase().includes(searchLower) ||
                s.contactNumber.includes(search)
            )
        }

        // Get counts by status
        const [pendingSnap, liveSnap, rejectedSnap] = await Promise.all([
            db.collection('services').where('status', '==', 'pending').count().get(),
            db.collection('services').where('status', '==', 'live').count().get(),
            db.collection('services').where('status', '==', 'rejected').count().get(),
        ])

        const counts = {
            pending: pendingSnap.data().count,
            live: liveSnap.data().count,
            rejected: rejectedSnap.data().count,
            total: pendingSnap.data().count + liveSnap.data().count + rejectedSnap.data().count
        }

        console.log(`[API /api/admin/services] Found ${services.length} services`)

        return NextResponse.json({
            success: true,
            data: services,
            counts,
            pagination: {
                count: services.length,
                offset,
                limit
            }
        })

    } catch (error) {
        console.error("[API /api/admin/services] Error fetching services:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch services' },
            { status: 500 }
        )
    }
}

/**
 * PATCH - Update a service (status, details, etc.)
 */
export async function PATCH(req: NextRequest) {
    console.log("[API /api/admin/services] PATCH - Updating service")

    try {
        const body = await req.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Service ID is required' },
                { status: 400 }
            )
        }

        // Validate status if provided
        if (updates.status) {
            const validStatuses = ['pending', 'live', 'rejected']
            if (!validStatuses.includes(updates.status)) {
                return NextResponse.json(
                    { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        // Build update object
        const updateData: Record<string, any> = {
            ...updates,
            updatedAt: FieldValue.serverTimestamp(),
        }

        // If status is being changed, add status history
        if (updates.status) {
            updateData.statusHistory = FieldValue.arrayUnion({
                status: updates.status,
                timestamp: new Date().toISOString(),
                note: updates.statusNote || null
            })
        }

        const db = getAdminDb()

        // Check if service exists
        const serviceRef = db.collection('services').doc(id)
        const serviceDoc = await serviceRef.get()

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        // Update the service
        await serviceRef.update(updateData)

        // Get the updated service
        const updatedDoc = await serviceRef.get()
        const updatedService = {
            id: updatedDoc.id,
            ...updatedDoc.data(),
            createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: updatedDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
        }

        console.log(`[API /api/admin/services] Service ${id} updated successfully`)

        return NextResponse.json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService
        })

    } catch (error) {
        console.error("[API /api/admin/services] Error updating service:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to update service' },
            { status: 500 }
        )
    }
}

/**
 * DELETE - Delete a service
 */
export async function DELETE(req: NextRequest) {
    console.log("[API /api/admin/services] DELETE - Deleting service")

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Service ID is required' },
                { status: 400 }
            )
        }

        const db = getAdminDb()

        // Check if service exists
        const serviceRef = db.collection('services').doc(id)
        const serviceDoc = await serviceRef.get()

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        // Delete the service
        await serviceRef.delete()

        console.log(`[API /api/admin/services] Service ${id} deleted successfully`)

        return NextResponse.json({
            success: true,
            message: 'Service deleted successfully'
        })

    } catch (error) {
        console.error("[API /api/admin/services] Error deleting service:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to delete service' },
            { status: 500 }
        )
    }
}
