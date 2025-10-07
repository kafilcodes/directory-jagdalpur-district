"use client"

import * as React from "react"
import Image from "next/image"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MapPin, Building2, Phone, Globe, Clock, Image as ImageIcon, AlertTriangle, Loader2, X, Check } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { BusinessPlaceholder } from "@/components/common/BusinessPlaceholder"
import { validateDhamtariAddress, isBusinessType, cachePlaceData, getCachedPlaceData } from "@/lib/listing-utils"

export interface BusinessSuggestion {
    placeId: string
    name: string
    address: string
    description: string
    types: string[]
    photoName?: string // First photo reference from Places API
}

export interface PlaceDetails {
    id: string
    placeId?: string
    name: string
    address: string
    formattedAddress?: string
    location: { lat: number; lng: number }
    types: string[]
    primaryType?: string
    phone?: string
    website?: string
    rating?: number
    userRatingCount?: number
    googleMapsUri?: string
    businessStatus?: string
    photos?: Array<{ name: string; widthPx?: number; heightPx?: number }>
    openingHours?: string[]
    currentOpeningHours?: string[]
    regularOpeningHours?: {
        weekdayDescriptions?: string[]
        openNow?: boolean
    }
    editorialSummary?: string
    addressComponents?: Array<{
        longName: string
        shortName: string
        types: string[]
    }>
    plusCode?: any
    viewport?: any
}

interface BusinessSearchProps {
    onSelect: (business: BusinessSuggestion) => void
    placeholder?: string
    disabled?: boolean
}

/**
 * Debounce hook for optimizing API calls
 */
function useDebounce<T>(value: T, delay = 800): T {
    const [debounced, setDebounced] = React.useState(value)

    React.useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])

    return debounced
}

/**
 * Business Search Component
 * Uses Google Places Autocomplete API with strict Dhamtari geofencing
 * Implements debouncing and session tokens for cost optimization
 * Dynamic expanding style matching hero section
 */
