"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Phone, Clock, IndianRupee, User } from "lucide-react"
import { getServiceCategoryBySlug, getServiceEmoji, getServiceColor } from "@/config/services"
import { cn } from "@/lib/utils"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Jagdalpur";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";

export type ServiceCardProps = {
    id: string
    name: string
    service: string // service type slug
    serviceSlug?: string
    address: string
    qualityRating: number
    chargesPerHour: number
    isNegotiable?: boolean
    profilePhoto?: string | null
    workingHours?: string
    contactNumber?: string
    experienceYears?: number | null
    status?: 'pending' | 'live' | 'rejected'
}

export function ServiceCard({
    id,
    name,
    service,
    serviceSlug,
    address,
    qualityRating,
    chargesPerHour,
    isNegotiable,
    profilePhoto,
    workingHours,
    contactNumber,
    experienceYears,
    status
}: ServiceCardProps) {
    // Get service category info
    const category = getServiceCategoryBySlug(serviceSlug || service)
    const serviceIcon = category?.icon || "🔧"
    const serviceLabel = category?.label || service
    const serviceBgColor = category?.color || "bg-gray-100"

    // Clean address - remove city, state, pincode, India
    const cleanAddress = address
        ?.replace(new RegExp(`,?\\s*${CITY_NAME},?\\s*`, 'gi'), '')
        ?.replace(new RegExp(`,?\\s*${STATE_NAME},?\\s*`, 'gi'), '')
        ?.replace(/,?\s*India,?\s*/gi, '')
        ?.replace(/,?\s*\d{6},?\s*/g, '') // Remove 6-digit pincodes
        ?.trim()
        ?.replace(/^,|,$/g, '') // Remove leading/trailing commas
        ?.trim() || address

    // Render star rating
    const renderStars = () => {
        const stars = []
        const fullStars = Math.floor(qualityRating)
        const hasHalfStar = qualityRating % 1 >= 0.5

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                )
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-200 text-yellow-400" />
                )
            } else {
                stars.push(
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300" />
                )
            }
        }

        return (
            <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="flex items-center gap-0.5">{stars}</div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700">{qualityRating.toFixed(1)}</span>
            </div>
        )
    }

    return (
        <Card className="group bg-white border border-gray-100 shadow-sm hover:shadow-lg rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full flex flex-col">
            {/* Header with Avatar and Service Icon */}
            <div className="relative bg-gradient-to-br from-orange-50/50 to-yellow-50/50 p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                    {/* Profile Photo */}
                    <Avatar className="h-11 w-11 sm:h-14 sm:w-14 border-2 border-white shadow-md ring-2 ring-orange-100/50 flex-shrink-0">
                        {profilePhoto ? (
                            <AvatarImage src={profilePhoto} alt={name} />
                        ) : (
                            <AvatarFallback className="bg-white text-gray-400">
                                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                            </AvatarFallback>
                        )}
                    </Avatar>

                    {/* Name and Service */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate leading-tight">{name}</h3>
                        <div className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs sm:text-sm mt-1",
                            serviceBgColor,
                            "text-gray-700"
                        )}>
                            <span className="text-sm sm:text-base">{serviceIcon}</span>
                            <span className="font-medium truncate">{serviceLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Status badge for admin view */}
                {status && status !== 'live' && (
                    <Badge
                        variant={status === 'pending' ? 'secondary' : 'destructive'}
                        className="absolute top-2 right-2 text-[10px]"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                )}
            </div>

            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-3 space-y-1.5 sm:space-y-2 flex-1 flex flex-col">
                {/* Star Rating */}
                {renderStars()}

                {/* Charges */}
                <div className="flex items-center gap-1 sm:gap-1.5 text-gray-700">
                    <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    <span className="font-semibold text-sm sm:text-base">₹{chargesPerHour}</span>
                    <span className="text-xs sm:text-sm text-gray-500">/hour</span>
                    {isNegotiable && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs ml-1 py-0 px-1 sm:px-1.5 border-green-200 text-green-700 bg-green-50">
                            Negotiable
                        </Badge>
                    )}
                </div>

                {/* Experience */}
                {experienceYears && experienceYears > 0 && (
                    <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">{experienceYears}</span>
                        <span> years experience</span>
                    </div>
                )}

                {/* Working Hours */}
                {workingHours && (
                    <div className="flex items-start gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-500">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{workingHours}</span>
                    </div>
                )}

                {/* Address - at bottom */}
                <div className="flex items-start gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-gray-500 mt-auto pt-1.5 sm:pt-2">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5 shrink-0 text-red-500" />
                    <p className="line-clamp-2 leading-tight lowercase first-letter:uppercase">{cleanAddress}</p>
                </div>
            </CardContent>
        </Card>
    )
}

// Compact version for search results
export function ServiceCardCompact({
    id,
    name,
    service,
    serviceSlug,
    address,
    qualityRating,
    chargesPerHour,
    isNegotiable,
    profilePhoto,
    workingHours,
}: ServiceCardProps) {
    const category = getServiceCategoryBySlug(serviceSlug || service)
    const serviceIcon = category?.icon || "🔧"
    const serviceLabel = category?.label || service

    // Render compact stars
    const renderStarsCompact = () => (
        <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{qualityRating.toFixed(1)}</span>
        </div>
    )

    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
            {/* Avatar with service emoji overlay */}
            <div className="relative">
                <Avatar className="h-12 w-12 border border-gray-200">
                    {profilePhoto ? (
                        <AvatarImage src={profilePhoto} alt={name} />
                    ) : (
                        <AvatarFallback className="bg-gray-100 text-gray-400">
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    )}
                </Avatar>
                <span className="absolute -bottom-1 -right-1 text-lg bg-white rounded-full shadow-sm p-0.5">
                    {serviceIcon}
                </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{name}</h4>
                    {renderStarsCompact()}
                </div>
                <p className="text-sm text-gray-600">{serviceLabel}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="text-green-700 font-medium">₹{chargesPerHour}/hr</span>
                    {isNegotiable && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                            Negotiable
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    )
}
