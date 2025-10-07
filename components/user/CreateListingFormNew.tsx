"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CATEGORIES } from "@/config/directory"
import { PLANS } from "@/lib/plans"
import {
    Loader2,
    Search,
    Check,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Building2,
    FileText,
    Image as ImageIcon,
    CreditCard,
    AlertTriangle,
    Save,
    RefreshCw,
    X,
    ChevronDown,
    ChevronUp,
    Phone as PhoneIcon,
} from "lucide-react"
import { ErrorCard } from "@/components/common/ErrorCard"
import { BusinessConfirmationCard } from "@/components/common/BusinessConfirmationCard"
import { useRouter } from "next/navigation"
import Script from "next/script"
import {
    fetchPlaceDetails,
    getPlacePhotoUrl,
    extractCategoryFromTypes,
    type PlaceDetails,
} from "@/lib/google-places"
import {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    getDraftAge,
    autoSaveDraft,
    type ListingDraft,
} from "@/lib/draft-storage"

// Step definitions
const STEPS = [
    { id: 1, name: "Business Info", icon: Building2, description: "Search and select your business" },
    { id: 2, name: "Details", icon: FileText, description: "Add business details" },
    { id: 3, name: "Media", icon: ImageIcon, description: "Business photos" },
    { id: 4, name: "Payment", icon: CreditCard, description: "Choose plan and pay" },
]

