"use client"

import * as React from "react"
import Image from "next/image"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MapPin, Building2, Phone, Globe, Clock, Image as ImageIcon, AlertTriangle, Loader2, X, Check, MapPinOff, MapPinXInside } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { BusinessPlaceholder } from "@/components/common/BusinessPlaceholder"
import { validateDhamtariAddress, isBusinessType } from "@/lib/listing-utils"
import { getFirestoreClient } from "@/lib/firebase/firestore-client"
import { collection, query as firestoreQuery, where, getDocs } from "firebase/firestore"

// Dynamic configuration
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const CITY_PIN_CODE = process.env.NEXT_PUBLIC_CITY_PIN_CODE || "493773";

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
    const [activeTab, setActiveTab] = React.useState("images")
    const [lightboxImage, setLightboxImage] = React.useState<string | null>(null)

    // Rate limiting state
    const requestCountRef = React.useRef(0)
    const MAX_REQUESTS = 20 // 20 search requests per session

    const debouncedQuery = useDebounce(query, 800) // 800ms delay for optimal UX

    // Fetch autocomplete suggestions
    React.useEffect(() => {
        let cancelled = false

        const fetchSuggestions = async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 2) {
                setSuggestions([])
                return
            }

            // Check rate limit
            if (requestCountRef.current >= MAX_REQUESTS) {
                const { toastRateLimit } = await import('@/lib/toastUtils')
                toastRateLimit('search')
                setSuggestions([])
                return
            }

            // Increment request count
            requestCountRef.current++

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
                        // Filter out non-business types (streets, localities, etc.)
                        const excludedTypes = [
                            'route', 'street_address', 'locality', 'sublocality',
                            'neighborhood', 'political', 'premise', 'intersection',
                            'street_number', 'administrative_area', 'postal_code',
                            'country', 'plus_code'
                        ];

                        const filteredPredictions = (data.predictions || []).filter((pred: BusinessSuggestion) => {
                            // If no types, include it (might be a business)
                            if (!pred.types || pred.types.length === 0) return true;

                            // Exclude if ANY type matches excluded types
                            const hasExcludedType = pred.types.some((type: string) =>
                                excludedTypes.includes(type.toLowerCase())
                            );

                            return !hasExcludedType;
                        });

                        console.log(`[BusinessSearch] Filtered ${data.predictions.length - filteredPredictions.length} non-business results`);
                        setSuggestions(filteredPredictions);
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
                    return // Stop here, don't proceed with confirmation
                }

                throw new Error(data.error || 'Failed to fetch place details')
            }

            // Success - set place details
            if (!data.success || !data.placeDetails) {
                throw new Error(data.error || 'Invalid response from API')
            }

            setPlaceDetails(data.placeDetails)

        } catch (error) {
            console.error('❌ Error fetching place details:', error)
            setValidationError(
                error instanceof Error
                    ? error.message
                    : 'Network error - please check your connection and try again'
            )
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleConfirm = async () => {
        if (!selectedBusiness || !placeDetails) return

        // Check if business is already listed (duplicate detection)
        try {
            const db = getFirestoreClient()
            if (db) {
                const listingsRef = collection(db, 'listings')

                // Query by googlePlaceId (most reliable)
                const placeIdQuery = firestoreQuery(
                    listingsRef,
                    where('googlePlaceId', '==', selectedBusiness.placeId)
                )
                const placeIdSnapshot = await getDocs(placeIdQuery)

                if (!placeIdSnapshot.empty) {
                    // Business already exists
                    const existingListing = placeIdSnapshot.docs[0].data() as any
                    setValidationError(
                        `This business is already listed on our platform${existingListing.name ? ` as "${existingListing.name}"` : ''}. Please contact support if you are the owner.`
                    )
                    return
                }

                // Additional check by business name and address (fallback)
                const nameQuery = firestoreQuery(
                    listingsRef,
                    where('name', '==', placeDetails.name),
                    where('address', '==', placeDetails.formattedAddress || placeDetails.address)
                )
                const nameSnapshot = await getDocs(nameQuery)

                if (!nameSnapshot.empty) {
                    setValidationError(
                        `A business with this name and address is already listed. Please verify or contact support.`
                    )
                    return
                }
            }
        } catch (error) {
            console.error('[Duplicate Check] Error checking for existing listing:', error)
            // Continue with listing even if check fails (don't block users)
        }

        // Proceed with confirmation
        setQuery("")
        setSuggestions([])
        onSelect(selectedBusiness)
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
                            <div className="relative flex-1 max-w-full sm:max-w-none">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500" />
                                <CommandInput
                                    className="h-10 sm:h-11 pl-9 sm:pl-10 text-sm sm:text-sm outline-none focus:outline-none focus:ring-0 ring-0 border-0 shadow-none w-full"
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
                            <CommandEmpty>
                                <div className="flex flex-col items-center justify-center gap-2 py-2">
                                    <MapPinXInside className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                                    <p className="text-xs sm:text-sm text-gray-600">No businesses found in {CITY_NAME}</p>
                                </div>
                            </CommandEmpty>
                        )}

                        {!loading && suggestions.length > 0 && (
                            <CommandGroup heading={`Businesses in ${CITY_NAME}`}>
                                {suggestions.map((business) => (
                                    <CommandItem
                                        key={business.placeId}
                                        value={business.name}
                                        onSelect={() => handleBusinessSelect(business)}
                                        className="cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-start gap-2 sm:gap-3 w-full py-1.5 sm:py-2">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shrink-0">
                                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm sm:text-base text-gray-900 truncate mb-0.5 sm:mb-1">
                                                    {business.name}
                                                </div>
                                                <div className="flex items-start gap-1 sm:gap-1.5">
                                                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                    <span className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                                        {business.address}
                                                    </span>
                                                </div>
                                                {business.types && business.types.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                                                        {business.types.slice(0, 2).map((type, idx) => (
                                                            <span key={idx} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
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
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                            <span className="truncate">Confirm Your Business</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Review business details and confirm this is your business location
                        </DialogDescription>

                        {/* Business Summary - Info Only (Photos shown in Images tab) */}
                        {placeDetails && !loadingDetails && (
                            <div className="pt-3 sm:pt-4">
                                <div className="space-y-2 sm:space-y-3">
                                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                                        {placeDetails.name}
                                    </h3>
                                    {placeDetails.primaryType && (
                                        <p className="text-xs sm:text-sm text-gray-600 capitalize">
                                            {placeDetails.primaryType.replace(/_/g, ' ')}
                                        </p>
                                    )}
                                    {placeDetails.address && (
                                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                                            {placeDetails.address}
                                        </p>
                                    )}

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {/* Location Status Badge */}
                                        {!validationError ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                                                <span className="text-green-600">✓</span>
                                                {CITY_NAME} Location
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800">
                                                <span className="text-red-600">✕</span>
                                                Location Restricted
                                            </span>
                                        )}

                                        {/* Commercial Status Badge */}
                                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                                            <span className="text-green-600">✓</span>
                                            Commercial Business
                                        </span>

                                        {/* PIN Code Badge if available */}
                                        {placeDetails.addressComponents?.find((c: any) =>
                                            c.types?.includes('postal_code')
                                        )?.longName && (
                                                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700">
                                                    📍 PIN: {placeDetails.addressComponents.find((c: any) =>
                                                        c.types?.includes('postal_code')
                                                    )?.longName}
                                                </span>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    {/* Validation Error Banner */}
                    {validationError && (
                        <div className="mx-4 sm:mx-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <MapPinOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-red-700">{validationError}</div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loadingDetails && (
                        <div className="px-4 sm:px-6 space-y-4">
                            {/* Header Skeleton */}
                            <div className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-4">
                                <div className="flex gap-2 overflow-hidden">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0" />
                                    ))}
                                </div>
                                <div className="flex-1 space-y-2 sm:space-y-3">
                                    <Skeleton className="h-5 sm:h-6 w-3/4" />
                                    <Skeleton className="h-3 sm:h-4 w-1/2" />
                                    <Skeleton className="h-3 sm:h-4 w-full" />
                                    <div className="flex gap-1.5 sm:gap-2">
                                        <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded-full" />
                                        <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Skeleton */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex gap-2 border-b">
                                    <Skeleton className="h-9 sm:h-10 w-20 sm:w-24" />
                                    <Skeleton className="h-9 sm:h-10 w-20 sm:w-24" />
                                    <Skeleton className="h-9 sm:h-10 w-20 sm:w-24" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pb-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="aspect-square rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    {placeDetails && !loadingDetails && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-3 mx-4 sm:mx-6">
                                <TabsTrigger value="images" className="text-xs sm:text-sm">
                                    <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Images</span>
                                    <span className="sm:hidden">Photos</span>
                                </TabsTrigger>
                                <TabsTrigger value="address" className="text-xs sm:text-sm">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Address</span>
                                    <span className="sm:hidden">Location</span>
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="text-xs sm:text-sm">
                                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Contact
                                </TabsTrigger>
                            </TabsList>

                            {/* Images Tab */}
                            <TabsContent value="images" className="flex-1 overflow-y-auto mt-0">
                                <div className="p-3 sm:p-4 md:p-6">
                                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                                        Business Photos ({placeDetails.photos?.length || 0})
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                                        {placeDetails.photos && placeDetails.photos.length > 0 ? (
                                            placeDetails.photos.slice(0, 9).map((photo, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                                                >
                                                    <button
                                                        onClick={() => setLightboxImage(photo.name)}
                                                        className="w-full h-full"
                                                    >
                                                        <Image
                                                            src={`/api/google-places/photo?name=${encodeURIComponent(photo.name)}&maxWidth=400&maxHeight=400`}
                                                            alt={`${placeDetails.name} - Image ${idx + 1}`}
                                                            fill
                                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 33vw"
                                                            className="object-cover transition group-hover:opacity-90"
                                                            unoptimized
                                                        />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center text-gray-500 py-6 sm:py-8">
                                                <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                                                <p className="text-xs sm:text-sm">No images available for this business</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Address Tab */}
                            <TabsContent value="address" className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 mt-0">
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Full Address</div>
                                        <div className="text-sm sm:text-base text-gray-900">
                                            {placeDetails.address || placeDetails.formattedAddress}
                                        </div>
                                    </div>

                                    {placeDetails.addressComponents && placeDetails.addressComponents.length > 0 && (
                                        <div>
                                            <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Address Components</div>
                                            <div className="space-y-1">
                                                {placeDetails.addressComponents
                                                    .filter((comp) => comp.types && comp.types.length > 0 && comp.longName)
                                                    .map((comp, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs sm:text-sm gap-2">
                                                            <span className="text-gray-600 capitalize">{comp.types[0].replace(/_/g, ' ')}:</span>
                                                            <span className="font-medium text-right">{comp.longName}</span>
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
                                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-xs sm:text-sm"
                                        >
                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Open in Google Maps
                                        </a>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Contact Tab */}
                            <TabsContent value="contact" className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 mt-0">
                                <div className="space-y-3 sm:space-y-4">
                                    {placeDetails.phone && (
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm text-gray-500">Phone</div>
                                                <a href={`tel:${placeDetails.phone}`} className="font-medium text-blue-600 text-sm sm:text-base break-all">
                                                    {placeDetails.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {placeDetails.website && (
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm text-gray-500">Website</div>
                                                <a
                                                    href={placeDetails.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:underline break-all text-xs sm:text-sm"
                                                >
                                                    {placeDetails.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {(placeDetails.openingHours || placeDetails.regularOpeningHours) && (
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm text-gray-500 mb-2">Opening Hours</div>
                                                {placeDetails.regularOpeningHours?.openNow !== undefined && (
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium mb-2 ${placeDetails.regularOpeningHours.openNow
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {placeDetails.regularOpeningHours.openNow ? 'Open Now' : 'Closed'}
                                                    </div>
                                                )}
                                                {/* Handle both formats: array of strings or nested object */}
                                                {Array.isArray(placeDetails.openingHours) ? (
                                                    <div className="space-y-1 text-xs sm:text-sm">
                                                        {placeDetails.openingHours.map((day: string, idx: number) => (
                                                            <div key={idx}>{day}</div>
                                                        ))}
                                                    </div>
                                                ) : placeDetails.regularOpeningHours?.weekdayDescriptions ? (
                                                    <div className="space-y-1 text-xs sm:text-sm">
                                                        {placeDetails.regularOpeningHours.weekdayDescriptions.map((day: string, idx: number) => (
                                                            <div key={idx}>{day}</div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}                                    {placeDetails.rating && (
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="text-xl sm:text-2xl">⭐</div>
                                            <div>
                                                <div className="text-xs sm:text-sm text-gray-500">Rating</div>
                                                <div className="font-semibold text-sm sm:text-base">
                                                    {placeDetails.rating} / 5
                                                    {placeDetails.userRatingCount && (
                                                        <span className="text-xs sm:text-sm text-gray-500 ml-1">
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
                    <div className="border-t px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                            >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!!validationError || loadingDetails}
                                className="px-5 sm:px-6 py-2.5 sm:py-2.5 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {loadingDetails ? (
                                    <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                        <span className="hidden sm:inline">Loading...</span>
                                        <span className="sm:hidden">Wait...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Confirm & Continue</span>
                                        <span className="sm:hidden">Confirm</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox for image preview and download */}
            {lightboxImage && (
                <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                    <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 bg-transparent shadow-none">
                        <div className="relative bg-black/90 p-4 rounded-md flex flex-col items-center justify-center">
                            <button
                                onClick={() => setLightboxImage(null)}
                                className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-1"
                                aria-label="Close preview"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                            <div className="w-full max-h-[80vh] overflow-auto">
                                <img src={lightboxImage} alt="Preview" className="mx-auto max-h-[80vh] w-auto" />
                            </div>
                            <div className="mt-3">
                                <button
                                    onClick={() => {
                                        // Trigger direct download
                                        const a = document.createElement('a')
                                        a.href = lightboxImage
                                        a.download = lightboxImage.split('/').pop() || 'image.jpg'
                                        document.body.appendChild(a)
                                        a.click()
                                        a.remove()
                                    }}
                                    className="bg-white text-gray-900 px-3 py-1 rounded-md"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

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
