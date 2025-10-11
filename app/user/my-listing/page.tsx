import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { MyListingClient } from "@/components/user/MyListingClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Get user's listing with complete details
 * Includes listing data, reviews from Google, plan info, and metadata
 */
async function getUserListing(userUid: string) {
    try {
        const db = getAdminDb()
        const snap = await db
            .collection("listings")
            .where("ownerUid", "==", userUid)
            .limit(1)
            .get()

        if (snap.empty) return { success: true, data: null }

        const doc = snap.docs[0]
        const data = doc.data() as any

        return {
            success: true,
            data: {
                id: doc.id,
                ...data,
                // Format timestamps for client
                createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
                updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
                publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt,
                expiryDate: data.expiryDate?.toMillis?.() || data.expiryDate,
            }
        }
    } catch (error) {
        console.error("[getUserListing] Error:", error)
        return { success: true, data: null }
    }
}

/**
 * Get listing analytics stats
 */
async function getListingStats(listingId: string) {
    try {
        const db = getAdminDb()
        const statsSnap = await db.collection("listingStats").doc(listingId).get()

        if (!statsSnap.exists) {
            return {
                totalImpressions: 0,
                totalClicks: 0,
                topKeywords: [],
                lastAggregated: null
            }
        }

        const stats = statsSnap.data()
        return {
            totalImpressions: stats?.totalImpressions || 0,
            totalClicks: stats?.totalClicks || 0,
            topKeywords: stats?.topKeywords || [],
            lastAggregated: stats?.lastAggregated?.toMillis?.() || stats?.lastAggregated || null
        }
    } catch (error) {
        console.error("[getListingStats] Error:", error)
        return {
            totalImpressions: 0,
            totalClicks: 0,
            topKeywords: [],
            lastAggregated: null
        }
    }
}

export default async function UserMyListingPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/" as any)
    }

    const listingResult = await getUserListing(user.uid)
    const listing = listingResult.data

    // No listing - redirect to create
    if (!listing) {
        redirect("/user/create-listing")
    }

    // Get stats if listing exists
    const stats = await getListingStats(listing.id)

    return (
        <MyListingClient
            listing={listing}
            stats={stats}
            userUid={user.uid}
        />
    )
}
