/**
 * Single Service API
 * 
 * GET: Get a single service by ID
 * PATCH: Update a service (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

/**
 * GET - Fetch a single service by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    console.log(`[API /api/services/${id}] GET - Fetching service`)

    try {
        const db = getAdminDb()
        const serviceRef = db.collection('services').doc(id)
        const serviceDoc = await serviceRef.get()

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        const serviceData = serviceDoc.data()

        // Increment view count (fire and forget)
        serviceRef.update({
            views: FieldValue.increment(1)
        }).catch(err => {
            console.error(`[API /api/services/${id}] Failed to increment views:`, err)
        })

        const service = {
            id: serviceDoc.id,
            ...serviceData,
            createdAt: serviceData?.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: serviceData?.updatedAt?.toDate?.()?.toISOString() || null,
        }

        console.log(`[API /api/services/${id}] Service found: ${serviceData?.name || 'Unknown'}`)

        return NextResponse.json({
            success: true,
            data: service
        })

    } catch (error) {
        console.error(`[API /api/services/${id}] Error:`, error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch service' },
            { status: 500 }
        )
    }
}

/**
 * PATCH - Update a service (admin use)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    console.log(`[API /api/services/${id}] PATCH - Updating service`)

    try {
        const body = await req.json()

        // Validate status if provided
        if (body.status) {
            const validStatuses = ['pending', 'live', 'rejected']
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json(
                    { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        const db = getAdminDb()
        const serviceRef = db.collection('services').doc(id)
        const serviceDoc = await serviceRef.get()

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        // Build update object
        const updateData: Record<string, any> = {
            ...body,
            updatedAt: FieldValue.serverTimestamp(),
        }

        // Remove id from updates if present
        delete updateData.id

        // If status is changing, add to history
        if (body.status) {
            updateData.statusHistory = FieldValue.arrayUnion({
                status: body.status,
                timestamp: new Date().toISOString(),
                note: body.statusNote || null
            })
            delete updateData.statusNote
        }

        await serviceRef.update(updateData)

        // Get updated document
        const updatedDoc = await serviceRef.get()
        const updatedData = updatedDoc.data()

        const updatedService = {
            id: updatedDoc.id,
            ...updatedData,
            createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || null,
        }

        console.log(`[API /api/services/${id}] Service updated successfully`)

        return NextResponse.json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService
        })

    } catch (error) {
        console.error(`[API /api/services/${id}] Error:`, error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to update service' },
            { status: 500 }
        )
    }
}

/**
 * DELETE - Delete a service
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    console.log(`[API /api/services/${id}] DELETE - Deleting service`)

    try {
        const db = getAdminDb()
        const serviceRef = db.collection('services').doc(id)
        const serviceDoc = await serviceRef.get()

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        await serviceRef.delete()

        console.log(`[API /api/services/${id}] Service deleted successfully`)

        return NextResponse.json({
            success: true,
            message: 'Service deleted successfully'
        })

    } catch (error) {
        console.error(`[API /api/services/${id}] Error:`, error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to delete service' },
            { status: 500 }
        )
    }
}
