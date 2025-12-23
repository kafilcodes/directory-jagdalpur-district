"use client"

import { useState, useTransition, useMemo, useCallback, memo, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getCategoryLabel, getPlanById, formatPrice } from "@/config/directory"
import {
    MapPin, Phone, Globe, Mail, Calendar, Clock, TrendingUp,
    Star, Image as ImageIcon, Edit, Crown, AlertCircle, CheckCircle2,
    ExternalLink, ArrowLeft, Eye, MousePointerClick, Trash2, ImagePlus, Loader2
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { EditListingDialog } from "./EditListingDialog"
import { UpgradePlanDialog } from "./UpgradePlanDialog"
import { useRouter } from "next/navigation"

// Lazy load Lottie for performance
const LottieAnimation = dynamic(() => import("@/components/common/LottieAnimation").then(mod => ({ default: mod.LottieAnimation })), {
    ssr: false,
    loading: () => null
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

interface MyListingDetailViewProps {
    listing: UserListing
    onBack: () => void
    userUid: string
}

export const MyListingDetailView = memo(function MyListingDetailView({
    listing,
    onBack,
    userUid
}: MyListingDetailViewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isUpgrading, setIsUpgrading] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [fullListing, setFullListing] = useState<any>(null)
    const [loadingDetails, setLoadingDetails] = useState(true)
    const [stats, setStats] = useState<any>({
        totalImpressions: 0,
        totalClicks: 0,
        topKeywords: []
    })
    const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null)
    const [imageUpdating, setImageUpdating] = useState(false)
    const router = useRouter()

    // Fetch full listing details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoadingDetails(true)
                const response = await fetch(`/api/listings/${listing.id}`)
                if (response.ok) {
                    const json = await response.json()
                    if (json.ok && json.data) {
                        setFullListing(json.data)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch listing details:", error)
            } finally {
                setLoadingDetails(false)
            }
        }
        fetchDetails()
    }, [listing.id])

    // Use full listing data if available, otherwise use summary
    const data = fullListing || listing

    // Plan info
    const plan = useMemo(() => getPlanById(listing.plan), [listing.plan])
    const isPlanExpired = useMemo(() =>
        listing.expiryDate ? isPast(new Date(listing.expiryDate)) : false,
        [listing.expiryDate]
    )
    const canUpgradePlan = useMemo(() =>
        !listing.plan || listing.plan === "free" || isPlanExpired,
        [listing.plan, isPlanExpired]
    )

    const handleEditSuccess = useCallback(() => {
        startTransition(() => {
            router.refresh()
        })
    }, [router])

    // Format dates
    const createdDate = listing.createdAt ? new Date(listing.createdAt) : null
    const expiryDate = listing.expiryDate ? new Date(listing.expiryDate) : null

    // Photos array
    const photosArray = useMemo(() => data.photos || [], [data.photos])

    // Check if delete is allowed (more than 3 images)
    const canDeleteImage = useMemo(() => photosArray.length > 3, [photosArray.length])

    // Set image as primary
    const handleSetPrimary = useCallback(async (newPrimaryIndex: number) => {
        if (newPrimaryIndex === 0 || imageUpdating) return

        setImageUpdating(true)
        try {
            // Reorder photos array to put selected image first
            const newPhotos = [...photosArray]
            const [selectedPhoto] = newPhotos.splice(newPrimaryIndex, 1)
            newPhotos.unshift(selectedPhoto)

            const response = await fetch(`/api/listings/${listing.id}/photos`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photos: newPhotos,
                    primaryImageIndex: 0
                })
            })

            const result = await response.json()
            if (result.ok) {
                toast.success('Primary image updated!')
                // Update local state
                setFullListing((prev: any) => prev ? { ...prev, photos: newPhotos } : null)
                startTransition(() => {
                    router.refresh()
                })
            } else {
                toast.error(result.message || 'Failed to update primary image')
            }
        } catch (error) {
            console.error('Failed to set primary image:', error)
            toast.error('Failed to update primary image')
        } finally {
            setImageUpdating(false)
        }
    }, [photosArray, listing.id, imageUpdating, router])

    // Delete image
    const handleDeleteImage = useCallback(async (indexToDelete: number) => {
        if (!canDeleteImage || imageUpdating) return

        setImageUpdating(true)
        try {
            const newPhotos = photosArray.filter((_: string, idx: number) => idx !== indexToDelete)

            const response = await fetch(`/api/listings/${listing.id}/photos`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photos: newPhotos,
                    primaryImageIndex: 0
                })
            })

            const result = await response.json()
            if (result.ok) {
                toast.success('Image deleted!')
                setFullListing((prev: any) => prev ? { ...prev, photos: newPhotos } : null)
                startTransition(() => {
                    router.refresh()
                })
            } else {
                toast.error(result.message || 'Failed to delete image')
            }
        } catch (error) {
            console.error('Failed to delete image:', error)
            toast.error('Failed to delete image')
        } finally {
            setImageUpdating(false)
        }
    }, [photosArray, listing.id, canDeleteImage, imageUpdating, router])

    const handleUpgradeSuccess = useCallback(() => {
        startTransition(() => {
            router.refresh()
        })
    }, [router])

    return (
        <>
            <EditListingDialog
                open={isEditing}
                onClose={() => setIsEditing(false)}
                listing={data}
                onSuccess={handleEditSuccess}
            />

            <UpgradePlanDialog
                open={isUpgrading}
                onClose={() => setIsUpgrading(false)}
                listingId={listing.id}
                listingName={listing.name}
                currentPlan={listing.plan}
                isPlanExpired={isPlanExpired}
                onSuccess={handleUpgradeSuccess}
            />

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
                            <button
                                onClick={onBack}
                                className="text-gray-500 hover:text-red-500 transition-colors text-sm"
                            >
                                My Listings
                            </button>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-medium truncate max-w-[150px] sm:max-w-none">
                                {listing.name}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onBack}
                            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight line-clamp-1">
                                {listing.name}
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                View and manage this listing
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Listing
                    </Button>
                </div>

                {/* Status Bar */}
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge
                                            variant={listing.isPublic ? "default" : "secondary"}
                                            className={cn(
                                                "text-[10px] sm:text-xs",
                                                listing.isPublic ? "bg-green-600" : ""
                                            )}
                                        >
                                            {listing.isPublic ? "Live" : "Draft"}
                                        </Badge>
                                        {plan && plan.id !== "free" && !isPlanExpired && (
                                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-[10px] sm:text-xs">
                                                <Crown className="h-3 w-3 mr-1" />
                                                {plan.name}
                                            </Badge>
                                        )}
                                        {isPlanExpired && (
                                            <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Expired
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {createdDate ? (
                                            <>Listed {formatDistanceToNow(createdDate, { addSuffix: true })}</>
                                        ) : (
                                            "Not yet published"
                                        )}
                                    </p>
                                </div>
                            </div>
                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-medium">{listing.views}</span>
                                    <span className="hidden sm:inline">views</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <MousePointerClick className="h-4 w-4" />
                                    <span className="font-medium">{listing.clicks}</span>
                                    <span className="hidden sm:inline">clicks</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
                        <TabsTrigger value="contact" className="text-xs sm:text-sm">Contact</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-4 sm:mt-6">
                        {/* Business Info Card */}
                        <Card>
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg sm:text-xl lg:text-2xl line-clamp-2">
                                            {listing.name}
                                        </CardTitle>
                                        <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {getCategoryLabel(listing.categorySlug) || listing.category}
                                            </Badge>
                                            {listing.rating > 0 && (
                                                <div className="flex items-center gap-1 text-xs sm:text-sm">
                                                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-medium">{listing.rating.toFixed(1)}</span>
                                                    <span className="text-gray-500">({listing.userRatingCount})</span>
                                                </div>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </h3>
                                        <p className="text-sm leading-relaxed text-gray-600">
                                            {data.description}
                                        </p>
                                    </div>
                                )}

                                {/* Address */}
                                {listing.address && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-gray-600">{listing.address}</p>
                                    </div>
                                )}

                                {data.tags && data.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {data.tags.map((tag: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Operating Hours */}
                                {data.openingHours && data.openingHours.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Opening Hours
                                        </h3>
                                        <div className="space-y-1">
                                            {data.openingHours.slice(0, 7).map((hour: string, idx: number) => (
                                                <p key={idx} className="text-xs sm:text-sm text-gray-600">
                                                    {hour}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metadata Card */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Listing Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {createdDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium">Created</p>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                {format(createdDate, "PPP")}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {expiryDate && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium">
                                                {isPlanExpired ? "Expired On" : "Expires On"}
                                            </p>
                                            <p className={cn(
                                                "text-xs sm:text-sm",
                                                isPlanExpired ? "text-red-600" : "text-gray-600"
                                            )}>
                                                {format(expiryDate, "PPP")}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {plan && (
                                    <div className="flex items-start gap-3">
                                        <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium">Current Plan</p>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                {plan.name} • {formatPrice(plan.priceINR)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Plan Upgrade Card */}
                        {canUpgradePlan && (
                            <Card className={cn(
                                "border-2 transition-all",
                                isPlanExpired
                                    ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50"
                                    : "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
                            )}>
                                <CardHeader className="pb-2 sm:pb-3">
                                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                        <Crown className={cn(
                                            "h-4 w-4 sm:h-5 sm:w-5",
                                            isPlanExpired ? "text-red-500" : "text-yellow-600"
                                        )} />
                                        {isPlanExpired ? "Renew Your Plan" : "Upgrade Your Plan"}
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {isPlanExpired
                                            ? "Your plan has expired. Upgrade now to maintain premium visibility."
                                            : "Get more visibility and grow your business faster."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => setIsUpgrading(true)}
                                            className={cn(
                                                "sm:w-auto text-white text-sm",
                                                isPlanExpired
                                                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                                    : "bg-red-500 hover:bg-red-600"
                                            )}
                                        >
                                            <Crown className="h-4 w-4 mr-2" />
                                            {isPlanExpired ? "Renew Now" : "Upgrade Now"}
                                        </Button>

                                        {/* Attention Arrow Lottie for Expired Plans */}
                                        {isPlanExpired && (
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                                <LottieAnimation
                                                    src="/lottie/attention_arrow.json"
                                                    loop={true}
                                                    autoplay={true}
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images" className="space-y-4 mt-4 sm:mt-6">
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm sm:text-base">Listing Photos</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {photosArray.length} photo{photosArray.length !== 1 ? 's' : ''} • Tap/hover to manage
                                        </CardDescription>
                                    </div>
                                    {imageUpdating && (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {photosArray.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                                        {photosArray.map((photo: string, idx: number) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                                    idx === 0
                                                        ? "border-red-500 ring-2 ring-red-500 ring-offset-2"
                                                        : "border-gray-200 hover:border-gray-300"
                                                )}
                                                onMouseEnter={() => setHoveredImageIndex(idx)}
                                                onMouseLeave={() => setHoveredImageIndex(null)}
                                            >
                                                <Image
                                                    src={photo}
                                                    alt={`Listing photo ${idx + 1}`}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="object-cover"
                                                />

                                                {/* Primary Badge */}
                                                {idx === 0 && (
                                                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1 z-10">
                                                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
                                                        <span className="hidden sm:inline">Primary</span>
                                                    </div>
                                                )}

                                                {/* Action overlay - visible on hover (desktop) or always (mobile) */}
                                                {idx !== 0 && (
                                                    <div className={cn(
                                                        "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity",
                                                        // Mobile: always show actions as small icons
                                                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                                                        hoveredImageIndex === idx && "sm:opacity-100"
                                                    )}>
                                                        {/* Set as Primary button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSetPrimary(idx)
                                                            }}
                                                            disabled={imageUpdating}
                                                            className="flex items-center gap-1.5 bg-white text-gray-900 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            <span className="hidden sm:inline">Set as Primary</span>
                                                            <span className="sm:hidden">Primary</span>
                                                        </button>

                                                        {/* Delete button - only if more than 3 images */}
                                                        {canDeleteImage && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteImage(idx)
                                                                }}
                                                                disabled={imageUpdating}
                                                                className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                                <span className="hidden sm:inline">Delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Primary image actions - only delete if more than 3 */}
                                                {idx === 0 && canDeleteImage && (
                                                    <div className={cn(
                                                        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex justify-center transition-opacity",
                                                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    )}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteImage(idx)
                                                            }}
                                                            disabled={imageUpdating}
                                                            className="flex items-center gap-1 text-white/90 hover:text-white text-[10px] sm:text-xs font-medium disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 sm:py-12">
                                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                        <p className="text-sm text-gray-600">No photos available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="space-y-4 mt-4 sm:mt-6">
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-gray-700">Phone</p>
                                            <a
                                                href={`tel:${data.phone}`}
                                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                {data.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {data.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-gray-700">Email</p>
                                            <a
                                                href={`mailto:${data.email}`}
                                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 break-all"
                                            >
                                                {data.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {data.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-gray-700">Website</p>
                                            <a
                                                href={data.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 break-all"
                                            >
                                                {data.website}
                                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {!data.phone && !data.email && !data.website && (
                                    <div className="text-center py-6 sm:py-8">
                                        <Mail className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                        <p className="text-sm text-gray-600">No contact information available</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit className="h-3 w-3 mr-2" />
                                            Add Contact Info
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
})
