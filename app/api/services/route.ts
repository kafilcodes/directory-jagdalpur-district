/**
 * Services API
 * 
 * POST: Create a new service request (no auth required)
 * GET: Get services (with optional filters)
 * 
 * Services are gig worker profiles (electrician, plumber, etc.)
 * that can be submitted without authentication.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { Timestamp, FieldValue } from "firebase-admin/firestore"
import type { Service } from "@/types"

export const dynamic = "force-dynamic"

// Validation constants
const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif']

/**
 * POST - Create a new service request
 */
export async function POST(req: NextRequest) {
    console.log("[API /api/services] POST - Creating new service request")

    try {
        const body = await req.json()

        // Validate required fields
        const requiredFields = [
            'name',
            'service',
            'address',
            'whatsappNumber',
            'contactNumber',
            'workingHours',
            'chargesPerHour',
            'qualityRating'
        ]

        const missingFields = requiredFields.filter(field => !body[field])
        if (missingFields.length > 0) {
            console.log(`[API /api/services] Missing required fields: ${missingFields.join(', ')}`)
            return NextResponse.json(
                { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate phone numbers (basic Indian phone number validation)
        const phoneRegex = /^[6-9]\d{9}$/
        const cleanWhatsapp = body.whatsappNumber.replace(/\D/g, '').slice(-10)
        const cleanContact = body.contactNumber.replace(/\D/g, '').slice(-10)

        if (!phoneRegex.test(cleanWhatsapp)) {
            return NextResponse.json(
                { success: false, error: 'Invalid WhatsApp number. Please enter a valid 10-digit Indian mobile number.' },
                { status: 400 }
            )
        }

        if (!phoneRegex.test(cleanContact)) {
            return NextResponse.json(
                { success: false, error: 'Invalid contact number. Please enter a valid 10-digit Indian mobile number.' },
                { status: 400 }
            )
        }

        // Validate quality rating (1-5)
        const qualityRating = Number(body.qualityRating)
        if (isNaN(qualityRating) || qualityRating < 1 || qualityRating > 5) {
            return NextResponse.json(
                { success: false, error: 'Quality rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Validate charges per hour
        const chargesPerHour = Number(body.chargesPerHour)
        if (isNaN(chargesPerHour) || chargesPerHour < 0) {
            return NextResponse.json(
                { success: false, error: 'Charges per hour must be a positive number' },
                { status: 400 }
            )
        }

        // Create service slug from service type
        const serviceSlug = body.service
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim()

        // Build service document
        const serviceData: Omit<Service, 'id'> = {
            // Required fields
            name: body.name.trim(),
            service: body.service.trim(),
            serviceSlug,
            address: body.address.trim(),
            whatsappNumber: cleanWhatsapp,
            contactNumber: cleanContact,
            workingHours: body.workingHours.trim(),
            chargesPerHour,
            isNegotiable: Boolean(body.isNegotiable),
            qualityRating,

            // Optional fields
            profilePhoto: body.profilePhoto || undefined,
            blockOfCity: body.blockOfCity?.trim() || undefined,
            officeAddress: body.officeAddress?.trim() || undefined,
            experienceYears: body.experienceYears ? Number(body.experienceYears) : undefined,
            gender: body.gender || undefined,
            age: body.age ? Number(body.age) : undefined,
            aadharNumber: body.aadharNumber?.trim() || undefined,
            email: body.email?.trim() || undefined,
            website: body.website?.trim() || undefined,
            tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],

            // Status and metadata
            status: 'pending', // New services start as pending for admin approval
            views: 0,
            clicks: 0,
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any,
        }

        // Get Firestore instance
        const db = getAdminDb()

        // Check for duplicate (same name and phone number)
        const duplicateCheck = await db
            .collection('services')
            .where('name', '==', serviceData.name)
            .where('contactNumber', '==', serviceData.contactNumber)
            .limit(1)
            .get()

        if (!duplicateCheck.empty) {
            console.log(`[API /api/services] Duplicate service found for: ${serviceData.name}`)
            return NextResponse.json(
                { success: false, error: 'A service with this name and contact number already exists. Please contact support if you need to update your listing.' },
                { status: 409 }
            )
        }

        // Add to Firestore
        const docRef = await db.collection('services').add(serviceData)

        console.log(`[API /api/services] Service created successfully: ${docRef.id}`)

        return NextResponse.json({
            success: true,
            message: 'Service request submitted successfully! It will be reviewed by our team and will go live once approved.',
            id: docRef.id
        })

    } catch (error) {
        console.error("[API /api/services] Error creating service:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to create service' },
            { status: 500 }
        )
    }
}

/**
 * GET - Fetch services with optional filters
 */
export async function GET(req: NextRequest) {
    console.log("[API /api/services] GET - Fetching services")

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'live' // Default to live services
        const service = searchParams.get('service') // Filter by service type
        const limit = Number(searchParams.get('limit') || 20)
        const offset = Number(searchParams.get('offset') || 0)

        const db = getAdminDb()

        // Build query
        let query: FirebaseFirestore.Query = db.collection('services')

        // Filter by status (public API only shows 'live' services)
        if (status === 'live' || status === 'all') {
            if (status === 'live') {
                query = query.where('status', '==', 'live')
            }
        } else {
            // For non-live status, only show live (security measure)
            query = query.where('status', '==', 'live')
        }

        // Filter by service type
        if (service) {
            query = query.where('serviceSlug', '==', service.toLowerCase())
        }

        // Order by creation date (newest first)
        query = query.orderBy('createdAt', 'desc')

        // Apply pagination
        if (offset > 0) {
            query = query.offset(offset)
        }
        query = query.limit(limit)

        // Execute query
        const snapshot = await query.get()

        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        }))

        console.log(`[API /api/services] Found ${services.length} services`)

        return NextResponse.json({
            success: true,
            data: services,
            count: services.length,
            offset,
            limit
        })

    } catch (error) {
        console.error("[API /api/services] Error fetching services:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch services' },
            { status: 500 }
        )
    }
}