export function BusinessSearch({ onSelect, placeholder = "Search for your business...", disabled = false }: BusinessSearchProps) {
    const [query, setQuery] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<BusinessSuggestion[]>([])
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
    const [selectedBusiness, setSelectedBusiness] = React.useState<BusinessSuggestion | null>(null)

    // New state for enhanced features
    const [placeDetails, setPlaceDetails] = React.useState<PlaceDetails | null>(null)
    const [loadingDetails, setLoadingDetails] = React.useState(false)
    const [validationError, setValidationError] = React.useState<string | null>(null)
    const [cachingProgress, setCachingProgress] = React.useState<{
        show: boolean
        percent: number
        current: number
        total: number
    } | null>(null)
    const [activeTab, setActiveTab] = React.useState("images")
    const [lightboxImage, setLightboxImage] = React.useState<string | null>(null)

    const debouncedQuery = useDebounce(query, 800) // 800ms delay for optimal UX

    // Fetch autocomplete suggestions
    React.useEffect(() => {
        let cancelled = false

        const fetchSuggestions = async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 2) {
                setSuggestions([])
                return
            }

            setLoading(true)

            try {
                const response = await fetch('/api/places-autocomplete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: debouncedQuery.trim(),
                    }),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    console.error('Autocomplete API error:', response.status, errorData)
                    if (!cancelled) {
                        setSuggestions([])
                    }
                    return
                }

                const data = await response.json()

                if (!cancelled) {
                    if (data.success) {
                        setSuggestions(data.predictions || [])
                    } else {
                        console.error('Autocomplete error:', data.error, data.details)
                        setSuggestions([])
                    }
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error)
                if (!cancelled) {
                    setSuggestions([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchSuggestions()

        return () => {
            cancelled = true
        }
    }, [debouncedQuery])

    const handleBusinessSelect = async (business: BusinessSuggestion) => {
        setSelectedBusiness(business)
        setShowConfirmDialog(true)
        setLoadingDetails(true)
        setValidationError(null)
        setPlaceDetails(null)
        setActiveTab("images") // Reset to first tab

        try {
            // Fetch full place details from API
            const response = await fetch('/api/google-places/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ placeId: business.placeId }),
            })

            const data = await response.json()

            // Handle API-level validation failures (400 errors from backend)
            if (!response.ok) {
                if (response.status === 400) {
                    // Backend validation failed - show user-friendly error
                    const errorMessage = data.error || 'This business cannot be listed'
                    setValidationError(errorMessage)

                    // Still fetch cached data if available for preview
                    const cached = getCachedPlaceData(business.placeId)
                    if (cached && cached.placeDetails) {
                        setPlaceDetails(cached.placeDetails)
                    }

                    return // Stop here, don't proceed with confirmation
                }

                throw new Error(data.error || 'Failed to fetch place details')
            }

            // Success - set place details
            if (!data.success || !data.placeDetails) {
                throw new Error(data.error || 'Invalid response from API')
            }

            setPlaceDetails(data.placeDetails)

            // Start background caching for offline use
            handleOfflineCaching(business.placeId).catch(err =>
                console.warn('Background caching failed:', err)
            )

        } catch (error) {
            console.error('❌ Error fetching place details:', error)

            // Graceful fallback - try to load from cache
            const cached = getCachedPlaceData(business.placeId)
            if (cached && cached.placeDetails) {
                setPlaceDetails(cached.placeDetails)
                setValidationError('Using cached data (network unavailable)')
            } else {
                setValidationError(
                    error instanceof Error
                        ? error.message
                        : 'Network error - please check your connection and try again'
                )
            }
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleOfflineCaching = async (placeId: string) => {
        try {
            setCachingProgress({ show: true, percent: 0, current: 0, total: 0 })

            // Fetch basic place info that we can get
            const photoNames = placeDetails?.photos?.map(p => p.name) || []

            await cachePlaceData(
                placeId,
                placeDetails,
                photoNames,
                (percent, current, total) => {
                    setCachingProgress({ show: true, percent, current, total })
                }
            )

            setCachingProgress(null)

            // Log success
            console.log('Offline copy saved - complete your listing later')

            // DON'T auto-confirm - let user review and click Confirm button
            // handleConfirm() ← REMOVED: This was auto-closing the modal!

        } catch (error) {
            console.error('Caching failed:', error)
            setCachingProgress(null)
        }
    }

    const handleConfirm = () => {
        if (selectedBusiness) {
            setQuery("")
            setSuggestions([])
            onSelect(selectedBusiness)
        }
        setShowConfirmDialog(false)
        setSelectedBusiness(null)
        setPlaceDetails(null)
        setValidationError(null)
    }

    const handleCancel = () => {
        setShowConfirmDialog(false)
        setSelectedBusiness(null)
        setPlaceDetails(null)
        setValidationError(null)
    }

    return (
        <>
            <div className="w-full">
                <Command className="group rounded-xl border border-gray-200 shadow-none ring-0 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200">
                    <div className="p-2">
                        <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500" />
                                <CommandInput
                                    className="h-11 pl-9 text-sm outline-none focus:outline-none focus:ring-0 ring-0 border-0 shadow-none"
                                    placeholder={placeholder}
                                    value={query}
                                    onValueChange={setQuery}
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>

                    <CommandList className="max-h-64 overflow-auto scroll-smooth">
                        {loading && (
                            <div className="p-4 grid gap-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10" />
                                ))}
                            </div>
                        )}

                        {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
                            <CommandEmpty>No businesses found in Dhamtari</CommandEmpty>
                        )}

                        {!loading && suggestions.length > 0 && (
                            <CommandGroup heading="Businesses in Dhamtari">
                                {suggestions.map((business) => (
                                    <CommandItem
                                        key={business.placeId}
                                        value={business.name}
                                        onSelect={() => handleBusinessSelect(business)}
                                        className="cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-start gap-3 w-full py-2">
                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shrink-0">
                                                <Building2 className="h-6 w-6 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 truncate mb-1">
                                                    {business.name}
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                    <span className="text-sm text-gray-600 line-clamp-2">
                                                        {business.address}
                                                    </span>
                                                </div>
                                                {business.types && business.types.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        {business.types.slice(0, 2).map((type, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                                {type.replace(/_/g, ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </div>

            {/* Confirmation Dialog with Tabs */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-red-500" />
                            Confirm Your Business
                        </DialogTitle>
                        <DialogDescription>
                            Review business details and confirm this is your business location
                        </DialogDescription>

                        {/* Business Summary with Primary Photo */}
                        {placeDetails && !loadingDetails && (
                            <div className="pt-4">
                                <div className="flex gap-4">
                                    {/* Primary Photo */}
                                    {placeDetails.photos && placeDetails.photos[0] ? (
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                                            <Image
                                                src={`/api/google-places/photo?name=${encodeURIComponent(placeDetails.photos[0].name)}&maxWidth=200&maxHeight=200`}
                                                alt={placeDetails.name}
                                                fill
                                                sizes="96px"
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 flex-shrink-0">
                                            <BusinessPlaceholder />
                                        </div>
                                    )}

                                    {/* Business Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                                            {placeDetails.name}
                                        </h3>
                                        {placeDetails.primaryType && (
                                            <p className="text-sm text-gray-600 capitalize">
                                                {placeDetails.primaryType.replace(/_/g, ' ')}
                                            </p>
                                        )}
                                        {placeDetails.address && (
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                {placeDetails.address}
                                            </p>
                                        )}

                                        {/* Status Badges */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {/* Location Status Badge */}
                                            {!validationError ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="text-green-600">✓</span>
                                                    Dhamtari Location
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <span className="text-red-600">✕</span>
                                                    Location Restricted
                                                </span>
                                            )}

                                            {/* Commercial Status Badge - Always show as validated since API validated it */}
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <span className="text-green-600">✓</span>
                                                Commercial Business
                                            </span>

                                            {/* PIN Code Badge if available */}
                                            {placeDetails.addressComponents?.find((c: any) =>
                                                c.types?.includes('postal_code')
                                            )?.longName && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        📍 PIN: {placeDetails.addressComponents.find((c: any) =>
                                                            c.types?.includes('postal_code')
                                                        )?.longName}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    {/* Validation Error Banner */}
                    {validationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-red-900">Location Restricted</div>
                                <div className="text-sm text-red-700">{validationError}</div>
                            </div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loadingDetails && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                        </div>
                    )}

                    {/* Caching Progress */}
                    {cachingProgress?.show && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Saving offline copy...</span>
                                <span className="text-sm font-semibold">{cachingProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${cachingProgress.percent}%` }}
                                />
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                                Downloaded {cachingProgress.current} of {cachingProgress.total} images
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    {placeDetails && !loadingDetails && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="images">
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Images
                                </TabsTrigger>
                                <TabsTrigger value="address">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Address
                                </TabsTrigger>
                                <TabsTrigger value="contact">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Contact
                                </TabsTrigger>
                            </TabsList>

                            {/* Images Tab */}
                            <TabsContent value="images" className="flex-1 overflow-y-auto">
                                <div className="p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                        Business Photos ({placeDetails.photos?.length || 0})
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {placeDetails.photos && placeDetails.photos.length > 0 ? (
                                            placeDetails.photos.slice(0, 9).map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setLightboxImage(photo.name)}
                                                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition border border-gray-200"
                                                >
                                                    <Image
                                                        src={`/api/google-places/photo?name=${encodeURIComponent(photo.name)}&maxWidth=400&maxHeight=400`}
                                                        alt={`${placeDetails.name} - Image ${idx + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 50vw, 33vw"
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center text-gray-500 py-8">
                                                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                                <p>No images available for this business</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Address Tab */}
                            <TabsContent value="address" className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 mb-1">Full Address</div>
                                        <div className="text-base text-gray-900">
                                            {placeDetails.address || placeDetails.formattedAddress}
                                        </div>
                                    </div>

                                    {placeDetails.addressComponents && placeDetails.addressComponents.length > 0 && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-2">Address Components</div>
                                            <div className="space-y-1">
                                                {placeDetails.addressComponents
                                                    .filter((comp) => comp.types && comp.types.length > 0 && comp.longName)
                                                    .map((comp, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">{comp.types[0].replace(/_/g, ' ')}:</span>
                                                            <span className="font-medium">{comp.longName}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {placeDetails.googleMapsUri && (
                                        <a
                                            href={placeDetails.googleMapsUri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Open in Google Maps
                                        </a>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Contact Tab */}
                            <TabsContent value="contact" className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-4">
                                    {placeDetails.phone && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-sm text-gray-500">Phone</div>
                                                <a href={`tel:${placeDetails.phone}`} className="font-medium text-blue-600">
                                                    {placeDetails.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {placeDetails.website && (
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-sm text-gray-500">Website</div>
                                                <a
                                                    href={placeDetails.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:underline break-all"
                                                >
                                                    {placeDetails.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {(placeDetails.openingHours || placeDetails.regularOpeningHours) && (
                                        <div className="flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-500 mb-2">Opening Hours</div>
                                                {placeDetails.regularOpeningHours?.openNow !== undefined && (
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${placeDetails.regularOpeningHours.openNow
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {placeDetails.regularOpeningHours.openNow ? 'Open Now' : 'Closed'}
                                                    </div>
                                                )}
                                                {/* Handle both formats: array of strings or nested object */}
                                                {Array.isArray(placeDetails.openingHours) ? (
                                                    <div className="space-y-1 text-sm">
                                                        {placeDetails.openingHours.map((day: string, idx: number) => (
                                                            <div key={idx}>{day}</div>
                                                        ))}
                                                    </div>
                                                ) : placeDetails.regularOpeningHours?.weekdayDescriptions ? (
                                                    <div className="space-y-1 text-sm">
                                                        {placeDetails.regularOpeningHours.weekdayDescriptions.map((day: string, idx: number) => (
                                                            <div key={idx}>{day}</div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}                                    {placeDetails.rating && (
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">⭐</div>
                                            <div>
                                                <div className="text-sm text-gray-500">Rating</div>
                                                <div className="font-semibold">
                                                    {placeDetails.rating} / 5
                                                    {placeDetails.userRatingCount && (
                                                        <span className="text-sm text-gray-500 ml-1">
                                                            ({placeDetails.userRatingCount} reviews)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* Footer Actions */}
                    <div className="border-t pt-4">
                        {/* Helper text when disabled */}
                        {validationError && (
                            <div className="mb-3 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <strong className="text-amber-900">Cannot proceed:</strong> {validationError}
                                <div className="mt-1 text-xs text-amber-700">
                                    Please select a commercial business located in Dhamtari district (PIN: 493773).
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all font-medium flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!!validationError || loadingDetails}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {loadingDetails ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Confirm & Continue
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox for Full Image View */}
            {lightboxImage && (
                <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Image Preview</DialogTitle>
                            <DialogDescription>Full size image view</DialogDescription>
                        </DialogHeader>
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                            aria-label="Close image preview"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="relative w-full h-[70vh]">
                            <Image
                                src={`/api/google-places/photo?name=${encodeURIComponent(lightboxImage)}&maxWidth=1200&maxHeight=800`}
                                alt="Full size preview"
                                fill
                                sizes="100vw"
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
