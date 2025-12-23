import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { MyListingsClient } from "@/components/user/MyListingsClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Maximum listings allowed per user
const MAX_LISTINGS_PER_USER = 100

/**
 * Listing type for client component
 */
export interface UserListing {
    id: string
    name: string
    category: string
    categorySlug: string
    address: string
    plan: 'free' | 'sponsored' | 'featured'
    status: string
    isPublic: boolean
    rating: number
    userRatingCount: number
    photos: string[]
    createdAt: number
    updatedAt: number | null
    expiryDate: number | null
    views: number
    clicks: number
}

/**
 * Get all user's listings with summary data
 */
async function getUserListings(userUid: string): Promise<{ success: boolean; listings: UserListing[] }> {
    try {
        const db = getAdminDb()
        const snap = await db
            .collection("listings")
            .where("ownerUid", "==", userUid)
            .orderBy("createdAt", "desc")
            .limit(MAX_LISTINGS_PER_USER)
            .get()

        if (snap.empty) return { success: true, listings: [] }

        const listings: UserListing[] = snap.docs.map(doc => {
            const data = doc.data() as any
            return {
                id: doc.id,
                name: data.name || data.businessName || data.title || "Untitled",
                category: data.category || "",
                categorySlug: data.categorySlug || "",
                address: typeof data.address === 'string' ? data.address :
                    (data.address?.formattedAddress || data.address?.line1 || ""),
                plan: data.plan || "free",
                status: data.status || "active",
                isPublic: data.isPublic !== false,
                rating: data.rating || 0,
                userRatingCount: data.userRatingCount || 0,
                photos: data.photos || [],
                createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
                updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || null,
                expiryDate: data.expiryDate?.toMillis?.() || data.expiryDate || null,
                views: data.views || 0,
                clicks: data.clicks || 0,
            }
        })

        return { success: true, listings }
    } catch (error) {
        console.error("[getUserListings] Error:", error)
        return { success: true, listings: [] }
    }
}

/**
 * Get aggregated stats for all user listings
 * Sums views and clicks directly from the listings data
 */
function getAggregatedStatsFromListings(listings: UserListing[]) {
    const totalImpressions = listings.reduce((sum, listing) => sum + (listing.views || 0), 0)
    const totalClicks = listings.reduce((sum, listing) => sum + (listing.clicks || 0), 0)
    return {
        totalImpressions,
        totalClicks,
        topKeywords: [] as { term: string; imp: number; clk: number }[]
    }
}

/**
 * Get aggregated stats for all user listings (legacy - kept for compatibility)
 */
async function getAggregatedStats(listingIds: string[]) {
    if (listingIds.length === 0) {
        return {
            totalImpressions: 0,
            totalClicks: 0,
            topKeywords: []
        }
    }

    try {
        const db = getAdminDb()
        let totalImpressions = 0
        let totalClicks = 0
        const allKeywords: { term: string; imp: number; clk: number }[] = []

        // Fetch stats for all listings
        const statsPromises = listingIds.map(id =>
            db.collection("listingStats").doc(id).get()
        )
        const statsDocs = await Promise.all(statsPromises)

        statsDocs.forEach(statsSnap => {
            if (statsSnap.exists) {
                const stats = statsSnap.data()
                totalImpressions += stats?.totalImpressions || 0
                totalClicks += stats?.totalClicks || 0
                if (stats?.topKeywords) {
                    allKeywords.push(...stats.topKeywords)
                }
            }
        })

        // Aggregate and sort top keywords
        const keywordMap = new Map<string, { imp: number; clk: number }>()
        allKeywords.forEach(kw => {
            const existing = keywordMap.get(kw.term) || { imp: 0, clk: 0 }
            keywordMap.set(kw.term, {
                imp: existing.imp + kw.imp,
                clk: existing.clk + kw.clk
            })
        })

        const topKeywords = Array.from(keywordMap.entries())
            .map(([term, data]) => ({ term, ...data }))
            .sort((a, b) => b.imp - a.imp)
            .slice(0, 10)

        return {
            totalImpressions,
            totalClicks,
            topKeywords
        }
    } catch (error) {
        console.error("[getAggregatedStats] Error:", error)
        return {
            totalImpressions: 0,
            totalClicks: 0,
            topKeywords: []
        }
    }
}

export default async function UserMyListingPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/" as any)
    }

    const { listings } = await getUserListings(user.uid)

    // No listings - redirect to create
    if (listings.length === 0) {
        redirect("/user/create-listing")
    }

    // Get aggregated stats directly from listings data (views and clicks summed from each listing)
    const aggregatedStats = getAggregatedStatsFromListings(listings)

    // Calculate listing stats
    const listingStats = {
        total: listings.length,
        maxAllowed: MAX_LISTINGS_PER_USER,
        remaining: MAX_LISTINGS_PER_USER - listings.length,
        free: listings.filter(l => l.plan === 'free').length,
        sponsored: listings.filter(l => l.plan === 'sponsored').length,
        featured: listings.filter(l => l.plan === 'featured').length,
        live: listings.filter(l => l.isPublic && l.status === 'active').length,
        draft: listings.filter(l => !l.isPublic || l.status !== 'active').length,
    }

    return (
        <MyListingsClient
            listings={listings}
            listingStats={listingStats}
            aggregatedStats={aggregatedStats}
            userUid={user.uid}
        />
    )
}
