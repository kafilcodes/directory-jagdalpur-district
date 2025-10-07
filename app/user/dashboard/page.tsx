import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { DashboardClient } from "@/components/user/DashboardClient"
import { Card, CardContent } from "@/components/ui/card"
import { FilePlus2 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"

export const dynamic = "force-dynamic"

type EventItem = {
    type: string
    timestamp: number
    listingId?: string | null
    path?: string | null
}

/**
 * Bucket events into daily counts for last N days
 */
function bucketLastNDays(events: EventItem[], n: number) {
    const dayMs = 24 * 60 * 60 * 1000
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const startTs = end.getTime() - (n - 1) * dayMs

    const labels: string[] = []
    const views: number[] = []
    const clicks: number[] = []

    for (let i = 0; i < n; i++) {
        labels.push("")
        views.push(0)
        clicks.push(0)
    }

    for (const e of events) {
        if (!e.timestamp || e.timestamp < startTs) continue

        const idx = Math.min(n - 1, Math.floor((e.timestamp - startTs) / dayMs))
        if (idx >= 0 && idx < n) {
            if (e.type === "view") views[idx] += 1
            if (e.type === "click") clicks[idx] += 1
        }
    }

    return { labels, views, clicks }
}

/**
 * Get analytics stats for user's listing
 * Gracefully handles missing collections/documents
 */
async function getStats(userUid: string) {
    const db = getAdminDb()

    // Find user's listing
    let myListing = null
    try {
        const snap = await db
            .collection("listings")
            .where("ownerUid", "==", userUid)
            .limit(1)
            .get()
        myListing = snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as any) }
    } catch (error) {
        // Gracefully handle missing collection
        myListing = null
    }

    // Get recent events (last 30 days)
    let myEvents: EventItem[] = []

    if (myListing) {
        const since = Date.now() - 30 * 24 * 60 * 60 * 1000
        try {
            const evSnap = await db
                .collection("listingEvents")
                .doc(String(myListing.id))
                .collection("events")
                .where("ts", ">=", since)
                .orderBy("ts", "asc")
                .limit(2000)
                .get()
            myEvents = evSnap.docs.map((d) => ({
                type: (d.data() as any).type,
                timestamp: Number((d.data() as any).ts || 0),
            }))
        } catch (error) {
            // Gracefully handle missing events
            console.error("Error fetching events:", error)
        }
    }

    // Calculate daily buckets
    const { views, clicks } = bucketLastNDays(myEvents, 14)
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

    const todayViews = views.at(-1) || 0
    const todayClicks = clicks.at(-1) || 0
    const weekViews = sum(views.slice(-7))
    const weekClicks = sum(clicks.slice(-7))
    const prevWeekViews = sum(views.slice(-14, -7))
    const prevWeekClicks = sum(clicks.slice(-14, -7))
    const weekViewsDelta = weekViews - prevWeekViews
    const weekClicksDelta = weekClicks - prevWeekClicks
    const monthViews = sum(views)
    const monthClicks = sum(clicks)

    // Get all-time stats from listingStats collection
    let allTime = { views: 0, clicks: 0 }

    if (myListing) {
        try {
            const statsSnap = await db.collection("listingStats").doc(String(myListing.id)).get()
            if (statsSnap.exists) {
                const s: any = statsSnap.data()
                allTime = {
                    views: Number(s.views_total || 0),
                    clicks: Number(s.clicks_total || 0),
                }
            }
        } catch (error) {
            // Gracefully handle missing stats
            console.error("Error fetching stats:", error)
        }
    }

    return {
        myListing,
        charts: { views, clicks },
        totals: {
            todayViews,
            todayClicks,
            weekViews,
            weekClicks,
            weekViewsDelta,
            weekClicksDelta,
            monthViews,
            monthClicks,
            allTime,
        },
    }
}

export default async function UserDashboardPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login" as any)
    }

    const stats = await getStats(user.uid)

    // No listing state
    if (!stats.myListing) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Track your listing performance and analytics</p>
                </div>

                <Card className="border-0 shadow-none bg-gray-50/50 dark:bg-gray-900/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="relative w-48 h-48 mb-6">
                            <Image
                                src="/empty_search.svg"
                                alt="No listings"
                                fill
                                sizes="192px"
                                className="object-contain"
                            />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No listing found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                            Create your first listing to start tracking analytics and grow your business
                        </p>
                        <Link
                            href={"/user/create-listing" as any}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-medium text-white hover:from-red-700 hover:to-red-600 transition-all shadow-sm hover:shadow-md"
                        >
                            <FilePlus2 className="h-4 w-4" />
                            Create Your First Listing
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Pass data to client component with errors property
    const statsWithErrors = {
        ...stats,
        errors: { events: null, stats: null }
    }

    return <DashboardClient stats={statsWithErrors} />
}
