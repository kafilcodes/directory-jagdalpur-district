"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminStore } from "@/stores/adminStore"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
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
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Calendar,
    MapPin,
    Phone,
    Globe,
    Star,
    TrendingUp,
    Mail,
    ExternalLink,
    RefreshCw,
    CheckCircle,
    Clock,
    FileText,
    Sparkles,
    Award,
    Package
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Listing } from "@/stores/adminStore"
import ListingDetailSheet from "@/components/listings/ListingDetailSheet"
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton"
import { ListingEditDialog } from "@/components/admin/ListingEditDialog"

export default function ListingsPage() {
    // Use Zustand store
    const { listings, loading, fetchAllData, updateListing, deleteListing, refreshData } = useAdminStore()
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [planFilter, setPlanFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Edit dialog state
    const [editingListing, setEditingListing] = useState<Listing | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    // AlertDialog for delete confirmation
    const [listingToDelete, setListingToDelete] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Helper functions (defined before useMemo to avoid TDZ errors)
    const getAddress = (listing: Listing): string => {
        if (typeof listing.address === 'string') {
            return listing.address
        }
        if (typeof listing.address === 'object' && listing.address !== null) {
            return (listing.address as any).formattedAddress || ""
        }
        return ""
    }

    // Memoized filtered listings
    const filteredListings = useMemo(() => {
        let filtered = [...listings]

        // Sort by createdAt descending
        filtered.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || 0
            const bTime = b.createdAt?.toDate?.()?.getTime() || 0
            return bTime - aTime
        })

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(listing => {
                const addressString = getAddress(listing as any)
                return (
                    listing.name?.toLowerCase().includes(query) ||
                    listing.title?.toLowerCase().includes(query) ||
                    listing.businessName?.toLowerCase().includes(query) ||
                    listing.description?.toLowerCase().includes(query) ||
                    listing.categorySlug?.toLowerCase().includes(query) ||
                    addressString.toLowerCase().includes(query)
                )
            })
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(listing => listing.status === statusFilter)
        }

        // Plan filter
        if (planFilter !== "all") {
            filtered = filtered.filter(listing => listing.plan === planFilter)
        }

        return filtered
    }, [listings, searchQuery, statusFilter, planFilter])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, planFilter])

    const handleViewListing = (listing: Listing) => {
        // Use URL search params to open public listing sheet
        router.push(`/admin/listings?id=${listing.id}`, { scroll: false } as any)
    }

    const handleEditListing = (listing: Listing) => {
        setEditingListing(listing)
        setIsEditDialogOpen(true)
    }

    const handleEditSave = () => {
        // Refresh data to show updated listing
        refreshData()
        setIsEditDialogOpen(false)
        setEditingListing(null)
    }

    const handleDeleteClick = (listingId: string) => {
        setListingToDelete(listingId)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!listingToDelete) return

        try {
            // Use Zustand store's deleteListing method
            await deleteListing(listingToDelete)
            toast.success("Listing deleted successfully")
            setIsDeleteDialogOpen(false)
            setListingToDelete(null)
        } catch (error) {
            console.error("Error deleting listing:", error)
            toast.error("Failed to delete listing. Please try again.")
        }
    }

    const handleStatusChange = async (listingId: string, newStatus: string) => {
        try {
            // Use Zustand store's updateListing method
            await updateListing(listingId, {
                status: newStatus as "active" | "pending" | "draft"
            })
            toast.success(`Listing status updated to ${newStatus}`)
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const getPlanBadge = (listing: Listing) => {
        const planType = listing.monetization?.type || listing.activePlan?.type || "free"

        switch (planType) {
            case "featured":
                return <Badge className="bg-amber-500 text-white">Featured</Badge>
            case "sponsored":
                return <Badge className="bg-red-500 text-white">Sponsored</Badge>
            default:
                return <Badge variant="outline">Free</Badge>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500 text-white">Active</Badge>
            case "pending":
                return <Badge className="bg-yellow-500 text-white">Pending</Badge>
            case "draft":
                return <Badge variant="outline">Draft</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getImageUrl = (listing: Listing): string => {
        // Primary: Check photos[] field (CDN URLs)
        if (listing.photos && listing.photos.length > 0) {
            return listing.photos[0]
        }

        // Fallback: Check images[] field for backward compatibility
        if (listing.images && listing.images.length > 0) {
            const firstImage = listing.images[0]
            if (typeof firstImage === 'string') return firstImage
            if (typeof firstImage === 'object' && firstImage.url) return firstImage.url
        }

        return "/placeholder.jpg"
    }

    const getListingName = (listing: Listing): string => {
        return listing.name || listing.title || listing.businessName || "Unnamed Listing"
    }

    // Pagination
    const totalPages = Math.ceil(filteredListings.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentListings = filteredListings.slice(startIndex, endIndex)

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Header Skeleton */}
                <div>
                    <Skeleton className="h-6 sm:h-7 md:h-9 w-36 sm:w-40 md:w-48 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-4 sm:h-4.5 md:h-5 w-56 sm:w-68 md:w-80" />
                </div>

                {/* Filters Skeleton */}
                <Card>
                    <CardContent className="pt-4 sm:pt-5 md:pt-6">
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                            <div className="sm:col-span-2">
                                <Skeleton className="h-10 sm:h-10 md:h-11 w-full" />
                            </div>
                            <Skeleton className="h-10 sm:h-10 md:h-11 w-full" />
                            <Skeleton className="h-10 sm:h-10 md:h-11 w-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Listings Skeleton */}
                <div className="space-y-3 sm:space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex gap-3 sm:gap-4">
                                    <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0" />
                                    <div className="flex-1 space-y-2 sm:space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-1.5 sm:space-y-2">
                                                <Skeleton className="h-5 sm:h-6 w-3/4" />
                                                <div className="flex gap-1.5 sm:gap-2">
                                                    <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
                                                    <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
                                                </div>
                                                <Skeleton className="h-3.5 sm:h-4 w-full" />
                                                <Skeleton className="h-3.5 sm:h-4 w-2/3" />
                                            </div>
                                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-24 ml-2" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                    <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900">Listings</h1>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-1.5 md:mt-2">
                        Manage all business listings ({filteredListings.length} total)
                    </p>
                </div>
                <AdminRefreshButton
                    onRefresh={async () => await refreshData()}
                    disabled={loading}
                />
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-4 sm:pt-5 md:pt-6">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                        {/* Search */}
                        <div className="sm:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search listings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 sm:pl-10 h-10 sm:h-10 md:h-11 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-10 sm:h-10 md:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <span>All Status</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        <span>Active</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pending">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-yellow-500" />
                                        <span>Pending</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="draft">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span>Draft</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Plan Filter */}
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger className="h-10 sm:h-10 md:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Plan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <span>All Plans</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="free">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        <span>Free</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="sponsored">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-red-500" />
                                        <span>Sponsored</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="featured">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-amber-500" />
                                        <span>Featured</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Listings Table */}
            <div className="space-y-3 sm:space-y-4">
                {currentListings.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 sm:py-10 md:py-12 text-center px-4">
                            <p className="text-gray-500 text-sm sm:text-base">No listings found matching your filters.</p>
                        </CardContent>
                    </Card>
                ) : (
                    currentListings.map((listing) => (
                        <Card key={listing.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex gap-3 sm:gap-4">
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                                            <Image
                                                src={getImageUrl(listing)}
                                                alt={getListingName(listing)}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2 mb-1 sm:mb-1.5">
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                                        {getListingName(listing)}
                                                    </h3>
                                                    <div className="flex gap-1.5 xs:gap-2">
                                                        {getPlanBadge(listing)}
                                                        {getStatusBadge(listing.status)}
                                                    </div>
                                                </div>

                                                {listing.description && (
                                                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1.5 sm:mb-2">
                                                        {listing.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] xs:text-xs text-gray-500">
                                                    {getAddress(listing) && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                                                {getAddress(listing)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {listing.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{listing.phone}</span>
                                                        </div>
                                                    )}
                                                    {listing.rating && listing.rating > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                                            <span>{listing.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mt-1.5 sm:mt-2 text-[10px] xs:text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3 flex-shrink-0" />
                                                        <span>{listing.views || 0} views</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3 flex-shrink-0" />
                                                        <span>{listing.clicks || 0} clicks</span>
                                                    </div>
                                                    {listing.createdAt && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {listing.createdAt.toDate?.().toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex sm:flex-row flex-col items-center gap-1.5 sm:gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewListing(listing)}
                                                    title="View Details"
                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                                >
                                                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditListing(listing)}
                                                    title="Edit Listing"
                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                                >
                                                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(listing.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9 p-0"
                                                    title="Delete Listing"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-0">
                    <p className="text-xs sm:text-sm text-gray-600 text-center xs:text-left">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredListings.length)} of{" "}
                        {filteredListings.length} listings
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                            Previous
                        </Button>
                        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Public Listing Detail Sheet */}
            <ListingDetailSheet />

            {/* Edit Listing Dialog */}
            <ListingEditDialog
                listing={editingListing}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSave={handleEditSave}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this listing
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
