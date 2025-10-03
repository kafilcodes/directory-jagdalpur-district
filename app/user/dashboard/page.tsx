import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sparkline } from "@/components/owner/Sparkline"
import { safeQuery, logFirestoreError, isNotFoundError } from "@/lib/firebase/errorHandling"
import { AlertCircle, TrendingUp, Eye, MousePointerClick, FilePlus2 } from "lucide-react"
import Link from "next/link"

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
    const listingResult = await safeQuery(
        async () => {
            const snap = await db
                .collection("listings")
                .where("ownerUid", "==", userUid)
                .limit(1)
                .get()
            return snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as any) }
        },
        "Get user listing",
        "listings"
    )

    const myListing = listingResult.success ? listingResult.data : null

    // Get recent events (last 30 days)
    let myEvents: EventItem[] = []
    let eventsError = null

    if (myListing) {
        const since = Date.now() - 30 * 24 * 60 * 60 * 1000
        const eventsResult = await safeQuery(
            async () => {
                const evSnap = await db
                    .collection("listingEvents")
                    .doc(String(myListing.id))
                    .collection("events")
                    .where("ts", ">=", since)
                    .orderBy("ts", "asc")
                    .limit(2000)
                    .get()
                return evSnap.docs.map((d) => ({
                    type: (d.data() as any).type,
                    timestamp: Number((d.data() as any).ts || 0),
                }))
            },
            "Get listing events",
            "listingEvents/{listingId}/events"
        )

        if (eventsResult.success) {
            myEvents = eventsResult.data || []
        } else {
            eventsError = eventsResult.error
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
    let statsError = null

    if (myListing) {
        const statsResult = await safeQuery(
            async () => {
                const statsSnap = await db.collection("listingStats").doc(String(myListing.id)).get()
                if (!statsSnap.exists) return { views: 0, clicks: 0 }
                const s: any = statsSnap.data()
                return {
                    views: Number(s.views_total || 0),
                    clicks: Number(s.clicks_total || 0),
                }
            },
            "Get listing stats",
            "listingStats/{listingId}"
        )

        if (statsResult.success) {
            allTime = statsResult.data || { views: 0, clicks: 0 }
        } else {
            statsError = statsResult.error
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
        errors: {
            events: eventsError,
            stats: statsError,
        },
    }
}

export default async function UserDashboardPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Please sign in to view your dashboard.</p>
            </div>
        )
    }

    const { myListing, charts, totals, errors } = await getStats(user.uid)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your listing performance and analytics</p>
            </div>

            {/* No Listing State */}
            {!myListing && (
                <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="relative w-48 h-48 mb-6">
                            <img
                                src="/empty_search.svg"
                                alt="No listings"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No listing found</h3>
                        <p className="text-gray-600 mb-6 max-w-md">
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
            )}

            {/* Error Notices */}
            {(errors.events || errors.stats) && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900">Limited data available</p>
                                <p className="text-yellow-700 mt-1">
                                    Some analytics collections are not set up. Check console for details.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            {myListing && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                        {/* Today */}
                        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Today</p>
                                        <div className="text-3xl font-bold text-gray-900 mt-2">{totals.todayViews}</div>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <MousePointerClick className="h-3 w-3" />
                                            {totals.todayClicks} clicks
                                        </p>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Eye className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Last 7 Days */}
                        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Last 7 Days</p>
                                        <div className="text-3xl font-bold text-gray-900 mt-2">{totals.weekViews}</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totals.weekClicks} clicks
                                            <span
                                                className={`ml-1 font-semibold ${totals.weekViewsDelta >= 0 ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                ({totals.weekViewsDelta >= 0 ? "+" : ""}
                                                {totals.weekViewsDelta})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Last 14 Days */}
                        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Last 14 Days</p>
                                        <div className="text-3xl font-bold text-gray-900 mt-2">{totals.monthViews}</div>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <MousePointerClick className="h-3 w-3" />
                                            {totals.monthClicks} clicks
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* All-Time */}
                        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">All-Time</p>
                                        <div className="text-3xl font-bold text-gray-900 mt-2">{totals.allTime.views}</div>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <MousePointerClick className="h-3 w-3" />
                                            {totals.allTime.clicks} clicks
                                        </p>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <Eye className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Views (Last 14 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={charts.views} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Clicks (Last 14 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={charts.clicks} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Listing Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Your Listing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-medium">Business Name:</span>{" "}
                                    <span className="text-sm text-gray-700">{myListing.businessName}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">Category:</span>{" "}
                                    <span className="text-sm text-gray-700">{myListing.categorySlug}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">Status:</span>{" "}
                                    <span
                                        className={`text-sm ${myListing.isPublic ? "text-green-600" : "text-gray-500"
                                            }`}
                                    >
                                        {myListing.isPublic ? "Public" : "Draft"}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={"/user/my-listing" as any}
                                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 mt-4"
                            >
                                View Full Listing →
                            </Link>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
