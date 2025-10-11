import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): boolean {
    const adminPass = request.headers.get("x-admin-password")
    const expectedPass = process.env.NEXT_PUBLIC_ADMIN_PASS

    if (!adminPass || !expectedPass || adminPass !== expectedPass) {
        return false
    }

    return true
}

// GET - Get single listing details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id: listingId } = await params
        const db = getAdminDb()
        const listingDoc = await db.collection("listings").doc(listingId).get()

        if (!listingDoc.exists) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            id: listingDoc.id,
            ...listingDoc.data()
        })
    } catch (error) {
        console.error("Error fetching listing:", error)
        return NextResponse.json(
            { error: "Failed to fetch listing" },
            { status: 500 }
        )
    }
}

// PATCH - Update listing
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id: listingId } = await params
        const body = await request.json()

        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined)
        )

        // Add updatedAt timestamp
        updateData.updatedAt = new Date()

        const db = getAdminDb()
        await db.collection("listings").doc(listingId).update(updateData)

        return NextResponse.json({
            success: true,
            message: "Listing updated successfully"
        })
    } catch (error) {
        console.error("Error updating listing:", error)
        return NextResponse.json(
            { error: "Failed to update listing" },
            { status: 500 }
        )
    }
}

// DELETE - Delete listing
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id: listingId } = await params

        // Get listing data first to clean up associated resources
        const db = getAdminDb()
        const listingDoc = await db.collection("listings").doc(listingId).get()

        if (!listingDoc.exists) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            )
        }

        const listingData = listingDoc.data()

        // Delete listing document
        await db.collection("listings").doc(listingId).delete()

        // Note: Image cleanup would require Firebase Storage setup
        // For now, we just delete the document
        // TODO: Implement image cleanup from Firebase Storage

        return NextResponse.json({
            success: true,
            message: "Listing deleted successfully"
        })
    } catch (error) {
        console.error("Error deleting listing:", error)
        return NextResponse.json(
            { error: "Failed to delete listing" },
            { status: 500 }
        )
    }
}
