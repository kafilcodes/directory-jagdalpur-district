"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAdminStore } from "@/stores/adminStore"
import {
    TrendingUp,
    Users,
    ListIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    Activity,
    Target,
    RefreshCw,
    IndianRupee
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    Tooltip
} from "recharts"

interface DashboardStats {
    totalListings: number
    activeListings: number
    totalUsers: number
    totalRevenue: number
    revenueThisMonth: number
    newListingsToday: number
    newListingsThisWeek: number
    newListingsThisMonth: number
    sponsoredListings: number
    featuredListings: number
}

interface ChartData {
    planDistribution: Array<{ name: string; value: number; fill: string }>
    weeklyGrowth: Array<{ day: string; listings: number; users: number }>
    monthlyRevenue: Array<{ month: string; revenue: number }>
    statusBreakdown: Array<{ name: string; value: number; fill: string }>
}

export default function AdminDashboard() {
    // Use Zustand store for centralized state management
    const {
        listings,
        users,
        payments,
        loading,
        error,
        fetchAllData,
        refreshData,
    } = useAdminStore()

    const [localChartData, setLocalChartData] = useState<ChartData | null>(null)

    // Fetch data on mount
    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Calculate stats from store data (memoized)
    const stats = useMemo(() => {
        if (listings.length === 0) return null

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const totalListings = listings.length
        const activeListings = listings.filter(l => l.status === 'active').length
        const sponsoredListings = listings.filter(l => l.plan === 'sponsored').length
        const featuredListings = listings.filter(l => l.plan === 'featured').length

        const newListingsToday = listings.filter(l => {
            const createdAt = l.createdAt?.toDate?.() || new Date(0)
            return createdAt >= todayStart
        }).length

        const newListingsThisWeek = listings.filter(l => {
            const createdAt = l.createdAt?.toDate?.() || new Date(0)
            return createdAt >= weekStart
        }).length

        const newListingsThisMonth = listings.filter(l => {
            const createdAt = l.createdAt?.toDate?.() || new Date(0)
            return createdAt >= monthStart
        }).length

        // Use exact amount from DB - no conversion
        const totalRevenue = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0)

        const revenueThisMonth = payments
            .filter(p => {
                const paymentDate = new Date(p.createdAt)
                return p.status === 'completed' && paymentDate >= monthStart
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0)

        return {
            totalListings,
            activeListings,
            totalUsers: users.length,
            totalRevenue,
            revenueThisMonth,
            newListingsToday,
            newListingsThisWeek,
            newListingsThisMonth,
            sponsoredListings,
            featuredListings,
        }
    }, [listings, users, payments])

    // Calculate chart data (memoized)
    useEffect(() => {
        if (listings.length === 0 || !stats) return

        calculateChartData()
    }, [listings, users, payments, stats])

    // Calculate chart data from store listings/users/payments
    const calculateChartData = () => {
        if (!stats) return

        console.log("📊 Calculating chart data from Zustand store...")

        // Plan Distribution (Pie Chart)
        const freeListings = stats.totalListings - stats.sponsoredListings - stats.featuredListings
        const planDistribution = [
            { name: "Free", value: freeListings, fill: "#6B7280" },
            { name: "Sponsored", value: stats.sponsoredListings, fill: "#EF4444" },
            { name: "Featured", value: stats.featuredListings, fill: "#F59E0B" },
        ].filter(item => item.value > 0)

        // Weekly Growth (Last 7 days) - From cached data
        const weeklyGrowth = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            // Count listings created on this day
            const dayListings = listings.filter(listing => {
                const createdAt = listing.createdAt?.toDate?.() || new Date(0)
                return createdAt >= date && createdAt < nextDate
            }).length

            // Count users created on this day
            const dayUsers = users.filter(user => {
                try {
                    const createdAt = typeof user.createdAt?.toDate === 'function'
                        ? user.createdAt.toDate()
                        : typeof user.createdAt === 'number'
                            ? new Date(user.createdAt)
                            : new Date(user.createdAt)
                    return createdAt >= date && createdAt < nextDate
                } catch {
                    return false
                }
            }).length

            weeklyGrowth.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                listings: dayListings,
                users: dayUsers
            })
        }

        // Monthly Revenue (Last 6 months) - From cached payments
        const monthlyRevenue = []
        for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

            // Aggregate revenue from payments in this month - use exact DB amount
            const monthRev = payments
                .filter(payment => {
                    if (payment.status !== "completed") return false
                    const paymentDate = new Date(payment.createdAt)
                    return paymentDate >= monthStart && paymentDate <= monthEnd
                })
                .reduce((sum, payment) => sum + (payment.amount || 0), 0)

            monthlyRevenue.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                revenue: monthRev
            })
        }

        // Status Breakdown
        const pendingListings = listings.filter(l => l.status === "pending").length
        const draftListings = listings.filter(l => l.status === "draft").length

        const statusBreakdown = [
            { name: "Active", value: stats.activeListings, fill: "#10B981" },
            { name: "Pending", value: pendingListings, fill: "#F59E0B" },
            { name: "Draft", value: draftListings, fill: "#6B7280" },
        ].filter(item => item.value > 0)

        const calculatedChartData: ChartData = {
            planDistribution,
            weeklyGrowth,
            monthlyRevenue,
            statusBreakdown
        }

        console.log("Chart data calculated:", calculatedChartData)
        setLocalChartData(calculatedChartData)
    }

    const StatCard = ({
        title,
        value,
        icon: Icon,
        trend,
        trendValue,
        subtitle
    }: {
        title: string
        value: string | number
        icon: any
        trend?: "up" | "down" | "neutral"
        trendValue?: string
        subtitle?: string
    }) => (
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-600"
                        }`}>
                        {trend === "up" ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div>
                    <Skeleton className="h-9 w-64 mb-3" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-4 w-32 mb-1" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-28 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[300px] w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Info Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center py-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="mb-4 text-red-500 text-lg font-semibold">Error Loading Dashboard</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={refreshData} variant="outline">
                    Try Again
                </Button>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Unable to load dashboard data. Please try refreshing.</p>
                <Button onClick={refreshData} variant="outline">
                    Reload Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Overview of your directory platform</p>
                </div>
                <Button
                    onClick={refreshData}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Listings"
                    value={stats.totalListings}
                    icon={ListIcon}
                    subtitle={`${stats.activeListings} active`}
                />

                <StatCard
                    title="New Today"
                    value={stats.newListingsToday}
                    icon={TrendingUp}
                    subtitle={`${stats.newListingsThisWeek} this week`}
                />

                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    subtitle="Registered accounts"
                />

                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                    icon={IndianRupee}
                    subtitle={`₹${stats.revenueThisMonth.toLocaleString('en-IN')} this month`}
                />

                <StatCard
                    title="Sponsored Listings"
                    value={stats.sponsoredListings}
                    icon={TrendingUp}
                    subtitle="Active sponsored plans"
                />

                <StatCard
                    title="Featured Listings"
                    value={stats.featuredListings}
                    icon={TrendingUp}
                    subtitle="Active featured plans"
                />

                <StatCard
                    title="New This Month"
                    value={stats.newListingsThisMonth}
                    icon={ListIcon}
                    subtitle="Month-to-date"
                />

                <StatCard
                    title="Free Listings"
                    value={stats.totalListings - stats.sponsoredListings - stats.featuredListings}
                    icon={ListIcon}
                    subtitle="Basic tier"
                />
            </div>

            {/* Charts Grid */}
            {localChartData && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Plan Distribution - Pie Chart */}
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-red-500" />
                                Plan Distribution
                            </CardTitle>
                            <CardDescription>Breakdown by listing type</CardDescription>
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
                                            data={localChartData.planDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {localChartData.planDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
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
                        </CardContent>
                    </Card>

                    {/* Status Breakdown - Pie Chart */}
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                Status Overview
                            </CardTitle>
                            <CardDescription>Listings by approval status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    active: { label: "Active", color: "#10B981" },
                                    pending: { label: "Pending", color: "#F59E0B" },
                                    draft: { label: "Draft", color: "#6B7280" },
                                }}
                                className="h-[300px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={localChartData.statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {localChartData.statusBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
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
                        </CardContent>
                    </Card>

                    {/* Weekly Growth - Area Chart */}
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Weekly Growth
                            </CardTitle>
                            <CardDescription>New listings and users (last 7 days)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    listings: { label: "Listings", color: "#EF4444" },
                                    users: { label: "Users", color: "#3B82F6" },
                                }}
                                className="h-[300px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={localChartData.weeklyGrowth}>
                                        <defs>
                                            <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="listings"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorListings)"
                                            animationBegin={0}
                                            animationDuration={1000}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="users"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorUsers)"
                                            animationBegin={200}
                                            animationDuration={1000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Monthly Revenue - Bar Chart */}
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5 text-emerald-500" />
                                Revenue Trend
                            </CardTitle>
                            <CardDescription>Last 6 months revenue (₹)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    revenue: { label: "Revenue", color: "#10B981" },
                                }}
                                className="h-[300px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={localChartData.monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                            formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="#10B981"
                                            radius={[8, 8, 0, 0]}
                                            animationBegin={0}
                                            animationDuration={1000}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Info */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Active Listings</span>
                        <span className="font-medium text-gray-900">{stats.activeListings}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Conversion Rate (Free → Paid)</span>
                        <span className="font-medium text-gray-900">
                            {stats.totalListings > 0
                                ? Math.round(((stats.sponsoredListings + stats.featuredListings) / stats.totalListings) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Average Revenue per Paid Listing</span>
                        <span className="font-medium text-gray-900">
                            {(stats.sponsoredListings + stats.featuredListings) > 0
                                ? `₹${Math.round(stats.totalRevenue / (stats.sponsoredListings + stats.featuredListings)).toLocaleString('en-IN')}`
                                : '₹0'}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
