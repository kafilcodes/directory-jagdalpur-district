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

// GET - Get all users with statistics
export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "50")
        const offset = parseInt(searchParams.get("offset") || "0")

        const db = getAdminDb()

        // Get all users
        const usersSnapshot = await db.collection("users").limit(limit).offset(offset).get()
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Get listings count for each user
        const listingsSnapshot = await db.collection("listings").get()
        const listingsByUser = new Map<string, number>()

        listingsSnapshot.docs.forEach(doc => {
            const ownerUid = doc.data().ownerUid
            if (ownerUid) {
                listingsByUser.set(ownerUid, (listingsByUser.get(ownerUid) || 0) + 1)
            }
        })

        // Combine users with listing counts
        const usersWithStats = users.map(user => ({
            ...user,
            listingsCount: listingsByUser.get(user.id as string) || 0
        }))

        return NextResponse.json({
            users: usersWithStats,
            total: usersSnapshot.size,
            limit,
            offset
        })
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        )
    }
}

// POST - Create new user (admin-created accounts)
export async function POST(request: NextRequest) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { email, displayName, role = "user" } = body

        if (!email || !displayName) {
            return NextResponse.json(
                { error: "email and displayName are required" },
                { status: 400 }
            )
        }

        const db = getAdminDb()

        // Create user document
        const userRef = db.collection("users").doc()
        await userRef.set({
            email,
            displayName,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        return NextResponse.json({
            success: true,
            message: "User created successfully",
            userId: userRef.id
        })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        )
    }
}
