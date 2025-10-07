"use client"

import { Check, MapPin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BusinessConfirmationCardProps {
    name: string
    address: string
    phone?: string
    website?: string
    rating?: number
    userRatingCount?: number
    openingHours?: string[]
    googleMapsUri?: string
    onDismiss?: () => void
    className?: string
}

export function BusinessConfirmationCard({
    name,
    address,
    onDismiss,
    className = ""
}: BusinessConfirmationCardProps) {
    return (
        <div
            className={`border border-emerald-500 bg-white rounded-lg p-3 ${className}`}
        >
            <div className="flex gap-2 items-start">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-1.5 py-0 h-5">
                            Verified
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{address}</span>
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                        ✓ Details auto-filled from Google Maps
                    </p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1.5 hover:bg-gray-50 rounded text-gray-500 transition-colors shrink-0"
                        aria-label="Dismiss"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
