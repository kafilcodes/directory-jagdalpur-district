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

// POST - Bulk operations on listings
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
        const { action, listingIds, updateData } = body

        if (!action || !listingIds || !Array.isArray(listingIds)) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            )
        }

        const db = getAdminDb()
        const batch = db.batch()
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        switch (action) {
            case "delete":
                for (const listingId of listingIds) {
                    try {
                        const docRef = db.collection("listings").doc(listingId)
                        batch.delete(docRef)
                        results.success++
                    } catch (error) {
                        results.failed++
                        results.errors.push(`Failed to delete ${listingId}`)
                    }
                }
                break

            case "update":
                if (!updateData) {
                    return NextResponse.json(
                        { error: "updateData is required for update action" },
                        { status: 400 }
                    )
                }

                const dataToUpdate = {
                    ...updateData,
                    updatedAt: new Date()
                }

                for (const listingId of listingIds) {
                    try {
                        const docRef = db.collection("listings").doc(listingId)
                        batch.update(docRef, dataToUpdate)
                        results.success++
                    } catch (error) {
                        results.failed++
                        results.errors.push(`Failed to update ${listingId}`)
                    }
                }
                break

            case "change-status":
                if (!updateData?.status) {
                    return NextResponse.json(
                        { error: "status is required in updateData for change-status action" },
                        { status: 400 }
                    )
                }

                for (const listingId of listingIds) {
                    try {
                        const docRef = db.collection("listings").doc(listingId)
                        batch.update(docRef, {
                            status: updateData.status,
                            updatedAt: new Date()
                        })
                        results.success++
                    } catch (error) {
                        results.failed++
                        results.errors.push(`Failed to change status for ${listingId}`)
                    }
                }
                break

            case "change-plan":
                if (!updateData?.plan) {
                    return NextResponse.json(
                        { error: "plan is required in updateData for change-plan action" },
                        { status: 400 }
                    )
                }

                for (const listingId of listingIds) {
                    try {
                        const docRef = db.collection("listings").doc(listingId)
                        batch.update(docRef, {
                            "monetization.type": updateData.plan,
                            updatedAt: new Date()
                        })
                        results.success++
                    } catch (error) {
                        results.failed++
                        results.errors.push(`Failed to change plan for ${listingId}`)
                    }
                }
                break

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

        // Commit the batch
        await batch.commit()

        return NextResponse.json({
            success: true,
            message: `Bulk ${action} completed`,
            results
        })
    } catch (error) {
        console.error("Error performing bulk operation:", error)
        return NextResponse.json(
            { error: "Failed to perform bulk operation" },
            { status: 500 }
        )
    }
}
