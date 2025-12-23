"use client"

import { useState, useMemo, useCallback, memo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getCategoryLabel, getPlanById } from "@/config/directory"
import { CategoryBadge } from "@/components/common/CategoryBadge"
import {
    Building2, TrendingUp, Eye, MousePointerClick, Crown, Star,
    Plus, ArrowLeft, MapPin, Calendar, ChevronRight, BarChart3,
    Sparkles, Package, CheckCircle2, Clock, Search, SortAsc, Radio
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { MyListingDetailView } from "./MyListingDetailView"

// Lazy load Lottie for performance
const LottieAnimation = dynamic(() => import("@/components/common/LottieAnimation").then(mod => ({ default: mod.LottieAnimation })), {
    ssr: false,
    loading: () => <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg animate-pulse" />
})

// Types
interface UserListing {
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

interface ListingStats {
    total: number
    maxAllowed: number
    remaining: number
    free: number
    sponsored: number
    featured: number
    live: number
    draft: number
}

interface AggregatedStats {
    totalImpressions: number
    totalClicks: number
    topKeywords: { term: string; imp: number; clk: number }[]
}

interface MyListingsClientProps {
    listings: UserListing[]
    listingStats: ListingStats
    aggregatedStats: AggregatedStats
    userUid: string
}

// Stat Card Component
const StatCard = memo(function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    colorClass,
    bgClass
}: {
    icon: React.ElementType
    label: string
    value: string | number
    subValue?: string
    colorClass: string
    bgClass: string
}) {
    return (
        <Card className="border-0 shadow-sm hover:shadow-md hover:shadow-red-500/10 transition-shadow">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0", bgClass)}>
                        <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", colorClass)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{label}</p>
                        <p className={cn("text-xl sm:text-2xl font-bold tracking-tight", colorClass)}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        {subValue && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{subValue}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})

// Listing Card Component for Grid - Glassmorphism Design
const ListingGridCard = memo(function ListingGridCard({
    listing,
    onClick
}: {
    listing: UserListing
    onClick: () => void
}) {
    const plan = getPlanById(listing.plan)
    const isExpired = listing.expiryDate ? isPast(new Date(listing.expiryDate)) : false
    const isLive = listing.isPublic && listing.status === 'active'
    const thumbnail = listing.photos?.[0] || null

    return (
        <Card
            className="group bg-white border-0 shadow-md hover:shadow-xl hover:shadow-red-500/10 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col"
            onClick={onClick}
        >
            {/* Image/Thumbnail with Glassmorphism Overlay */}
            <div className="relative w-full aspect-[4/3] overflow-hidden">
                {thumbnail ? (
                    <>
                        <Image
                            src={thumbnail}
                            alt={listing.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300" />
                    </div>
                )}

                {/* Top Badges Row */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {/* Live/Draft Status with Icon */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg text-xs font-medium",
                        isLive
                            ? "bg-green-500/90 text-white"
                            : "bg-white/90 text-gray-700"
                    )}>
                        {isLive ? (
                            <Radio className="h-3 w-3 animate-pulse" />
                        ) : (
                            <Clock className="h-3 w-3" />
                        )}
                        <span>{isLive ? "Live" : "Draft"}</span>
                    </div>

                    {/* Plan Badge */}
                    {listing.plan !== 'free' && !isExpired && (
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm ring-2 ring-white/30",
                            listing.plan === 'featured'
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-500"
                                : "bg-gradient-to-br from-orange-400 to-orange-500"
                        )}>
                            {listing.plan === 'featured' ? (
                                <Star className="h-4 w-4 fill-white text-white" />
                            ) : (
                                <Crown className="h-4 w-4 text-white" />
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    {/* Category Icon Badge */}
                    <CategoryBadge
                        category={listing.categorySlug || listing.category}
                        showText={false}
                        showIcon={true}
                        className="bg-white/90 backdrop-blur text-gray-900 shadow-md mb-2"
                    />

                    {/* Title */}
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 leading-tight group-hover:text-red-200 transition-colors">
                        {listing.name}
                    </h3>

                    {/* Address - Very Small */}
                    {listing.address && (
                        <div className="flex items-center gap-1 mt-1 text-white/80 text-[9px] sm:text-[10px]">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <p className="line-clamp-1 lowercase first-letter:uppercase">{listing.address}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Bar - Glass Style */}
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                    {/* Stats Icons */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-600" title="Views">
                            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                                <Eye className="h-3 w-3 text-purple-600" />
                            </div>
                            <span className="text-xs font-medium">{listing.views}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600" title="Clicks">
                            <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                                <MousePointerClick className="h-3 w-3 text-orange-600" />
                            </div>
                            <span className="text-xs font-medium">{listing.clicks}</span>
                        </div>
                        {listing.rating > 0 && (
                            <div className="flex items-center gap-1 text-gray-600" title="Rating">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{listing.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {/* View Details Arrow */}
                    <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                        <ChevronRight className="h-4 w-4 text-red-500 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </Card>
    )
})

// Sort options
type SortOption = 'newest' | 'oldest' | 'most_views' | 'least_views'

// Main Component
export const MyListingsClient = memo(function MyListingsClient({
    listings,
    listingStats,
    aggregatedStats,
    userUid
}: MyListingsClientProps) {
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<SortOption>("newest")

    // Filter and sort listings
    const filteredListings = useMemo(() => {
        let filtered = [...listings]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter(listing =>
                listing.name.toLowerCase().includes(query) ||
                listing.category.toLowerCase().includes(query) ||
                listing.address?.toLowerCase().includes(query)
            )
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                break
            case 'oldest':
                filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                break
            case 'most_views':
                filtered.sort((a, b) => (b.views || 0) - (a.views || 0))
                break
            case 'least_views':
                filtered.sort((a, b) => (a.views || 0) - (b.views || 0))
                break
        }

        return filtered
    }, [listings, searchQuery, sortBy])

    // Find selected listing
    const selectedListing = useMemo(() =>
        listings.find(l => l.id === selectedListingId) || null,
        [listings, selectedListingId]
    )

    const handleListingClick = useCallback((listingId: string) => {
        setSelectedListingId(listingId)
    }, [])

    const handleBackToList = useCallback(() => {
        setSelectedListingId(null)
    }, [])

    // If a listing is selected, show detail view
    if (selectedListing) {
        return (
            <MyListingDetailView
                listing={selectedListing}
                onBack={handleBackToList}
                userUid={userUid}
            />
        )
    }

    // Main listings grid view
    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="text-gray-500 hover:text-red-500">
                            Home
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium">My Listings</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        My Listings
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Manage your {listingStats.total} business listing{listingStats.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link href="/user/create-listing">
                    <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Listing
                    </Button>
                </Link>
            </div>

            {/* Lottie Animation */}
            <div className="flex justify-center">
                <div className="w-100 h-100 sm:w-36 sm:h-36 md:h-60 md:w-100">
                    <LottieAnimation
                        src="/lottie/user_mylisting.json"
                        loop={true}
                        autoplay={true}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={Package}
                    label="Total Listings"
                    value={listingStats.total}
                    subValue={`${listingStats.remaining} slots remaining`}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Live"
                    value={listingStats.live}
                    subValue={`${listingStats.draft} draft`}
                    colorClass="text-green-600"
                    bgClass="bg-green-50"
                />
                <StatCard
                    icon={Eye}
                    label="Total Views"
                    value={aggregatedStats.totalImpressions}
                    subValue="All listings"
                    colorClass="text-purple-600"
                    bgClass="bg-purple-50"
                />
                <StatCard
                    icon={MousePointerClick}
                    label="Total Clicks"
                    value={aggregatedStats.totalClicks}
                    subValue="All listings"
                    colorClass="text-orange-600"
                    bgClass="bg-orange-50"
                />
            </div>

            {/* Plan Distribution Mini Stats */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-400"></div>
                            <span className="text-xs sm:text-sm text-gray-600">
                                Free: <span className="font-semibold text-gray-900">{listingStats.free}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-xs sm:text-sm text-gray-600">
                                Sponsored: <span className="font-semibold text-gray-900">{listingStats.sponsored}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                            <span className="text-xs sm:text-sm text-gray-600">
                                Featured: <span className="font-semibold text-gray-900">{listingStats.featured}</span>
                            </span>
                        </div>
                        <div className="ml-auto text-xs sm:text-sm text-gray-500">
                            {listingStats.total}/{listingStats.maxAllowed} used
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search & Sort Bar */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search listings by name, category, or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-gray-50 border-gray-200">
                                <div className="flex items-center gap-2">
                                    <SortAsc className="h-4 w-4 text-gray-500" />
                                    <SelectValue placeholder="Sort by" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Newest First</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="oldest">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Oldest First</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="most_views">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        <span>Most Views</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="least_views">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        <span>Least Views</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results Count */}
                    {searchQuery && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-3">
                            Found <span className="font-medium text-gray-900">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''}
                            {searchQuery && ` matching "${searchQuery}"`}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map(listing => (
                    <ListingGridCard
                        key={listing.id}
                        listing={listing}
                        onClick={() => handleListingClick(listing.id)}
                    />
                ))}
            </div>

            {/* No Results State */}
            {filteredListings.length === 0 && searchQuery && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-1">No listings found</h3>
                        <p className="text-sm text-gray-500">
                            Try adjusting your search or clear filters
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => setSearchQuery("")}
                        >
                            Clear Search
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Empty state for add more */}
            {listingStats.remaining > 0 && listings.length > 0 && listings.length < 6 && !searchQuery && (
                <Card className="border-2 border-dashed border-gray-200 hover:border-red-300 transition-colors">
                    <CardContent className="py-8 sm:py-12">
                        <Link
                            href="/user/create-listing"
                            className="flex flex-col items-center justify-center text-center"
                        >
                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                                <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                            </div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">Add Another Listing</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {listingStats.remaining} of {listingStats.maxAllowed} slots available
                            </p>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
})
