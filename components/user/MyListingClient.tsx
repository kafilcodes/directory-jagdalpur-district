"use client"

import { useState, useTransition, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getCategoryLabel, getPlanById, formatPrice } from "@/config/directory"
import {
    MapPin, Phone, Globe, Mail, Calendar, Clock, TrendingUp,
    Star, Image as ImageIcon, Edit, Crown, AlertCircle, CheckCircle2, ExternalLink
} from "lucide-react"
import Image from "next/image"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { EditListingDialog } from "./EditListingDialog"
import { useRouter } from "next/navigation"

interface MyListingClientProps {
    listing: any
    stats: {
        totalImpressions: number
        totalClicks: number
        topKeywords: any[]
        lastAggregated: number | null
    }
    userUid: string
}

export const MyListingClient = memo(function MyListingClient({ listing, stats, userUid }: MyListingClientProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Memoize computed values
    const address = useMemo(() => listing.address || {}, [listing.address])
    const monetization = useMemo(() => listing.monetization || listing.activePlan || {}, [listing.monetization, listing.activePlan])
    // Use listing.plan field directly from Firestore
    const planId = useMemo(() =>
        listing.plan || "free",
        [listing.plan]
    )
    const plan = useMemo(() => getPlanById(planId), [planId])
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

    // Format dates - Memoized
    const { createdDate, publishedDate, expiryDate } = useMemo(() => ({
        createdDate: listing.createdAt ? new Date(listing.createdAt) : null,
        publishedDate: listing.publishedAt ? new Date(listing.publishedAt) : (listing.createdAt ? new Date(listing.createdAt) : null),
        expiryDate: listing.expiryDate ? new Date(listing.expiryDate) : null
    }), [listing.createdAt, listing.publishedAt, listing.expiryDate])

    // Images - Memoized - Use unified photos array from Firestore
    const photosArray = useMemo(() => listing.photos || [], [listing.photos])

    // Reviews - Memoized
    const { reviews, rating, userRatingCount } = useMemo(() => ({
        reviews: listing.reviews || [],
        rating: listing.rating || 0,
        userRatingCount: listing.userRatingCount || 0
    }), [listing.reviews, listing.rating, listing.userRatingCount])

    return (
        <>
            <EditListingDialog
                open={isEditing}
                onClose={() => setIsEditing(false)}
                listing={listing}
                onSuccess={handleEditSuccess}
            />

            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight ">
                            My Listing
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your business listing and view analytics
                        </p>
                    </div>
                </div>

                {/* Status Bar */}
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                            variant={listing.isPublic ? "default" : "secondary"}
                                            className={listing.isPublic ? "bg-green-600" : ""}
                                        >
                                            {listing.isPublic ? "Live" : "Draft"}
                                        </Badge>
                                        {plan && plan.id !== "free" && !isPlanExpired && (
                                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600">
                                                <Crown className="h-3 w-3 mr-1" />
                                                {plan.name}
                                            </Badge>
                                        )}
                                        {isPlanExpired && (
                                            <Badge variant="destructive">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Expired
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 text-gray-100">
                                        {publishedDate ? (
                                            <>Live since {formatDistanceToNow(publishedDate, { addSuffix: true })}</>
                                        ) : (
                                            "Not yet published"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-6">
                        {/* Business Name & Description */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl">
                                            {listing.title || listing.name || "Untitled Listing"}
                                        </CardTitle>
                                        <CardDescription className="mt-2 flex items-center gap-2 text-gray-500">
                                            <Badge variant="outline">
                                                {getCategoryLabel(listing.categorySlug) || listing.categorySlug}
                                            </Badge>
                                            {rating > 0 && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-medium">{rating.toFixed(1)}</span>
                                                    <span className="text-gray-500">({userRatingCount})</span>
                                                </div>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {listing.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                            Description
                                        </h3>
                                        <p className="text-sm  leading-relaxed">
                                            {listing.description}
                                        </p>
                                    </div>
                                )}

                                {listing.tags && listing.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.tags.map((tag: string, idx: number) => (
                                                <Badge key={idx} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Operating Hours */}
                                {listing.openingHours && listing.openingHours.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Opening Hours
                                        </h3>
                                        <div className="space-y-1">
                                            {listing.openingHours.slice(0, 7).map((hour: string, idx: number) => (
                                                <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                                    {hour}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Listing Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {createdDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium ">
                                                Created
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {format(createdDate, "PPP")}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(createdDate, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {publishedDate && (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium ">
                                                Published
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {format(publishedDate, "PPP")}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(publishedDate, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {expiryDate && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium ">
                                                {isPlanExpired ? "Expired On" : "Expires On"}
                                            </p>
                                            <p className={cn(
                                                "text-sm",
                                                isPlanExpired ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                                            )}>
                                                {format(expiryDate, "PPP")}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(expiryDate, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {plan && (
                                    <div className="flex items-start gap-3">
                                        <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium ">
                                                Current Plan
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {plan.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatPrice(plan.priceINR)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Plan Upgrade */}
                        {canUpgradePlan && (
                            <Card className="border-yellow-200 bg-yellow-50">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-yellow-600" />
                                        Upgrade Your Plan
                                    </CardTitle>
                                    <CardDescription>
                                        {isPlanExpired
                                            ? "Your plan has expired. Upgrade now to maintain premium visibility."
                                            : "Get more visibility and grow your business faster with a premium plan."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                                        <Crown className="h-4 w-4 mr-2" />
                                        Upgrade Now
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Listing Photos</CardTitle>
                                <CardDescription>
                                    {photosArray.length} photo{photosArray.length !== 1 ? 's' : ''} from your listing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {photosArray.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {photosArray.map((photo: string, idx: number) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                                    idx === 0
                                                        ? "border-red-500  ring-red-500 ring-offset-2"
                                                        : "border-gray-200"
                                                )}
                                            >
                                                <Image
                                                    src={photo}
                                                    alt={`Listing photo ${idx + 1}`}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="object-cover"
                                                />
                                                {idx === 0 && (
                                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-white" />
                                                        Primary
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">No photos available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {listing.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                                            <a
                                                href={`tel:${listing.phone}`}
                                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                            >
                                                {listing.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {listing.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                                            <a
                                                href={`mailto:${listing.email}`}
                                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                            >
                                                {listing.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {listing.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</p>
                                            <a
                                                href={listing.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                {listing.website}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
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