export function CreateListingFormNew() {
    const router = useRouter()

    // State management
    const [currentStep, setCurrentStep] = React.useState(1)
    const [formData, setFormData] = React.useState<Partial<ListingDraft>>({})
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)

    // Google Places state
    const [googleMapsUrl, setGoogleMapsUrl] = React.useState("")
    const [selectedPlace, setSelectedPlace] = React.useState<PlaceDetails | null>(null)
    const [isFetchingDetails, setIsFetchingDetails] = React.useState(false)
    const [locationError, setLocationError] = React.useState<string | null>(null)

    // Payment state
    const [selectedPlan, setSelectedPlan] = React.useState<'free' | 'sponsored' | 'featured'>('free')
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState(0)

    // Draft state
    const [showDraftBanner, setShowDraftBanner] = React.useState(false)
    const [draftAge, setDraftAge] = React.useState<string | null>(null)

    // UI state
    const [showHelperSection, setShowHelperSection] = React.useState(false)
    const [errorDetails, setErrorDetails] = React.useState<any>(null)

    // Refs for inputs
    const urlInputRef = React.useRef<HTMLInputElement>(null)
    const phoneInputRef = React.useRef<HTMLInputElement>(null)
    const websiteInputRef = React.useRef<HTMLInputElement>(null)

    // Debounce timer for URL fetch
    const fetchDebounceRef = React.useRef<NodeJS.Timeout | null>(null)

    // Load draft on mount
    React.useEffect(() => {
        if (hasDraft()) {
            const draft = loadDraft()
            const age = getDraftAge()
            if (draft) {
                setShowDraftBanner(true)
                setDraftAge(age)
            }
        }
    }, [])

    // Auto-save draft on form changes with debounce
    const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    React.useEffect(() => {
        if (Object.keys(formData).length > 0) {
            // Clear previous timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }

            // Set new timeout for auto-save
            autoSaveTimeoutRef.current = setTimeout(() => {
                saveDraft(formData)
                console.log('Draft saved')
            }, 3000)
        }

        // Cleanup
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [formData])

    // Load draft handler
    const handleLoadDraft = () => {
        const draft = loadDraft()
        if (draft) {
            setFormData(draft)
            setShowDraftBanner(false)
            setSuccess("Draft loaded successfully!")
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Discard draft handler
    const handleDiscardDraft = () => {
        clearDraft()
        setShowDraftBanner(false)
    }

    // Extract Place ID from Google Maps URL
    const extractPlaceIdFromUrl = (url: string): string | null => {
        try {
            // Match patterns like:
            // https://maps.app.goo.gl/... (short URL)
            // https://www.google.com/maps/place/...
            // https://goo.gl/maps/...

            // Common patterns for place ID in URLs
            const patterns = [
                /place\/[^/]+\/.*?!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i, // ChIJ format encoded
                /!1s(ChIJ[a-zA-Z0-9_-]+)/i, // Direct ChIJ
                /cid=(\d+)/i, // CID format
                /ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i, // Feature ID
            ]

            for (const pattern of patterns) {
                const match = url.match(pattern)
                if (match) {
                    let placeId = match[1]
                    // Ensure it's in the correct format for the API
                    // The API expects "places/ChIJxxxx" format
                    if (placeId.startsWith('ChIJ') || placeId.startsWith('0x')) {
                        return `places/${placeId}`
                    }
                    // For CID format, we need to convert it
                    if (/^\d+$/.test(placeId)) {
                        // CID format - return as is, the API might handle it
                        return placeId
                    }
                    return placeId
                }
            }

            return null
        } catch (error) {
            console.error('Error extracting place ID:', error)
            return null
        }
    }

    // Fetch details from Google Maps URL
    const handleFetchFromUrl = async () => {
        if (!googleMapsUrl.trim()) {
            setError("Please enter a Google Maps URL")
            setErrorDetails(null)
            return
        }

        setIsFetchingDetails(true)
        setLocationError(null)
        setError(null)
        setErrorDetails(null)
        setSelectedPlace(null)

        try {
            // First, check if it's a short URL and resolve it
            let placeId = extractPlaceIdFromUrl(googleMapsUrl)

            // If extraction failed or it's a short URL, try to resolve it
            if (!placeId || googleMapsUrl.includes('goo.gl') || googleMapsUrl.includes('share.google')) {
                console.log('Short URL detected, resolving...')

                const resolveResponse = await fetch('/api/google-places/resolve-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: googleMapsUrl }),
                })

                if (resolveResponse.ok) {
                    const resolveData = await resolveResponse.json()
                    if (resolveData.success && resolveData.placeId) {
                        placeId = resolveData.placeId
                        console.log('Resolved Place ID:', placeId)
                    }
                } else {
                    const errorData = await resolveResponse.json()
                    setError("Could not resolve URL")
                    setErrorDetails({
                        title: "Invalid URL",
                        details: "Unable to extract business information from this URL.",
                        debugInfo: errorData
                    })
                    setIsFetchingDetails(false)
                    return
                }
            }

            if (!placeId) {
                setError("Could not extract Place ID from URL")
                setErrorDetails({
                    title: "Invalid Google Maps URL",
                    details: "Please use: (1) Open Google Maps, (2) Search your business, (3) Click your listing, (4) Use Share → Copy link.",
                    showHelper: true
                })
                setIsFetchingDetails(false)
                return
            }

            console.log('Fetching details for Place ID:', placeId)
            const result = await fetchPlaceDetails(placeId)

            if (!result.success) {
                if (result.locationRestricted) {
                    setLocationError(result.error || "Location restricted to Dhamtari district only")
                    setErrorDetails({
                        title: result.errorTitle || "Location Not Allowed",
                        details: result.errorDetails || result.error,
                        debugInfo: result.debugInfo
                    })
                    setGoogleMapsUrl("")
                } else {
                    setError(result.error || "Failed to fetch place details")
                    setErrorDetails({
                        title: "API Error",
                        details: "Could not fetch business details from Google Maps. You can enter your business details manually below.",
                        debugInfo: result
                    })
                }
                setIsFetchingDetails(false)
                return
            }

            if (result.placeDetails) {
                setSelectedPlace(result.placeDetails)

                // Auto-fill form
                setFormData(prev => ({
                    ...prev,
                    businessName: result.placeDetails!.name,
                    placeId: result.placeDetails!.placeId,
                    googlePlaceData: result.placeDetails,
                    phone: result.placeDetails!.phone,
                    website: result.placeDetails!.website,
                    address: result.placeDetails!.address,
                    category: extractCategoryFromTypes(result.placeDetails!.types),
                    location: result.placeDetails!.location,
                }))

                setSuccess("Business details loaded successfully from Google Maps!")
                setTimeout(() => setSuccess(null), 3000)
            }
        } catch (error) {
            console.error('Error fetching from URL:', error)
            setError("Network error or server unavailable")
            setErrorDetails({
                title: "Connection Error",
                details: "Failed to connect to the server. Please check your internet connection and try again.",
                debugInfo: { error: error instanceof Error ? error.message : String(error) }
            })
        } finally {
            setIsFetchingDetails(false)
        }
    }

    // Debounced fetch handler
    const handleUrlChange = (value: string) => {
        setGoogleMapsUrl(value)

        // Clear any existing timeout
        if (fetchDebounceRef.current) {
            clearTimeout(fetchDebounceRef.current)
        }

        // Don't auto-fetch, let user click the button
        // This prevents excessive API calls while typing
    }

    // Navigate steps
    const goToNextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Validate step
    const validateStep = (step: number): boolean => {
        setError(null)

        switch (step) {
            case 1: // Business Info
                if (!formData.businessName) {
                    setError("Business name is required")
                    return false
                }
                if (!selectedPlace && !formData.address) {
                    setError("Please select a business from Google Places or enter address manually")
                    return false
                }
                return true

            case 2: // Details
                if (!formData.category) {
                    setError("Category is required")
                    return false
                }
                if (!formData.description) {
                    setError("Description is required")
                    return false
                }
                if (!formData.email) {
                    setError("Email is required")
                    return false
                }
                // Validate email format
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                if (!emailRegex.test(formData.email)) {
                    setError("Please enter a valid email address")
                    return false
                }
                return true

            case 3: // Media
                if (!selectedPlace || !selectedPlace.photos.length) {
                    setError("No photos available from Google Business Profile")
                    return false
                }
                return true

            default:
                return true
        }
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            goToNextStep()
        }
    }

    // Payment handler
    const handlePayment = async () => {
        if (!validateStep(3)) return

        setIsProcessingPayment(true)
        setError(null)

        try {
            const plan = PLANS[selectedPlan]
            const amount = plan.priceRupees

            // For free plan, skip payment and create listing directly
            if (selectedPlan === 'free') {
                await createListing(null, null)
                return
            }

            // Create Razorpay order for paid plans
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    planType: selectedPlan,
                    listingTitle: formData.businessName,
                }),
            })

            const orderData = await orderResponse.json()

            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to create order')
            }

            // Initialize Razorpay payment
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'Dhamtari Directory',
                description: `${plan.label} Plan - ${formData.businessName}`,
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: orderData.order.id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        })

                        const verifyData = await verifyResponse.json()

                        if (!verifyData.success) {
                            throw new Error('Payment verification failed')
                        }

                        // Payment successful - create listing
                        await createListing(orderData.order.id, response.razorpay_payment_id)

                    } catch (error) {
                        console.error('Payment handler error:', error)
                        setError('Payment verification failed. Please contact support.')
                        setIsProcessingPayment(false)
                    }
                },
                prefill: {
                    name: formData.businessName || '',
                    contact: formData.phone || '',
                    email: formData.email || '',
                },
                theme: {
                    color: '#ef4444', // red-500
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false)
                        setError('Payment cancelled')
                    }
                }
            }

            const razorpay = new (window as any).Razorpay(options)
            razorpay.on('payment.failed', function (response: any) {
                setError('Payment failed: ' + response.error.description)
                setIsProcessingPayment(false)
            })
            razorpay.open()

        } catch (error) {
            console.error('Payment error:', error)
            setError(error instanceof Error ? error.message : 'Payment failed')
            setIsProcessingPayment(false)
        }
    }

    // Create listing after successful payment
    const createListing = async (orderId: string | null, paymentId: string | null) => {
        setUploadProgress(10)

        try {
            // Photos come from Google Places API only
            setUploadProgress(10)

            // Get photos from selectedPlace (Google Places API)
            const googlePhotoUrls = selectedPlace?.photos.slice(0, 10) || []

            setUploadProgress(60)

            // Create listing in Firestore
            const listingData = {
                ...formData,
                photos: googlePhotoUrls,
                plan: selectedPlan,
                ...(orderId && { orderId }),
                ...(paymentId && { paymentId }),
                status: 'active',
            }

            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(listingData),
            })

            setUploadProgress(80)

            const responseData = await response.json()

            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 404 || responseData.error?.includes('NOT_FOUND')) {
                    throw new Error('Database collection not found. Please contact support.')
                }
                if (responseData.error === 'already_has_listing') {
                    throw new Error('You already have a listing. Please edit your existing listing.')
                }
                throw new Error(responseData.error || 'Failed to create listing')
            }

            setUploadProgress(90)

            // Store payment details if paid plan
            if (paymentId && orderId) {
                try {
                    await fetch('/api/listings/payments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            listingId: responseData.id,
                            orderId,
                            paymentId,
                            plan: selectedPlan,
                            amount: PLANS[selectedPlan].priceRupees,
                        }),
                    })
                } catch (err) {
                    console.error('Payment record error:', err)
                    // Don't fail the whole process if payment record fails
                }
            }

            setUploadProgress(100)

            // Clear draft and hide draft banner
            clearDraft()
            setShowDraftBanner(false)

            // Show success message
            setSuccess('Listing created successfully! Redirecting...')

            // Redirect to my listing page
            setTimeout(() => {
                router.push('/user/my-listing' as any)
            }, 2000)

        } catch (error) {
            console.error('Create listing error:', error)
            setError(error instanceof Error ? error.message : 'Failed to create listing')
            setIsProcessingPayment(false)
            setUploadProgress(0)
        }
    }

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1BusinessInfo />
            case 2:
                return <Step2Details />
            case 3:
                return <Step3Media />
            case 4:
                return <Step4Payment />
            default:
                return null
        }
    }

    // Step 1: Business Info
    const Step1BusinessInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle>Search Your Business</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                    Search for your business on Google Places (Dhamtari district only)
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Location Error Banner */}
                {locationError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-red-900">Location Restricted</p>
                                <p className="text-red-700 mt-1">{locationError}</p>
                                <p className="text-red-600 mt-2 text-xs">
                                    Only businesses located in Dhamtari district are allowed to create listings.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Google Maps URL Input */}
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="googleMapsUrl">Google Business Profile URL</Label>
                        <p className="text-xs text-gray-500 mt-1">
                            Paste your Google Business Profile link
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Input
                                ref={urlInputRef}
                                id="googleMapsUrl"
                                type="url"
                                placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps/place/..."
                                value={googleMapsUrl}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                disabled={isFetchingDetails}
                                className={googleMapsUrl ? "pr-10" : ""}
                                maxLength={500}
                            />
                            {googleMapsUrl && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGoogleMapsUrl('')
                                        urlInputRef.current?.focus()
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                                    aria-label="Clear URL"
                                >
                                    <X className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                            )}
                        </div>
                        <Button
                            type="button"
                            onClick={handleFetchFromUrl}
                            disabled={isFetchingDetails || !googleMapsUrl.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 shrink-0 min-h-[44px]"
                        >
                            {isFetchingDetails ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Fetch Details
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Collapsible Helper Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setShowHelperSection(!showHelperSection)}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-xs font-medium text-gray-700">
                                📍 How to get your Google Business URL
                            </span>
                            {showHelperSection ? (
                                <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                            )}
                        </button>
                        {showHelperSection && (
                            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                                <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                                    <li>Open <strong>Google Maps</strong> (maps.google.com)</li>
                                    <li>Search for your business name</li>
                                    <li>Click on your business from the results</li>
                                    <li>Click the <strong>"Share"</strong> button</li>
                                    <li>Select <strong>"Share a link"</strong></li>
                                    <li>Copy the link and paste it above</li>
                                </ol>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 <strong>Tip:</strong> Business must be verified on Google Business Profile
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="my-4" />

                {/* Manual Entry Fallback */}
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Or enter manually:</p>
                    <div>
                        <Label htmlFor="businessName">
                            Business Name <span className="text-red-600">*</span>
                            <span className="text-xs text-gray-500 ml-2">
                                ({(formData.businessName || '').length}/100)
                            </span>
                        </Label>
                        <Input
                            id="businessName"
                            type="text"
                            placeholder="Your Business Name"
                            value={formData.businessName || ''}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 100)
                                setFormData(prev => ({ ...prev, businessName: value }))
                            }}
                            maxLength={100}
                            minLength={2}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="address">
                            Address <span className="text-red-600">*</span>
                            <span className="text-xs text-gray-500 ml-2">
                                ({(formData.address || '').length}/300)
                            </span>
                        </Label>
                        <Textarea
                            id="address"
                            placeholder="Full business address..."
                            rows={3}
                            value={formData.address || ''}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 300)
                                setFormData(prev => ({ ...prev, address: value }))
                            }}
                            maxLength={300}
                            minLength={10}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">
                                Phone Number
                                <span className="text-xs text-gray-500 ml-2">
                                    ({(formData.phone || '').length}/15)
                                </span>
                            </Label>
                            <div className="relative">
                                <Input
                                    ref={phoneInputRef}
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={formData.phone || ''}
                                    onChange={(e) => {
                                        // Allow only numbers, +, -, spaces, and parentheses
                                        const value = e.target.value.replace(/[^0-9+\-() ]/g, '').slice(0, 15)
                                        setFormData(prev => ({ ...prev, phone: value }))
                                    }}
                                    maxLength={15}
                                    className={formData.phone ? 'pr-10' : ''}
                                />
                                {formData.phone && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, phone: '' }))
                                            phoneInputRef.current?.focus()
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                                        aria-label="Clear phone"
                                    >
                                        <X className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="website">
                                Website
                                <span className="text-xs text-gray-500 ml-2">
                                    ({(formData.website || '').length}/200)
                                </span>
                            </Label>
                            <div className="relative">
                                <Input
                                    ref={websiteInputRef}
                                    id="website"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.website || ''}
                                    onChange={(e) => {
                                        const value = e.target.value.slice(0, 200)
                                        setFormData(prev => ({ ...prev, website: value }))
                                    }}
                                    maxLength={200}
                                    className={formData.website ? 'pr-10' : ''}
                                />
                                {formData.website && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, website: '' }))
                                            websiteInputRef.current?.focus()
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                                        aria-label="Clear website"
                                    >
                                        <X className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    // Step 2: Details
    const Step2Details = () => (
        <Card>
            <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                    Add category, description, and other details
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="category">
                        Category <span className="text-red-600">*</span>
                    </Label>
                    <Select
                        value={formData.category || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                        <SelectTrigger id="category" className="bg-white">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.slug} value={cat.label}>
                                    {cat.icon} {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="description">
                        Description <span className="text-red-600">*</span>
                        <span className="text-xs text-gray-500 ml-2">
                            ({(formData.description || '').length}/1000)
                        </span>
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Tell us about your business, what you offer, what makes you special..."
                        rows={6}
                        value={formData.description || ''}
                        onChange={(e) => {
                            const value = e.target.value.slice(0, 1000)
                            setFormData(prev => ({ ...prev, description: value }))
                        }}
                        maxLength={1000}
                        minLength={50}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Minimum 50 characters required
                    </p>
                </div>

                <div>
                    <Label htmlFor="tags">
                        Tags (comma-separated)
                        <span className="text-xs text-gray-500 ml-2">
                            (Max 10 tags)
                        </span>
                    </Label>
                    <Input
                        id="tags"
                        type="text"
                        placeholder="e.g., restaurant, italian, pizza, delivery"
                        value={(formData.tags || []).join(', ')}
                        onChange={(e) => {
                            const tags = e.target.value
                                .split(',')
                                .map(t => t.trim().slice(0, 30))
                                .filter(Boolean)
                                .slice(0, 10)
                            setFormData(prev => ({ ...prev, tags }))
                        }}
                        maxLength={300}
                    />
                    {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 text-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newTags = formData.tags?.filter((_, i) => i !== index)
                                            setFormData(prev => ({ ...prev, tags: newTags }))
                                        }}
                                        className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                                        aria-label={`Remove ${tag}`}
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {(formData.tags || []).length} / 10 tags
                    </p>
                </div>

                <div>
                    <Label htmlFor="email">
                        Email <span className="text-red-600">*</span>
                        <span className="text-xs text-gray-500 ml-2">
                            ({(formData.email || '').length}/100)
                        </span>
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        value={formData.email || ''}
                        onChange={(e) => {
                            const value = e.target.value.slice(0, 100)
                            setFormData(prev => ({ ...prev, email: value }))
                        }}
                        maxLength={100}
                        required
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    />
                </div>
            </CardContent>
        </Card>
    )

    // Step 3: Media
    const Step3Media = () => {
        const maxPhotos = 10 // Fixed limit for Google Places photos

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Photos & Media</CardTitle>
                    <p className="text-sm text-gray-600">
                        Photos from your Google Business Profile (Max: {maxPhotos})
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {selectedPlace && selectedPlace.photos.length > 0 ? (
                        <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">
                                {selectedPlace.photos.slice(0, maxPhotos).length} photos from Google Maps
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {selectedPlace.photos.slice(0, maxPhotos).map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded overflow-hidden border border-gray-200">
                                        <img
                                            src={getPlacePhotoUrl(photo.name, 400, 400)}
                                            alt={`Business photo ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                ✓ These photos will be automatically included in your listing
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8 border border-gray-200 rounded bg-gray-50">
                            <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No photos available from Google Maps</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Make sure your business has photos on Google Business Profile
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Step 4: Payment
    const Step4Payment = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Choose Your Plan</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Select a plan that best suits your needs
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {(['free', 'sponsored', 'featured'] as const).map((planId) => {
                            const plan = PLANS[planId]
                            const isSelected = selectedPlan === planId

                            return (
                                <button
                                    key={planId}
                                    type="button"
                                    onClick={() => setSelectedPlan(planId)}
                                    className={`relative p-6 border-2 rounded-lg text-left transition-all ${isSelected
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {plan.popular && (
                                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500">
                                            Popular
                                        </Badge>
                                    )}
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
                                        <p className="text-3xl font-bold text-red-600 mt-2">{plan.display}</p>
                                        <p className="text-sm text-gray-600 mt-1">{plan.duration}</p>
                                    </div>
                                    <ul className="mt-4 space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Listing Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Listing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Business Name:</span>
                        <span className="font-medium">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{formData.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Photos:</span>
                        <span className="font-medium">
                            {selectedPlace?.photos.slice(0, 10).length || 0} photos
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-red-600">{PLANS[selectedPlan].display}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-800">Creating listing...</span>
                                <span className="text-gray-600">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Compact Draft Indicator */}
            {showDraftBanner && (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Save className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">
                            Draft saved {draftAge}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleLoadDraft}
                            className="h-7 px-2 text-xs hover:bg-gray-50"
                        >
                            Load
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDiscardDraft}
                            className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            Discard
                        </Button>
                    </div>
                </div>
            )}

            {/* Location Error */}
            {locationError && errorDetails && (
                <ErrorCard
                    title={errorDetails.title || "Location Not Allowed"}
                    message={locationError}
                    details={errorDetails.details}
                    onRetry={() => {
                        setLocationError(null)
                        setErrorDetails(null)
                        urlInputRef.current?.focus()
                    }}
                    onDismiss={() => {
                        setLocationError(null)
                        setErrorDetails(null)
                    }}
                />
            )}

            {/* General Error */}
            {error && !locationError && (
                <ErrorCard
                    title={errorDetails?.title || "Error"}
                    message={error}
                    details={errorDetails?.details}
                    onRetry={errorDetails?.showHelper ? () => setShowHelperSection(true) : undefined}
                    onDismiss={() => {
                        setError(null)
                        setErrorDetails(null)
                    }}
                />
            )}

            {/* Success - Business Fetched */}
            {selectedPlace && (
                <BusinessConfirmationCard
                    name={selectedPlace.name}
                    address={selectedPlace.address}
                    onDismiss={() => setSelectedPlace(null)}
                />
            )}

            {/* Success Message (Other) */}
            {success && !selectedPlace && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="py-4">
                        <div className="flex gap-3">
                            <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-green-900 dark:text-green-100">Success</p>
                                <p className="text-green-700 dark:text-green-300 mt-1">{success}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stepper */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep > step.id
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : currentStep === step.id
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <step.icon className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="hidden md:block">
                                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                        {step.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 1 || isLoading || isProcessingPayment}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                {currentStep < STEPS.length ? (
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading || isProcessingPayment}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isProcessingPayment ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {selectedPlan === 'free' ? 'Creating...' : 'Processing...'}
                            </>
                        ) : (
                            <>
                                {selectedPlan === 'free' ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Create Listing (Free)
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Pay {PLANS[selectedPlan].display}
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Razorpay Script */}
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />
        </div>
    )
}
