"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminStore } from "@/stores/adminStore"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts"
import { Eye, Star, Target, BarChart3, PieChart as PieChartIcon, RefreshCw, TrendingUp } from "lucide-react"

interface AnalyticsData {
    listingsByPlan: Array<{ name: string; value: number; color: string }>
    listingsByCategory: Array<{ name: string; value: number }>
    paymentTrends: Array<{ month: string; revenue: number; count: number }>
    topListings: Array<{
        id: string
        name: string
        views: number
        category: string
    }>
}

const COLORS = {
    free: "#6B7280",      // gray-500
    sponsored: "#EF4444", // red-500
    featured: "#F59E0B",  // amber-500
}

const CHART_COLORS = [
    "#EF4444", // red-500
    "#F59E0B", // amber-500
    "#10B981", // emerald-500
    "#3B82F6", // blue-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#14B8A6", // teal-500
    "#F97316", // orange-500
]

export default function AnalyticsPage() {
    // Use Zustand store
    const { listings, payments, loading, fetchAllData, fetchListingEvents } = useAdminStore()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Calculate analytics when data is available
    useEffect(() => {
        if (listings.length > 0) {
            calculateAnalytics()
        }
    }, [listings, payments])

    const calculateAnalytics = async () => {
        try {
            setIsCalculating(true)

            // 1. Listings by Plan - Use plan field from Zustand store
            const planCounts = {
                free: 0,
                sponsored: 0,
                featured: 0
            }

            listings.forEach(listing => {
                // Primary: plan field, Fallbacks: monetization.type, activePlan.type
                const planType = listing.plan || (listing as any).monetization?.type || (listing as any).activePlan?.type || "free"
                if (planType === "sponsored") planCounts.sponsored++
                else if (planType === "featured") planCounts.featured++
                else planCounts.free++
            })

            const listingsByPlan = [
                { name: "Free", value: planCounts.free, color: COLORS.free },
                { name: "Sponsored", value: planCounts.sponsored, color: COLORS.sponsored },
                { name: "Featured", value: planCounts.featured, color: COLORS.featured },
            ].filter(item => item.value > 0)

            // 2. Listings by Category
            const categoryMap = new Map<string, number>()
            listings.forEach(listing => {
                const category = listing.categorySlug || listing.categories?.[0] || "other"
                categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
            })

            const listingsByCategory = Array.from(categoryMap.entries())
                .map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10) // Top 10 categories

            // 3. Payment Trends (last 6 months) - From Zustand cached payments
            console.log("Calculating payment trends from cached data...")
            const monthlyRevenue = new Map<string, { revenue: number; count: number }>()
            const now = new Date()

            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                monthlyRevenue.set(monthKey, { revenue: 0, count: 0 })
            }

            // Aggregate payments by month
            payments.forEach(payment => {
                if (payment.createdAt && payment.status === "completed") {
                    // createdAt is numeric timestamp (ms since epoch)
                    const paymentDate = new Date(payment.createdAt)
                    const monthKey = paymentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

                    if (monthlyRevenue.has(monthKey)) {
                        const current = monthlyRevenue.get(monthKey)!
                        monthlyRevenue.set(monthKey, {
                            revenue: current.revenue + (payment.amount || 0), // Use exact DB amount
                            count: current.count + 1
                        })
                    }
                }
            })

            const paymentTrends = Array.from(monthlyRevenue.entries()).map(([month, data]) => ({
                month,
                revenue: data.revenue, // Use exact amount - no rounding
                count: data.count
            }))

            // 4. Top Listings by Views - Use listings.views field directly (no subcollection)
            console.log("Calculating top listings from views field...")
            const topListings = listings
                .filter(listing => listing.status === "active" && listing.views) // Only active with views
                .map(listing => ({
                    id: listing.id,
                    name: listing.name || listing.title || listing.businessName || "Unnamed",
                    views: listing.views || 0,
                    category: listing.categorySlug || listing.categories?.[0] || "other"
                }))
                .sort((a, b) => b.views - a.views) // Sort by views descending
                .slice(0, 10) // Top 10

            setData({
                listingsByPlan,
                listingsByCategory,
                paymentTrends,
                topListings
            })
        } catch (error) {
            console.error("Error calculating analytics:", error)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleRefresh = async () => {
        await fetchAllData()
        await calculateAnalytics()
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-64 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Unable to load analytics data. Please try refreshing.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-2">Insights and trends for your directory platform</p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={loading || isCalculating}
                    variant="outline"
                    size="sm"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${(loading || isCalculating) ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Listings by Plan - Pie Chart */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-red-500" />
                            Plan Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                free: { label: "Free", color: "#6B7280" },
                                sponsored: { label: "Sponsored", color: "#EF4444" },
                                featured: { label: "Featured", color: "#F59E0B" },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.listingsByPlan}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                        animationEasing="ease-out"
                                    >
                                        {data.listingsByPlan.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {data.listingsByPlan.map((item) => (
                                <div key={item.name} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {((item.value / data.listingsByPlan.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Listings by Category - Bar Chart */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Top 10 Categories
                        </CardTitle>
                        <CardDescription>Most popular listing categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                value: { label: "Listings", color: "#EF4444" },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.listingsByCategory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                        stroke="#6B7280"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        stroke="#6B7280"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#EF4444"
                                        radius={[8, 8, 0, 0]}
                                        animationBegin={0}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Payment Trends - Area Chart */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Payment Trends (6 Months)
                        </CardTitle>
                        <CardDescription>Revenue and transaction volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                revenue: { label: "Revenue", color: "#EF4444" },
                                count: { label: "Transactions", color: "#10B981" },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.paymentTrends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        stroke="#6B7280"
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 12 }}
                                        stroke="#6B7280"
                                        label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 12 }}
                                        stroke="#6B7280"
                                        label={{ value: 'Transactions', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'revenue') return [`₹${value}`, 'Revenue']
                                            return [value, 'Transactions']
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationBegin={0}
                                        animationDuration={1200}
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        animationBegin={200}
                                        animationDuration={1200}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Top Listings - Enhanced Table */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Top 10 Listings by Views
                        </CardTitle>
                        <CardDescription>Most viewed listings this period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.topListings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No analytics data available yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Listings will appear as they get views</p>
                                </div>
                            ) : (
                                data.topListings.map((listing, index) => (
                                    <div
                                        key={listing.id}
                                        className="group flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 hover:border-red-200 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Badge
                                                variant={index < 3 ? "default" : "outline"}
                                                className={`flex-shrink-0 ${index === 0 ? "bg-amber-500" :
                                                    index === 1 ? "bg-gray-400" :
                                                        index === 2 ? "bg-orange-600" :
                                                            ""
                                                    }`}
                                            >
                                                #{index + 1}
                                            </Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                                    {listing.name}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    <Target className="h-3 w-3 inline mr-1" />
                                                    {listing.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                    <span className="font-bold text-sm">{listing.views}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500">views</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Stats */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{data.paymentTrends.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.paymentTrends.reduce((sum, item) => sum + item.count, 0)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">Avg. Transaction Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{Math.round(
                                    data.paymentTrends.reduce((sum, item) => sum + item.revenue, 0) /
                                    Math.max(1, data.paymentTrends.reduce((sum, item) => sum + item.count, 0))
                                ).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">Categories</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.listingsByCategory.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
