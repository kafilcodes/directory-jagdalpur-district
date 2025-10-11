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

// GET - Get comprehensive dashboard statistics
export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        if (!verifyAdminAccess(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const db = getAdminDb()

        // Fetch all necessary data in parallel
        const [listingsSnapshot, usersSnapshot] = await Promise.all([
            db.collection("listings").get(),
            db.collection("users").get()
        ])

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Process listings data
        let totalRevenue = 0
        let monthlyRevenue = 0
        let activeListings = 0
        let newListingsToday = 0
        let newListingsWeek = 0
        let newListingsMonth = 0
        const planCounts = { free: 0, sponsored: 0, featured: 0 }

        listingsSnapshot.docs.forEach(doc => {
            const data = doc.data()

            // Status counts
            if (data.status === "active") {
                activeListings++
            }

            // Plan counts
            const planType = data.monetization?.type || data.activePlan?.type || "free"
            if (planType in planCounts) {
                planCounts[planType as keyof typeof planCounts]++
            }

            // Revenue calculation
            if (data.receipts && Array.isArray(data.receipts)) {
                data.receipts.forEach((receipt: any) => {
                    const amount = receipt.amount / 100 // Convert paise to rupees
                    totalRevenue += amount

                    // Monthly revenue
                    if (receipt.createdAt?.toDate && receipt.createdAt.toDate() >= monthStart) {
                        monthlyRevenue += amount
                    }
                })
            }

            // New listings by date
            if (data.createdAt?.toDate) {
                const createdDate = data.createdAt.toDate()
                if (createdDate >= todayStart) {
                    newListingsToday++
                }
                if (createdDate >= weekStart) {
                    newListingsWeek++
                }
                if (createdDate >= monthStart) {
                    newListingsMonth++
                }
            }
        })

        // Process users data
        let newUsersToday = 0
        let newUsersWeek = 0
        let newUsersMonth = 0

        usersSnapshot.docs.forEach(doc => {
            const data = doc.data()
            if (data.createdAt?.toDate) {
                const createdDate = data.createdAt.toDate()
                if (createdDate >= todayStart) {
                    newUsersToday++
                }
                if (createdDate >= weekStart) {
                    newUsersWeek++
                }
                if (createdDate >= monthStart) {
                    newUsersMonth++
                }
            }
        })

        // Calculate conversion rate (users with listings / total users)
        const listingsByUser = new Map<string, number>()
        listingsSnapshot.docs.forEach(doc => {
            const ownerUid = doc.data().ownerUid
            if (ownerUid) {
                listingsByUser.set(ownerUid, (listingsByUser.get(ownerUid) || 0) + 1)
            }
        })
        const usersWithListings = listingsByUser.size
        const conversionRate = usersSnapshot.size > 0
            ? ((usersWithListings / usersSnapshot.size) * 100).toFixed(1)
            : "0"

        // Average revenue per listing
        const avgRevenue = planCounts.sponsored + planCounts.featured > 0
            ? (totalRevenue / (planCounts.sponsored + planCounts.featured)).toFixed(0)
            : "0"

        return NextResponse.json({
            listings: {
                total: listingsSnapshot.size,
                active: activeListings,
                newToday: newListingsToday,
                newWeek: newListingsWeek,
                newMonth: newListingsMonth,
                byPlan: planCounts
            },
            users: {
                total: usersSnapshot.size,
                newToday: newUsersToday,
                newWeek: newUsersWeek,
                newMonth: newUsersMonth,
                withListings: usersWithListings,
                conversionRate: parseFloat(conversionRate)
            },
            revenue: {
                total: totalRevenue,
                monthly: monthlyRevenue,
                average: parseFloat(avgRevenue)
            }
        })
    } catch (error) {
        console.error("Error fetching stats:", error)
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        )
    }
}
