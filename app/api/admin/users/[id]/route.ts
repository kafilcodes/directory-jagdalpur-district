import { NextRequest, NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebase/admin"
import { getAuth } from "firebase-admin/auth"

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): boolean {
    const adminPass = request.headers.get("x-admin-password")
    const expectedPass = process.env.NEXT_PUBLIC_ADMIN_PASS

    if (!adminPass || !expectedPass || adminPass !== expectedPass) {
        return false
    }

    return true
}

// GET - Get single user details
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

        const { id: userId } = await params
        const db = getAdminDb()

        // Get user document from Firestore
        const userDoc = await db.collection("users").doc(userId).get()

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Get user's listings count
        const listingsSnapshot = await db
            .collection("listings")
            .where("ownerUid", "==", userId)
            .get()

        return NextResponse.json({
            id: userDoc.id,
            ...userDoc.data(),
            listingsCount: listingsSnapshot.size
        })
    } catch (error) {
        console.error("Error fetching user:", error)
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        )
    }
}

// PATCH - Update user
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

        const { id: userId } = await params
        const body = await request.json()

        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined)
        )

        // Add updatedAt timestamp
        updateData.updatedAt = new Date()

        const db = getAdminDb()
        await db.collection("users").doc(userId).update(updateData)

        return NextResponse.json({
            success: true,
            message: "User updated successfully"
        })
    } catch (error) {
        console.error("Error updating user:", error)
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        )
    }
}

// DELETE - Delete user (Firestore + Auth)
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

        const { id: userId } = await params
        const db = getAdminDb()

        // Check if user exists
        const userDoc = await db.collection("users").doc(userId).get()

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Delete user from Firestore
        await db.collection("users").doc(userId).delete()

        // Try to delete from Firebase Auth (optional - may not exist)
        try {
            const app = getAdminApp()
            const auth = getAuth(app)
            await auth.deleteUser(userId)
        } catch (authError) {
            console.warn("Could not delete user from Auth (may not exist):", authError)
            // Continue even if auth deletion fails
        }

        return NextResponse.json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        )
    }
}
