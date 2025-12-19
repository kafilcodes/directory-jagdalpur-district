"use client"

import Image from "next/image"
import { MapPin, Phone, MessageCircle, IndianRupee, Star, Clock, Wrench, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

interface ServiceCardWidgetProps {
    service: {
        id: string
        name: string
        service?: string
        serviceSlug?: string
        profilePhoto?: string
        address?: string
        whatsappNumber?: string
        contactNumber?: string
        chargesPerHour?: number
        isNegotiable?: boolean
        qualityRating?: number
        workingHours?: string
        experienceYears?: number
    }
}

/**
 * Format service type text
 */
const formatServiceType = (service?: string) => {
    if (!service) return 'Service Provider'
    return service
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Service Card Widget for Chatbot
 * Displays service provider (gig worker) details with contact options
 * Opens service detail sheet when clicked
 */
export function ServiceCardWidget({ service }: ServiceCardWidgetProps) {
    const router = useRouter()
    const pathname = usePathname()

    const profileUrl = service.profilePhoto || null

    const handleViewDetails = () => {
        // Close chatbot first
        window.dispatchEvent(new CustomEvent('closeChatbot'))

        // Navigate to search page with service tab and service_id param
        setTimeout(() => {
            router.push(`/search?type=service&service_id=${service.id}`)
        }, 100)
    }

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (service.whatsappNumber) {
            const message = encodeURIComponent(`Hi ${service.name}, I found you on the directory and would like to inquire about your ${formatServiceType(service.service)} services.`)
            window.open(`https://wa.me/91${service.whatsappNumber}?text=${message}`, '_blank')
        }
    }

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (service.contactNumber) {
            window.open(`tel:+91${service.contactNumber}`, '_self')
        }
    }

    return (
        <div
            onClick={handleViewDetails}
            className="flex flex-col rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 max-w-[280px] cursor-pointer border border-orange-200/50"
        >
            {/* Header with Profile */}
            <div className="p-3 flex items-start gap-3">
                {/* Profile Photo */}
                <div className="relative w-12 h-12 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden border-2 border-orange-200 shadow-sm">
                    {profileUrl ? (
                        <Image
                            src={profileUrl}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-orange-400" />
                        </div>
                    )}
                </div>

                {/* Name & Service Type */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                        {service.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                        <Wrench className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600 font-medium line-clamp-1">
                            {formatServiceType(service.service)}
                        </span>
                    </div>

                    {/* Rating */}
                    {service.qualityRating && service.qualityRating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < service.qualityRating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="px-3 pb-2 space-y-1.5">
                {/* Address */}
                {service.address && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{service.address}</span>
                    </div>
                )}

                {/* Charges */}
                {service.chargesPerHour && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <IndianRupee className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 font-semibold">
                            ₹{service.chargesPerHour}/hr
                        </span>
                        {service.isNegotiable && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                Negotiable
                            </span>
                        )}
                    </div>
                )}

                {/* Working Hours */}
                {service.workingHours && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{service.workingHours}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 px-3 pb-3 pt-1">
                {service.contactNumber && (
                    <button
                        onClick={handleCall}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-medium">Call</span>
                    </button>
                )}
                {service.whatsappNumber && (
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="font-medium">WhatsApp</span>
                    </button>
                )}
            </div>
        </div>
    )
}
