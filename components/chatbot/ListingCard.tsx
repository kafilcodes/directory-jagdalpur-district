"use client"

import Image from "next/image"
import { MapPin, Phone, ExternalLink, Store, Hotel, Utensils, Heart, GraduationCap, ShoppingBag, Wrench } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

interface ListingCardProps {
    listing: {
        id: string
        name: string
        category?: string
        photos?: string[]
        address?: string | { formattedAddress: string }
        phone?: string
        website?: string
        description?: string
        views?: number
    }
}

/**
 * Get category icon based on category string
 */
const getCategoryIcon = (category?: string) => {
    if (!category) return <Store className="w-3.5 h-3.5" />

    const cat = category.toLowerCase()

    if (cat.includes('hotel') || cat.includes('lodging')) return <Hotel className="w-3.5 h-3.5" />
    if (cat.includes('restaurant') || cat.includes('food') || cat.includes('cafe')) return <Utensils className="w-3.5 h-3.5" />
    if (cat.includes('health') || cat.includes('hospital') || cat.includes('medical')) return <Heart className="w-3.5 h-3.5" />
    if (cat.includes('education') || cat.includes('school') || cat.includes('college')) return <GraduationCap className="w-3.5 h-3.5" />
    if (cat.includes('shop') || cat.includes('store') || cat.includes('retail')) return <ShoppingBag className="w-3.5 h-3.5" />
    if (cat.includes('service') || cat.includes('repair')) return <Wrench className="w-3.5 h-3.5" />

    return <Store className="w-3.5 h-3.5" />
}

/**
 * Format category text (remove underscores, capitalize)
 */
const formatCategory = (category?: string) => {
    if (!category) return ''
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Listing Card Component for Chatbot
 * Displays business listing with image, details, and actions
 * Opens listing detail sheet instead of navigating to separate page
 */
export function ListingCard({ listing }: ListingCardProps) {
    const router = useRouter()
    const pathname = usePathname()

    const imageUrl = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null
    const address = typeof listing.address === 'string'
        ? listing.address
        : listing.address?.formattedAddress || 'Address not available'

    const handleViewDetails = () => {
        // Close chatbot first
        window.dispatchEvent(new CustomEvent('closeChatbot'))

        // Open listing detail sheet with URL param after a brief delay
        setTimeout(() => {
            const url = `${pathname}?id=${listing.id}`
            window.history.pushState({}, '', url)

            // Trigger popstate to update components listening to URL changes
            window.dispatchEvent(new PopStateEvent('popstate'))
        }, 100)
    }

    return (
        <div className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 max-w-[280px]">
            {/* Image */}
            {imageUrl && (
                <div className="relative w-full h-28 bg-gray-100">
                    <Image
                        src={imageUrl}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="280px"
                        unoptimized
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-2.5 space-y-1.5">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                    {listing.name}
                </h3>

                {/* Category with Icon */}
                {listing.category && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500">
                        {getCategoryIcon(listing.category)}
                        <span className="font-medium">{formatCategory(listing.category)}</span>
                    </div>
                )}

                {/* Address */}
                {address && (
                    <div className="flex items-start gap-1 text-[11px] text-gray-600">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span className="line-clamp-1">{address}</span>
                    </div>
                )}

                {/* Phone */}
                {listing.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-600">
                        <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <a
                            href={`tel:${listing.phone}`}
                            className="hover:text-red-500 transition-colors truncate"
                        >
                            {listing.phone}
                        </a>
                    </div>
                )}

                {/* View Listing Button */}
                <button
                    onClick={handleViewDetails}
                    className="block w-full text-center bg-red-500 hover:bg-red-600 text-white text-[11px] font-medium py-1.5 rounded transition-colors mt-1.5 cursor-pointer"
                >
                    View Details
                </button>
            </div>
        </div>
    )
}
