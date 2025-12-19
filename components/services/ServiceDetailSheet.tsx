"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import {
    MapPin, Phone, Mail, Globe, Star, X, Clock, User,
    IndianRupee, Briefcase, MessageCircle, Navigation,
    Calendar, BadgeCheck, Share2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getServiceCategoryBySlug, SERVICE_QUALITY_LEVELS, SERVICE_EXPERIENCE_LEVELS, type QualityLevel, type ExperienceLevel } from "@/config/services"
import { toast } from "sonner"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Jagdalpur";

/**
 * ServiceDetailSheet - Shows detailed service info in a slide-over sheet
 * Opens when URL has ?service_id=xxx parameter
 */
export default function ServiceDetailSheet() {
    const sp = useSearchParams()
    const router = useRouter()
    const id = useMemo(() => sp.get("service_id") || "", [sp])
    const [open, setOpen] = useState(false)
    const [data, setData] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const active = !!id
        setOpen(active)
        if (!active) {
            setData(null)
            setLoading(false)
            return
        }
        // Set loading immediately when opening
        setLoading(true)
        setData(null) // Clear previous data

        // Fetch service details
        fetch(`/api/services/${id}`)
            .then((r) => r.json())
            .then((j) => setData(j?.data || null))
            .catch((err) => {
                console.error("Failed to fetch service:", err)
                setData(null)
            })
            .finally(() => setLoading(false))
    }, [id])

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            const url = new URL(window.location.href)
            url.searchParams.delete("service_id")
            const newUrl = url.pathname + url.search
            router.replace(newUrl as any, { scroll: false })
            setData(null)
        }
        setOpen(isOpen)
    }

    // Handle phone call
    const handleCall = () => {
        if (data?.contactNumber) {
            window.open(`tel:+91${data.contactNumber}`, "_self")
        }
    }

    // Handle WhatsApp
    const handleWhatsApp = () => {
        if (data?.whatsappNumber) {
            const message = encodeURIComponent(
                `Hi ${data.name}, I found your service on ${CITY_NAME} Directory and would like to inquire about your ${data.serviceLabel || data.service} services.`
            )
            window.open(`https://wa.me/91${data.whatsappNumber}?text=${message}`, "_blank")
        }
    }

    // Handle Share
    const handleShare = async () => {
        const shareUrl = window.location.href
        const shareText = `Check out ${data?.name} - ${data?.serviceLabel || data?.service} on ${CITY_NAME} Directory`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: data?.name,
                    text: shareText,
                    url: shareUrl,
                })
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Link copied to clipboard!")
        }
    }

    if (!open) return null

    // Get service category info
    const category = data ? getServiceCategoryBySlug(data.serviceSlug || data.service) : null
    const serviceIcon = category?.icon || "🔧"
    const serviceLabel = category?.label || data?.service || "Service"
    const serviceBgColor = category?.color || "bg-gray-100"

    // Get quality level info
    const qualityInfo = data?.qualityRating
        ? SERVICE_QUALITY_LEVELS.find((q: QualityLevel) => q.value === Math.round(data.qualityRating))
        : null

    // Get experience level info
    const experienceInfo = data?.experienceYears
        ? SERVICE_EXPERIENCE_LEVELS.find((e: ExperienceLevel) => {
            const years = data.experienceYears
            if (years === undefined) return false
            if (e.min <= years && years < e.max) return true
            if (e.max === 100 && years >= e.min) return true
            return false
        })
        : null

    // Render star rating
    const renderStars = (rating: number) => {
        const stars = []
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={cn(
                        "h-5 w-5",
                        i < Math.floor(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                    )}
                />
            )
        }
        return stars
    }

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent className="w-full sm:max-w-lg p-0 overflow-hidden no-default-close bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                {/* Accessible title - visually hidden */}
                <SheetTitle className="sr-only">{data?.name || "Service Details"}</SheetTitle>

                <ScrollArea className="h-full">
                    {(loading || !data) ? (
                        <div className="space-y-0 animate-pulse">
                            {/* Hero Skeleton */}
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-7 w-3/4" />
                                        <Skeleton className="h-6 w-1/2" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                </div>
                            </div>

                            {/* Content Skeleton */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Hero Section with Profile */}
                            <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
                                {/* Close Button */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-4 right-4 bg-white/80 backdrop-blur hover:bg-white"
                                    onClick={() => handleClose(false)}
                                    aria-label="Close details"
                                >
                                    <X className="h-4 w-4" />
                                </Button>

                                {/* Profile Section */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                    {/* Large Profile Photo */}
                                    <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-4 ring-white/50">
                                        {data.profilePhoto ? (
                                            <AvatarImage src={data.profilePhoto} alt={data.name} />
                                        ) : (
                                            <AvatarFallback className="bg-white text-gray-400 text-3xl">
                                                <User className="h-12 w-12" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>

                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>

                                        {/* Service Type Badge */}
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-base mt-2",
                                            serviceBgColor,
                                            "text-gray-800"
                                        )}>
                                            <span className="text-xl">{serviceIcon}</span>
                                            <span className="font-medium">{serviceLabel}</span>
                                        </div>

                                        {/* Star Rating */}
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                                            <div className="flex">{renderStars(data.qualityRating)}</div>
                                            <span className="text-lg font-semibold text-gray-900">
                                                {data.qualityRating.toFixed(1)}
                                            </span>
                                            {qualityInfo && (
                                                <Badge variant="secondary" className="ml-1">
                                                    {qualityInfo.label}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Verified Badge */}
                                        {data.aadharNumber && (
                                            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-green-600">
                                                <BadgeCheck className="h-4 w-4" />
                                                <span className="text-sm font-medium">Verified</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="p-4 border-b border-gray-100 bg-white">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={handleCall}
                                        className="bg-red-600 hover:bg-red-700 gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Phone className="h-4 w-4" />
                                        Call Now
                                    </Button>
                                    <Button
                                        onClick={handleWhatsApp}
                                        className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        WhatsApp
                                    </Button>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6 space-y-6">
                                {/* Charges Card */}
                                <Card className="border-0 bg-gradient-to-r from-red-50 to-orange-50 shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee className="h-5 w-5 text-red-600" />
                                                <span className="text-gray-700 font-medium">Charges per Hour</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-red-700">
                                                    ₹{data.chargesPerHour}
                                                </span>
                                                {data.isNegotiable && (
                                                    <Badge variant="outline" className="ml-2 text-red-600 border-red-300 bg-white/50">
                                                        Negotiable
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Info Cards */}
                                <div className="space-y-4">
                                    {/* Working Hours */}
                                    {data.workingHours && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Working Hours</p>
                                                <p className="text-gray-900">{data.workingHours}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {data.experienceYears && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <Briefcase className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Experience</p>
                                                <p className="text-gray-900">
                                                    {data.experienceYears} years
                                                    {experienceInfo && (
                                                        <span className="text-gray-500 ml-2">
                                                            ({experienceInfo.label})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Address */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                        <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700">Address</p>
                                            <p className="text-gray-900">{data.address}</p>
                                            {data.blockOfCity && (
                                                <p className="text-sm text-gray-600">Area: {data.blockOfCity}</p>
                                            )}
                                            {data.officeAddress && data.officeAddress !== data.address && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    <p className="text-sm font-medium text-gray-700">Office Address</p>
                                                    <p className="text-gray-900">{data.officeAddress}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Numbers */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                        <Phone className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Contact</p>
                                            <p className="text-gray-900">+91 {data.contactNumber}</p>
                                            {data.whatsappNumber !== data.contactNumber && (
                                                <p className="text-gray-600 text-sm">
                                                    WhatsApp: +91 {data.whatsappNumber}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    {data.email && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <Mail className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Email</p>
                                                <a
                                                    href={`mailto:${data.email}`}
                                                    className="text-red-600 hover:text-red-700 hover:underline"
                                                >
                                                    {data.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Website */}
                                    {data.website && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <Globe className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Website</p>
                                                <a
                                                    href={data.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-red-600 hover:text-red-700 hover:underline"
                                                >
                                                    {data.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Personal Info */}
                                    {(data.age || data.gender) && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <User className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Personal Info</p>
                                                <div className="flex gap-4 text-gray-900">
                                                    {data.gender && (
                                                        <span className="capitalize">{data.gender}</span>
                                                    )}
                                                    {data.age && <span>{data.age} years old</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {data.tags && data.tags.length > 0 && (
                                        <div className="p-4 bg-gray-50/80 rounded-xl shadow-sm">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Skills & Services</p>
                                            <div className="flex flex-wrap gap-2">
                                                {data.tags.map((tag: string, idx: number) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs shadow-sm">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Share Button */}
                                <Button
                                    variant="outline"
                                    onClick={handleShare}
                                    className="w-full gap-2 shadow-sm hover:shadow-md transition-all border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Share This Service
                                </Button>

                                {/* Status Badge for Non-Live */}
                                {data.status && data.status !== 'live' && (
                                    <div className="text-center py-4">
                                        <Badge
                                            variant={data.status === 'pending' ? 'secondary' : 'destructive'}
                                            className="text-sm px-4 py-1"
                                        >
                                            Status: {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
