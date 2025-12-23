"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
    Search,
    MoreVertical,
    Trash2,
    Eye,
    MapPin,
    Phone,
    Star,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    User,
    IndianRupee,
    Briefcase,
    Loader2,
    TrendingUp,
    BarChart3,
    CheckSquare,
    Square,
    AlertTriangle,
    ArrowUpDown,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow
} from "lucide-react"
import { toast } from "sonner"
import { SERVICE_CATEGORIES, getServiceCategoryBySlug } from "@/config/services"
import ServiceDetailDialog from "@/components/admin/ServiceDetailDialog"
import type { Service } from "@/types"

type ServiceCounts = {
    pending: number
    live: number
    rejected: number
    total: number
}

// Chart configuration
const statusChartConfig = {
    live: { label: "Live", color: "hsl(142, 71%, 45%)" },
    pending: { label: "Pending", color: "hsl(45, 93%, 47%)" },
    rejected: { label: "Rejected", color: "hsl(0, 84%, 60%)" },
}

const CHART_COLORS = {
    live: "#22c55e",
    pending: "#eab308",
    rejected: "#ef4444"
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [counts, setCounts] = useState<ServiceCounts>({ pending: 0, live: 0, rejected: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Dialog states
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    // Service detail dialog
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    // Bulk selection states
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkActionLoading, setBulkActionLoading] = useState(false)
    const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [bulkTargetStatus, setBulkTargetStatus] = useState<'pending' | 'live' | 'rejected'>('live')
    const [deleteConfirmText, setDeleteConfirmText] = useState("")

    // Fetch services
    const fetchServices = async (showToast = false) => {
        try {
            setRefreshing(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            // Don't send 'other' to API - will be filtered client-side
            if (serviceTypeFilter !== 'all' && serviceTypeFilter !== 'other') {
                params.set('service', serviceTypeFilter)
            }
            params.set('limit', '100')

            const response = await fetch(`/api/admin/services?${params.toString()}`)
            const result = await response.json()

            if (result.success) {
                setServices(result.data)
                setCounts(result.counts)
                if (showToast) toast.success("Services refreshed")
            } else {
                toast.error(result.error || "Failed to fetch services")
            }
        } catch (error) {
            console.error("Error fetching services:", error)
            toast.error("Failed to fetch services")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Get all predefined category slugs for "other" filter
    const predefinedSlugs = useMemo(() =>
        SERVICE_CATEGORIES.map(cat => cat.slug),
        []
    )

    useEffect(() => {
        fetchServices()
    }, [statusFilter, serviceTypeFilter])

    // Filtered services (client-side search and "other" category filter)
    const filteredServices = useMemo(() => {
        let result = services

        // Handle "other" category filter (services not in predefined categories)
        if (serviceTypeFilter === 'other') {
            result = result.filter(service => {
                const slug = service.serviceSlug || service.service?.toLowerCase()
                return !predefinedSlugs.includes(slug)
            })
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(service =>
                service.name?.toLowerCase().includes(query) ||
                service.service?.toLowerCase().includes(query) ||
                service.address?.toLowerCase().includes(query) ||
                service.contactNumber?.includes(query)
            )
        }

        // Apply sorting
        result = [...result].sort((a, b) => {
            const getTime = (timestamp: any): number => {
                if (!timestamp) return 0
                if (timestamp.seconds) return timestamp.seconds * 1000
                return new Date(timestamp).getTime()
            }
            const timeA = getTime(a.createdAt)
            const timeB = getTime(b.createdAt)
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
        })

        return result
    }, [services, searchQuery, serviceTypeFilter, predefinedSlugs, sortOrder])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, serviceTypeFilter])

    // Handle status update
    const handleStatusUpdate = async (serviceId: string, newStatus: 'pending' | 'live' | 'rejected') => {
        setUpdatingId(serviceId)
        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Service ${newStatus === 'live' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'}`)
                fetchServices()
                // Update selected service if it's open
                if (selectedService?.id === serviceId) {
                    setSelectedService(prev => prev ? { ...prev, status: newStatus } : null)
                }
            } else {
                toast.error(result.error || "Failed to update service")
            }
        } catch (error) {
            console.error("Error updating service:", error)
            toast.error("Failed to update service")
        } finally {
            setUpdatingId(null)
        }
    }

    // Handle delete
    const handleDeleteClick = (serviceId: string) => {
        setServiceToDelete(serviceId)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return

        try {
            const response = await fetch(`/api/services/${serviceToDelete}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Service deleted successfully")
                fetchServices()
            } else {
                toast.error(result.error || "Failed to delete service")
            }
        } catch (error) {
            console.error("Error deleting service:", error)
            toast.error("Failed to delete service")
        } finally {
            setIsDeleteDialogOpen(false)
            setServiceToDelete(null)
        }
    }

    // View service details
    const handleViewService = (service: Service) => {
        setSelectedService(service)
        setIsDetailDialogOpen(true)
    }

    // Bulk selection helpers
    const toggleSelectService = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }, [])

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    // Bulk status update handler
    const handleBulkStatusUpdate = async () => {
        if (selectedIds.size === 0) return

        setBulkActionLoading(true)
        try {
            const updatePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/services/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: bulkTargetStatus })
                })
            )

            const results = await Promise.allSettled(updatePromises)
            const successCount = results.filter(r => r.status === 'fulfilled').length

            if (successCount > 0) {
                toast.success(`${successCount} service(s) updated to ${bulkTargetStatus}`)
                fetchServices()
                setSelectedIds(new Set())
            }
            if (successCount < selectedIds.size) {
                toast.error(`${selectedIds.size - successCount} service(s) failed to update`)
            }
        } catch (error) {
            console.error("Bulk status update error:", error)
            toast.error("Failed to update services")
        } finally {
            setBulkActionLoading(false)
            setBulkStatusDialogOpen(false)
        }
    }

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0 || deleteConfirmText !== 'delete') return

        setBulkActionLoading(true)
        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/services/${id}`, {
                    method: 'DELETE'
                })
            )

            const results = await Promise.allSettled(deletePromises)
            const successCount = results.filter(r => r.status === 'fulfilled').length

            if (successCount > 0) {
                toast.success(`${successCount} service(s) deleted`)
                fetchServices()
                setSelectedIds(new Set())
            }
            if (successCount < selectedIds.size) {
                toast.error(`${selectedIds.size - successCount} service(s) failed to delete`)
            }
        } catch (error) {
            console.error("Bulk delete error:", error)
            toast.error("Failed to delete services")
        } finally {
            setBulkActionLoading(false)
            setBulkDeleteDialogOpen(false)
            setDeleteConfirmText("")
        }
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return <Badge className="bg-emerald-500/90 text-white border-0 shadow-sm">Live</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/90 text-white border-0 shadow-sm">Pending</Badge>
            case 'rejected':
                return <Badge className="bg-red-500/90 text-white border-0 shadow-sm">Rejected</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Render star rating
    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="text-xs ml-1 text-gray-600">{rating.toFixed(1)}</span>
            </div>
        )
    }

    // Chart data
    const statusChartData = useMemo(() => [
        { name: "Live", value: counts.live, fill: CHART_COLORS.live },
        { name: "Pending", value: counts.pending, fill: CHART_COLORS.pending },
        { name: "Rejected", value: counts.rejected, fill: CHART_COLORS.rejected },
    ], [counts])

    // Service type distribution
    const serviceTypeData = useMemo(() => {
        const typeCounts: Record<string, number> = {}
        services.forEach(s => {
            const type = s.serviceSlug || s.service || "other"
            typeCounts[type] = (typeCounts[type] || 0) + 1
        })

        return Object.entries(typeCounts)
            .map(([slug, count]) => {
                const cat = getServiceCategoryBySlug(slug)
                return {
                    name: cat?.label || slug,
                    value: count,
                    icon: cat?.icon || "🔧"
                }
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
    }, [services])

    // Pagination
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentServices = filteredServices.slice(startIndex, startIndex + itemsPerPage)

    // Bulk selection helpers that depend on currentServices
    const selectAllOnPage = useCallback(() => {
        const pageIds = currentServices.map(s => s.id)
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            pageIds.forEach(id => newSet.add(id))
            return newSet
        })
    }, [currentServices])

    const isAllOnPageSelected = useMemo(() => {
        if (currentServices.length === 0) return false
        return currentServices.every(s => selectedIds.has(s.id))
    }, [currentServices, selectedIds])

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                    <Skeleton className="h-7 w-40 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardContent className="pt-4">
                                <Skeleton className="h-10 w-16 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table Skeleton */}
                <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Services</h1>
                    <p className="text-sm sm:text-base text-gray-600">Manage gig worker service listings</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchServices(true)}
                    disabled={refreshing}
                    className="shadow-sm hover:shadow-md transition-shadow self-start sm:self-auto"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-blue-100 rounded-xl shadow-sm">
                                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{counts.total}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-yellow-100 rounded-xl shadow-sm">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{counts.pending}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-emerald-100 rounded-xl shadow-sm">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{counts.live}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Live</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-red-100 rounded-xl shadow-sm">
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{counts.rejected}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            {counts.total > 0 && (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {/* Status Distribution Chart */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={statusChartConfig} className="h-[180px] sm:h-[200px] w-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={statusChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Service Types Chart */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                Top Service Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    value: { label: "Services", color: "hsl(0, 84%, 60%)" }
                                }}
                                className="h-[180px] sm:h-[200px] w-full"
                            >
                                <BarChart data={serviceTypeData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={80}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar
                                        dataKey="value"
                                        fill="hsl(0, 84%, 60%)"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-4">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Search */}
                        <div className="sm:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, service, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-gray-50 border-0 shadow-sm focus:shadow-md transition-shadow"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-gray-50 border-0 shadow-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur shadow-xl border-0">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-yellow-500" />
                                        Pending
                                    </span>
                                </SelectItem>
                                <SelectItem value="live">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                                        Live
                                    </span>
                                </SelectItem>
                                <SelectItem value="rejected">
                                    <span className="flex items-center gap-2">
                                        <XCircle className="h-3 w-3 text-red-500" />
                                        Rejected
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Service Type Filter */}
                        <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                            <SelectTrigger className="bg-gray-50 border-0 shadow-sm">
                                <SelectValue placeholder="Service Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur shadow-xl border-0 max-h-[300px]">
                                <SelectItem value="all">All Services</SelectItem>
                                {SERVICE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.slug} value={cat.slug}>
                                        <span className="flex items-center gap-2">
                                            <span>{cat.icon}</span>
                                            {cat.label}
                                        </span>
                                    </SelectItem>
                                ))}
                                <SelectItem value="other">
                                    <span className="flex items-center gap-2">
                                        <span>📦</span>
                                        Others / Custom
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Order */}
                        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                            <SelectTrigger className="bg-gray-50 border-0 shadow-sm">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur shadow-xl border-0">
                                <SelectItem value="newest">
                                    <span className="flex items-center gap-2">
                                        <ArrowDownWideNarrow className="h-3.5 w-3.5 text-gray-500" />
                                        Newest First
                                    </span>
                                </SelectItem>
                                <SelectItem value="oldest">
                                    <span className="flex items-center gap-2">
                                        <ArrowUpWideNarrow className="h-3.5 w-3.5 text-gray-500" />
                                        Oldest First
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Action Bar - Show when items selected */}
            {selectedIds.size > 0 && (
                <Card className="border-0 shadow-lg bg-white sticky top-0 z-20">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    {selectedIds.size} selected
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={deselectAll}
                                    className="text-gray-600"
                                >
                                    Clear selection
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="shadow-sm">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Set Status
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white/95 backdrop-blur shadow-xl border-0">
                                        <DropdownMenuItem onClick={() => {
                                            setBulkTargetStatus('live')
                                            setBulkStatusDialogOpen(true)
                                        }}>
                                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                            <span className="text-emerald-600">Approve (Live)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setBulkTargetStatus('pending')
                                            setBulkStatusDialogOpen(true)
                                        }}>
                                            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                                            <span className="text-yellow-600">Set Pending</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setBulkTargetStatus('rejected')
                                            setBulkStatusDialogOpen(true)
                                        }}>
                                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                            <span className="text-red-600">Reject</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setBulkDeleteDialogOpen(true)}
                                    className="shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Services List */}
            {filteredServices.length === 0 ? (
                <Card className="border-0 shadow-md bg-white">
                    <CardContent className="py-12 text-center">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No services found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery || statusFilter !== 'all' || serviceTypeFilter !== 'all'
                                ? "Try adjusting your filters"
                                : "Services will appear here when users submit them"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {/* Select all on page */}
                    {currentServices.length > 0 && (
                        <div className="flex items-center gap-3 px-1">
                            <Checkbox
                                checked={isAllOnPageSelected}
                                onCheckedChange={(checked) => {
                                    if (checked) selectAllOnPage()
                                    else deselectAll()
                                }}
                                className="h-5 w-5"
                            />
                            <span className="text-sm text-gray-600">
                                {isAllOnPageSelected ? 'Deselect all' : 'Select all on page'}
                            </span>
                        </div>
                    )}

                    {currentServices.map((service) => {
                        const category = getServiceCategoryBySlug(service.serviceSlug || service.service)
                        const isUpdating = updatingId === service.id
                        const isSelected = selectedIds.has(service.id)

                        return (
                            <Card
                                key={service.id}
                                className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-white cursor-pointer ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                                onClick={() => handleViewService(service)}
                            >
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex gap-3 sm:gap-4">
                                        {/* Checkbox */}
                                        <div
                                            className="flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleSelectService(service.id)
                                            }}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                className="h-5 w-5"
                                            />
                                        </div>

                                        {/* Avatar */}
                                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shadow-sm flex-shrink-0">
                                            {service.profilePhoto ? (
                                                <AvatarImage src={service.profilePhoto} alt={service.name} />
                                            ) : (
                                                <AvatarFallback className="bg-gray-100">
                                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                                            {service.name}
                                                        </h3>
                                                        {getStatusBadge(service.status)}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <Badge variant="secondary" className="text-xs shadow-sm gap-1 py-0.5">
                                                            <span>{category?.icon || '��'}</span>
                                                            <span className="hidden sm:inline">{category?.label || service.service}</span>
                                                        </Badge>
                                                        {renderStars(service.qualityRating)}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-gray-500">
                                                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                                                            <IndianRupee className="h-3 w-3" />
                                                            ₹{service.chargesPerHour}/hr
                                                        </span>
                                                        <span className="flex items-center gap-1 hidden sm:flex">
                                                            <Phone className="h-3 w-3" />
                                                            {service.contactNumber}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" disabled={isUpdating} className="h-8 w-8 sm:h-9 sm:w-9">
                                                            {isUpdating ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreVertical className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur shadow-xl border-0">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleViewService(service)
                                                        }}>
                                                            <Eye className="h-4 w-4 mr-2 text-gray-500" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {service.status !== 'live' && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusUpdate(service.id, 'live')
                                                                }}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                                                <span className="text-emerald-600">Approve (Live)</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {service.status !== 'pending' && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusUpdate(service.id, 'pending')
                                                                }}
                                                            >
                                                                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                                                                <span className="text-yellow-600">Set Pending</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {service.status !== 'rejected' && (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusUpdate(service.id, 'rejected')
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                                                <span className="text-red-600">Reject</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteClick(service.id)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                                            <span className="text-red-600">Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-gray-600 order-2 sm:order-1">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredServices.length)} of {filteredServices.length}
                    </p>
                    <div className="flex gap-2 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="shadow-sm"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="shadow-sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Service Detail Dialog */}
            <ServiceDetailDialog
                service={selectedService}
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={!!updatingId}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-white/95 backdrop-blur shadow-2xl border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this service? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="shadow-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 shadow-md"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Status Change Confirmation Dialog */}
            <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Status Change
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-sm text-muted-foreground">
                                Are you sure you want to change the status of <strong>{selectedIds.size}</strong> selected service(s) to{' '}
                                <Badge className={
                                    bulkTargetStatus === 'live' ? 'bg-emerald-500' :
                                        bulkTargetStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                }>
                                    {bulkTargetStatus === 'live' ? 'Live' : bulkTargetStatus === 'pending' ? 'Pending' : 'Rejected'}
                                </Badge>
                                ?
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setBulkStatusDialogOpen(false)}
                            disabled={bulkActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkStatusUpdate}
                            disabled={bulkActionLoading}
                            className={
                                bulkTargetStatus === 'live' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    bulkTargetStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'
                            }
                        >
                            {bulkActionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Dialog with Type to Confirm */}
            <Dialog open={bulkDeleteDialogOpen} onOpenChange={(open) => {
                setBulkDeleteDialogOpen(open)
                if (!open) setDeleteConfirmText("")
            }}>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete {selectedIds.size} Service(s)
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the selected services.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-700 mb-3">
                            Type <strong className="text-red-600 font-mono bg-red-50 px-1.5 py-0.5 rounded">delete</strong> to confirm:
                        </p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type 'delete' to confirm"
                            className="font-mono"
                            autoComplete="off"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setBulkDeleteDialogOpen(false)
                                setDeleteConfirmText("")
                            }}
                            disabled={bulkActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={deleteConfirmText !== 'delete' || bulkActionLoading}
                        >
                            {bulkActionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete {selectedIds.size} Service(s)
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
