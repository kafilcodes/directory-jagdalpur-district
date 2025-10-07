"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    TrendingUp, TrendingDown, Eye, MousePointerClick, Calendar,
    BarChart3, Activity, Users, Target, Award, Clock, ArrowUpRight,
    ArrowDownRight, Sparkles, Search
} from "lucide-react"
import { Sparkline } from "@/components/owner/Sparkline"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"

interface DashboardStats {
    myListing: any
    charts: {
        views: number[]
        clicks: number[]
    }
    totals: {
        todayViews: number
        todayClicks: number
        weekViews: number
        weekClicks: number
        weekViewsDelta: number
        weekClicksDelta: number
        monthViews: number
        monthClicks: number
        allTime: {
            views: number
            clicks: number
        }
    }
    errors: {
        events: any
        stats: any
    }
}

interface DashboardClientProps {
    stats: DashboardStats
}

export const DashboardClient = memo(function DashboardClient({ stats }: DashboardClientProps) {
    const { myListing, charts, totals, errors } = stats
    const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "14d" | "30d">("14d")

    // Calculate CTR (Click-Through Rate) - Memoized
    const calculateCTR = useCallback((clicks: number, views: number) => {
        if (views === 0) return 0
        return ((clicks / views) * 100).toFixed(1)
    }, [])

    const todayCTR = useMemo(() => calculateCTR(totals.todayClicks, totals.todayViews), [totals.todayClicks, totals.todayViews, calculateCTR])
    const weekCTR = useMemo(() => calculateCTR(totals.weekClicks, totals.weekViews), [totals.weekClicks, totals.weekViews, calculateCTR])
    const allTimeCTR = useMemo(() => calculateCTR(totals.allTime.clicks, totals.allTime.views), [totals.allTime.clicks, totals.allTime.views, calculateCTR])

    // Calculate engagement score (0-100) - Memoized
    const engagementScore = useMemo(() => {
        const viewWeight = 0.3
        const clickWeight = 0.7
        const maxViews = 1000 // Normalize against this
        const maxClicks = 100

        const viewScore = Math.min(100, (totals.weekViews / maxViews) * 100) * viewWeight
        const clickScore = Math.min(100, (totals.weekClicks / maxClicks) * 100) * clickWeight

        return Math.round(viewScore + clickScore)
    }, [totals.weekViews, totals.weekClicks])

    // Get date range for display - Memoized
    const { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd } = useMemo(() => {
        const now = new Date()
        return {
            thisWeekStart: startOfWeek(now, { weekStartsOn: 1 }),
            thisWeekEnd: endOfWeek(now, { weekStartsOn: 1 }),
            lastWeekStart: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
            lastWeekEnd: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        }
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                    Track your listing performance and analytics
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Views */}
                <Card className="relative overflow-hidden border-l-4 border-l-red-400 hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>Today's Views</CardDescription>
                            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-red-500" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {totals.todayViews}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            {totals.todayClicks} clicks · {todayCTR}% CTR
                        </p>
                    </CardContent>
                    <div className="absolute bottom-0 right-0 opacity-5">
                        <Activity className="h-24 w-24 text-red-500" />
                    </div>
                </Card>

                {/* This Week */}
                <Card className="relative overflow-hidden border-l-4 border-l-red-500 hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>This Week</CardDescription>
                            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {totals.weekViews}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge
                                variant={totals.weekViewsDelta >= 0 ? "default" : "destructive"}
                                className={cn(
                                    "text-xs",
                                    totals.weekViewsDelta >= 0
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                )}
                            >
                                {totals.weekViewsDelta >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                )}
                                {Math.abs(totals.weekViewsDelta)}
                            </Badge>
                            <span className="text-xs text-gray-500">vs last week</span>
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 right-0 opacity-5">
                        <BarChart3 className="h-24 w-24 text-red-500" />
                    </div>
                </Card>

                {/* Engagement Score */}
                <Card className="relative overflow-hidden border-l-4 border-l-red-600 hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>Engagement Score</CardDescription>
                            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-red-700" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold text-gray-900">
                                {engagementScore}
                            </div>
                            <div className="text-lg text-gray-500">/100</div>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                                style={{ width: `${engagementScore}%` }}
                            />
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 right-0 opacity-5">
                        <Target className="h-24 w-24 text-red-500" />
                    </div>
                </Card>

                {/* All-Time Total */}
                <Card className="relative overflow-hidden border-l-4 border-l-red-700 hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>All-Time Total</CardDescription>
                            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Award className="h-4 w-4 text-red-800" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {totals.allTime.views.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {totals.allTime.clicks} clicks · {allTimeCTR}% CTR
                        </p>
                    </CardContent>
                    <div className="absolute bottom-0 right-0 opacity-5">
                        <Users className="h-24 w-24 text-red-500" />
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-red-600" />
                                    Views Trend
                                </CardTitle>
                                <CardDescription>Last 14 days</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-lg font-bold">
                                {totals.monthViews}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <Sparkline
                                data={charts.views}
                                width={400}
                                height={80}
                                stroke="#ef4444"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                            <div>
                                <p className="text-xs text-gray-500">Today</p>
                                <p className="text-lg font-semibold">{totals.todayViews}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">This Week</p>
                                <p className="text-lg font-semibold">{totals.weekViews}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">14 Days</p>
                                <p className="text-lg font-semibold">{totals.monthViews}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Clicks Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MousePointerClick className="h-5 w-5 text-red-600" />
                                    Clicks Trend
                                </CardTitle>
                                <CardDescription>Last 14 days</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-lg font-bold">
                                {totals.monthClicks}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <Sparkline
                                data={charts.clicks}
                                width={400}
                                height={80}
                                stroke="#dc2626"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                            <div>
                                <p className="text-xs text-gray-500">Today</p>
                                <p className="text-lg font-semibold">{totals.todayClicks}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">This Week</p>
                                <p className="text-lg font-semibold">{totals.weekClicks}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">14 Days</p>
                                <p className="text-lg font-semibold">{totals.monthClicks}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Period Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Week Comparison</CardTitle>
                        <CardDescription>This week vs last week</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                                <div className="flex items-center gap-2">
                                    {totals.weekViewsDelta >= 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        totals.weekViewsDelta >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {Math.abs(totals.weekViewsDelta)}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        totals.weekViewsDelta >= 0 ? "bg-green-500" : "bg-red-500"
                                    )}
                                    style={{
                                        width: `${Math.min(100, Math.abs(totals.weekViewsDelta / totals.weekViews * 100))}%`
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Clicks</span>
                                <div className="flex items-center gap-2">
                                    {totals.weekClicksDelta >= 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        totals.weekClicksDelta >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {Math.abs(totals.weekClicksDelta)}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        totals.weekClicksDelta >= 0 ? "bg-green-500" : "bg-red-500"
                                    )}
                                    style={{
                                        width: `${Math.min(100, Math.abs(totals.weekClicksDelta / totals.weekClicks * 100))}%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">This Week</span>
                                <span className="font-medium">
                                    {format(thisWeekStart, "MMM d")} - {format(thisWeekEnd, "MMM d")}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Last Week</span>
                                <span className="font-medium">
                                    {format(lastWeekStart, "MMM d")} - {format(lastWeekEnd, "MMM d")}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Performance Metrics</CardTitle>
                        <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Click Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {weekCTR}%
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <MousePointerClick className="h-6 w-6 text-red-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg. Daily Views</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.round(totals.weekViews / 7)}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-red-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Engagement</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {engagementScore}/100
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>


        </div>
    )
})
