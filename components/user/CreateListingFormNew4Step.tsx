/**
 * Create Listing Form - 4-Step Flow with Media Upload
 * Step 1: Business Details (Google Places)
 * Step 2: Media Upload (1-20 images, max 3MB each)
 * Step 3: Plan Selection & Payment
 * Step 4: Review & Create
 * 
 * Uses Zustand for state management
 * Follows Database Modeling.md and Design System & Principles.md
 */

"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PLANS, type PlanId } from "@/lib/plans"

// Dynamic configuration
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const CITY_PIN_CODE = process.env.NEXT_PUBLIC_CITY_PIN_CODE || "493773";
import {
    Loader2,
    Check,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Image as ImageIcon,
    CreditCard,
    FileCheck,
    X,
    ShieldCheck,
    Calendar,
    Clock,
    CheckCircle2,
    Lock,
    Phone,
    Globe,
    Mail,
    Star,
    MessageSquare,
    FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { format, addDays } from "date-fns"
import { BusinessSearch } from "@/components/user/BusinessSearch"
import { ImageUploadEnhanced, type UploadedImageEnhanced } from "@/components/user/ImageUploadEnhanced"
import { useCreateListingStore } from "@/stores/createListingStore"

// Step definitions for 4-step flow
const STEPS = [
    { id: 1, name: "Business", icon: MapPin, description: "Select your business" },
    { id: 2, name: "Media", icon: ImageIcon, description: "Upload photos" },
    { id: 3, name: "Plan", icon: CreditCard, description: "Choose plan" },
    { id: 4, name: "Review", icon: FileCheck, description: "Create listing" },
]

export function CreateListingFormNew4Step() {
    const router = useRouter()

    // Zustand store
    const store = useCreateListingStore()

    // Local UI state (not persisted)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)
    const [showTermsDialog, setShowTermsDialog] = React.useState(false)
    const [isFetchingDetails, setIsFetchingDetails] = React.useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState(0)

    /**
     * Image Restoration Effect
     * When user logs out/in, File objects are lost from localStorage (can't serialize)
     * This restores images by recreating File objects from stored data URLs
     */
    React.useEffect(() => {
        async function restoreImages() {
            if (store.uploadedImages.length === 0) return

            // Check if any images are missing File objects
            const imagesNeedingRestoration = store.uploadedImages.filter(img => !img.file)

            if (imagesNeedingRestoration.length > 0) {
                console.log(`📸 Restoring ${imagesNeedingRestoration.length} images after logout/login...`)

                for (const img of imagesNeedingRestoration) {
                    try {
                        // Convert data URL back to File object
                        if (img.localUrl && img.localUrl.startsWith('data:')) {
                            const response = await fetch(img.localUrl)
                            const blob = await response.blob()

                            // Create a new File object from the blob
                            // Use original filename if available, otherwise generate one
                            const filename = `restored-${img.id}.${img.type?.split('/')[1] || 'jpg'}`
                            const restoredFile = new File([blob], filename, {
                                type: img.type || 'image/jpeg'
                            })

                            // Update the image in the store with restored File object
                            store.restoreImageFile(img.id, restoredFile)

                            console.log(`✅ Restored image: ${img.id} (${(blob.size / 1024).toFixed(2)}KB)`)
                        }
                    } catch (err) {
                        console.error(`❌ Failed to restore image ${img.id}:`, err)
                    }
                }

                console.log('✅ All images restored successfully')
            }
        }

        restoreImages()
    }, []) // Run once on mount

    /**
     * Handle business selection from search
     */
    async function handleBusinessSelect(business: any) {
        store.setSelectedBusiness(business)
        setIsFetchingDetails(true)
        setError(null)
        setSuccess(null)

        try {
            const placeId = business.placeId

            if (!placeId) {
                setError("Invalid Google Maps URL or Place ID. Please use a valid business profile URL or Place ID.")
                return
            }

            // Fetch place details from Google Places API
            const response = await fetch('/api/google-places/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ placeId }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                setError(result.error || "Could not fetch business details. Please check the URL and try again.")
                return
            }

            const details = result.placeDetails

            // Validate location - STRICT: must contain city PIN or city name
            const addressLower = (details.address || "").toLowerCase()
            const formattedAddress = (details.formattedAddress || "").toLowerCase()
            const postalCode = details.addressComponents?.find((c: any) =>
                c.types.includes('postal_code')
            )?.longName || ""

            const hasValidPostalCode = postalCode.includes(CITY_PIN_CODE)
            const hasValidCity = addressLower.includes(CITY_NAME.toLowerCase()) || formattedAddress.includes(CITY_NAME.toLowerCase())

            if (!hasValidPostalCode && !hasValidCity) {
                setError(`⚠️ Location Restricted: This directory only accepts businesses in ${CITY_NAME} district (postal code ${CITY_PIN_CODE}). Your business location could not be verified.`)
                store.setSelectedPlace(null)
                return
            }

            // Additional check for API restriction flag
            if (result.locationRestricted) {
                setError(`Only businesses located in ${CITY_NAME} district (${STATE_NAME}, India) with postcode ${CITY_PIN_CODE} are allowed on this platform.`)
                store.setSelectedPlace(null)
                return
            }

            if (!details.name || !details.address) {
                setError("Incomplete business information. Please ensure your Google Business Profile is complete.")
                return
            }

            store.setSelectedPlace(details)
            setSuccess("Business details fetched successfully!")
            setTimeout(() => setSuccess(null), 3000)

        } catch (err: any) {
            setError(err.message || "Failed to fetch business details. Please try again.")
        } finally {
            setIsFetchingDetails(false)
        }
    }

    /**
     * Handle next step navigation
     */
    function handleNextStep() {
        setError(null)

        if (store.currentStep === 1) {
            // Validate business details
            if (!store.selectedPlace) {
                setError("Please fetch your business details from Google Maps")
                return
            }
            // Show terms dialog
            setShowTermsDialog(true)
        } else if (store.currentStep === 2) {
            // Validate media upload
            if (store.uploadedImages.length === 0) {
                setError("Please upload at least 1 image for your listing")
                return
            }
            store.nextStep()
        } else if (store.currentStep === 3) {
            // Validate payment for paid plans
            if (store.selectedPlan !== 'free' && !store.paymentCompleted) {
                setError("Please complete payment to continue")
                return
            }
            store.nextStep()
        }
    }

    /**
     * Handle accept terms
     */
    function handleAcceptTerms() {
        store.setTermsAccepted(true)
        setShowTermsDialog(false)
        store.nextStep()
    }

    /**
     * Handle previous step
     */
    function handlePreviousStep() {
        if (store.currentStep > 1) {
            store.previousStep()
            setError(null)
        }
    }

    /**
     * Handle image changes from ImageUploadEnhanced component
     */
    function handleImagesChange(images: UploadedImageEnhanced[]) {
        // Clear existing images
        store.clearImages()
        // Add all new images
        images.forEach(img => store.addImage(img))
    }

    /**
     * Handle primary image selection
     */
    function handlePrimaryImageChange(imageId: string) {
        store.setPrimaryImageId(imageId)
    }

    /**
     * Initiate Razorpay payment
     */
    async function initiatePayment() {
        if (store.selectedPlan === 'free') {
            store.setPaymentCompleted(true)
            return
        }

        setIsProcessingPayment(true)
        setError(null)

        try {
            const plan = PLANS[store.selectedPlan]

            // Create Razorpay order
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: plan.pricePaise,
                    plan: store.selectedPlan,
                }),
            })

            const orderData = await orderResponse.json()

            if (!orderResponse.ok || !orderData.ok) {
                throw new Error(orderData.error || 'Failed to create order')
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: plan.pricePaise,
                currency: "INR",
                name: APP_NAME,
                description: `${plan.label} Plan - ${plan.duration}`,
                order_id: orderData.orderId,
                handler: function (response: any) {
                    store.setPaymentCompleted(
                        true,
                        response.razorpay_payment_id,
                        response.razorpay_order_id
                    )
                    setSuccess("Payment completed successfully! Your plan is now locked.")
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false)
                    },
                },
                theme: {
                    color: "#EF4444",
                },
            }

            const razorpay = new (window as any).Razorpay(options)
            razorpay.open()

        } catch (err: any) {
            setError(err.message || "Payment failed. Please try again.")
        } finally {
            setIsProcessingPayment(false)
        }
    }

    /**
     * Create listing with image upload
     */
    async function createListing() {
        if (!store.selectedPlace) {
            setError("Business details are missing")
            return
        }

        if (store.uploadedImages.length === 0) {
            setError("At least 1 image is required")
            return
        }

        setIsLoading(true)
        setUploadProgress(5)
        setError(null)

        try {
            setSuccess("📝 Creating listing...")
            setUploadProgress(10)

            // Step 1: Create listing document (without images for now)
            const category = store.selectedPlace.primaryType || store.selectedPlace.types?.[0] || 'business'

            console.log('📊 Place data:', {
                primaryType: store.selectedPlace.primaryType,
                types: store.selectedPlace.types,
                selectedCategory: category
            })

            const listingData = {
                businessName: store.selectedPlace.name,
                placeId: store.selectedPlace.placeId,
                businessSearchName: store.selectedBusiness?.name || store.selectedPlace.name,
                address: store.selectedPlace.address,
                phone: store.selectedPlace.phone || '',
                website: store.selectedPlace.website || '',
                category: category,
                location: store.selectedPlace.location || null, // Store geo coordinates
                reviews: store.selectedPlace.reviews || [], // Store reviews from Places API
                rating: store.selectedPlace.rating || 0,
                userRatingCount: store.selectedPlace.userRatingCount || 0,
                photos: [], // Will be updated after upload
                plan: store.selectedPlan,
                ...(store.orderId && { orderId: store.orderId }),
                ...(store.paymentId && { paymentId: store.paymentId }),
                status: 'active',
            }

            const listingResponse = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(listingData),
            })

            setUploadProgress(20)

            const listingResult = await listingResponse.json()

            if (!listingResponse.ok) {
                const errorMsg = listingResult.details
                    ? `Validation error: ${JSON.stringify(listingResult.details.fieldErrors)}`
                    : (listingResult.error || 'Failed to create listing')
                throw new Error(errorMsg)
            }

            const listingId = listingResult.id

            setSuccess("📸 Uploading images to Firebase Storage...")
            setUploadProgress(30)

            // Step 2: Upload images to Firebase Storage
            const formData = new FormData()
            formData.append('listingId', listingId)

            store.uploadedImages.forEach((img, index) => {
                if (img.file) {
                    formData.append(`image-${index}`, img.file)
                }
            })

            const uploadResponse = await fetch('/api/upload-images', {
                method: 'POST',
                body: formData,
            })

            setUploadProgress(70)

            const uploadResult = await uploadResponse.json()

            if (!uploadResponse.ok || !uploadResult.ok || !uploadResult.urls || uploadResult.urls.length === 0) {
                // Image upload failed - delete the listing document since it's incomplete
                try {
                    await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
                } catch {
                    // Ignore deletion error - listing will be in 'creating' status
                }
                throw new Error(uploadResult.error || 'Failed to upload images to Firebase Storage')
            }

            setSuccess("🔗 Updating listing with image URLs...")
            setUploadProgress(85)

            // Step 3: Update listing with image URLs and activate listing
            // Determine primary image index (find image matching primaryImageId or default to 0)
            let primaryImageIndex = 0
            if (store.primaryImageId) {
                const foundIndex = store.uploadedImages.findIndex(img => img.id === store.primaryImageId)
                if (foundIndex >= 0) {
                    primaryImageIndex = foundIndex
                }
            }

            const updateResponse = await fetch(`/api/listings/${listingId}/photos`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photos: uploadResult.urls,
                    primaryImageIndex: primaryImageIndex,
                }),
            })

            if (!updateResponse.ok) {
                const updateError = await updateResponse.json()
                throw new Error(updateError.message || 'Failed to update listing with images')
            }

            setUploadProgress(95)

            // Step 4: Store payment record if paid plan
            if (store.paymentId && store.orderId) {
                await fetch('/api/listings/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listingId,
                        orderId: store.orderId,
                        paymentId: store.paymentId,
                        plan: store.selectedPlan,
                        amount: PLANS[store.selectedPlan].priceRupees,
                    }),
                })
            }

            setUploadProgress(100)
            setSuccess("🎉 Listing created successfully! Redirecting...")

            // Mark images as stored
            store.setImagesStoredInFirebase(true)
            store.setStatus('created')

            setError(null)

            setTimeout(() => {
                store.reset()
                router.push('/user/my-listing')
            }, 2000)

        } catch (err: any) {
            let errorMessage = "Failed to create listing. Please try again."

            if (err.message.includes('max_listings_reached') || err.message.includes('MAX_LISTINGS_REACHED')) {
                errorMessage = "You have reached the maximum limit of 100 listings per account."
            } else if (err.message.includes('already_has_listing')) {
                // Legacy error - keep for backwards compatibility
                errorMessage = "You have reached the maximum limit of 100 listings per account."
            } else if (err.message.includes('Validation error')) {
                errorMessage = "Some required information is missing or invalid."
            } else if (err.message.includes('unauthorized')) {
                errorMessage = "You must be logged in to create a listing."
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
            setUploadProgress(0)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate expiry date for paid plans
    const getExpiryDate = () => {
        if (store.selectedPlan === 'free') return null
        const days = PLANS[store.selectedPlan].durationDays || 7
        return addDays(new Date(), days)
    }

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Progress Steps */}
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon
                                const isActive = store.currentStep === step.id
                                const isCompleted = store.currentStep > step.id

                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isActive
                                                    ? "border-red-500 bg-red-50 text-red-600"
                                                    : isCompleted
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                                        : "border-gray-300 bg-white text-gray-400"
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="hidden sm:block">
                                                <p
                                                    className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-600"
                                                        }`}
                                                >
                                                    {step.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{step.description}</p>
                                            </div>
                                        </div>

                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={`hidden sm:block h-0.5 flex-1 mx-4 ${isCompleted ? "bg-emerald-500" : "bg-gray-200"
                                                    }`}
                                            />
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Alert Messages */}
                {error && (
                    <Alert variant="destructive" className="border-red-200">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription className="ml-2">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <AlertDescription className="ml-2 text-emerald-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Step Content */}
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {STEPS[store.currentStep - 1].name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Business Details */}
                        {store.currentStep === 1 && (
                            <div className="space-y-6">
                                {!store.selectedPlace && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-900">
                                            Search for Your Business <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            Start typing your business name to search in {CITY_NAME} district
                                        </p>
                                        <BusinessSearch
                                            onSelect={handleBusinessSelect}
                                            placeholder="Type your business name..."
                                            disabled={isFetchingDetails}
                                        />
                                        {isFetchingDetails && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                <span>Fetching business details from Google Maps...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {store.selectedPlace && (
                                    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                                                    <Check className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {store.selectedPlace.name}
                                                        </h3>
                                                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                                                            {store.selectedPlace.address && (
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                                                    <span>{store.selectedPlace.address}</span>
                                                                </div>
                                                            )}
                                                            {store.selectedPlace.primaryType && (
                                                                <div>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {store.selectedPlace.primaryType}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            store.setSelectedPlace(null)
                                                            store.setSelectedBusiness(null)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Media Upload */}
                        {store.currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Upload Business Photos
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Add 1-20 high-quality photos of your business. The first image will be your primary listing photo.
                                    </p>
                                </div>

                                <ImageUploadEnhanced
                                    images={store.uploadedImages}
                                    onImagesChange={handleImagesChange}
                                    primaryImageId={store.primaryImageId}
                                    onPrimaryImageChange={handlePrimaryImageChange}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* Step 3: Plan Selection */}
                        {store.currentStep === 3 && (
                            <div className="space-y-6">
                                {store.paymentCompleted && store.lockedPlan && (
                                    <Alert className="border-emerald-200 bg-emerald-50 mb-4">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        <AlertDescription className="ml-2 text-emerald-800">
                                            <strong>🔒 Plan Locked:</strong> Your {PLANS[store.lockedPlan].label} plan payment is complete.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <p className="text-sm text-gray-600">
                                    {store.paymentCompleted ? 'Your selected plan (locked after payment):' : 'Choose a plan that best fits your business needs'}
                                </p>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {Object.values(PLANS).map((plan) => {
                                        const isSelected = store.selectedPlan === plan.id
                                        const isLocked = store.paymentCompleted && store.lockedPlan !== null
                                        const isDisabled = isLocked && plan.id !== store.lockedPlan

                                        return (
                                            <button
                                                key={plan.id}
                                                onClick={() => !isDisabled && store.setSelectedPlan(plan.id)}
                                                disabled={isDisabled}
                                                className={`relative rounded-lg border-2 p-6 text-left transition-all ${isDisabled
                                                    ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                                    : isSelected
                                                        ? "border-red-500 bg-red-50"
                                                        : "border-gray-200 bg-white hover:border-gray-300"
                                                    }`}
                                            >
                                                {plan.popular && !isDisabled && (
                                                    <Badge className="absolute -top-2 right-4 bg-red-500">
                                                        Popular
                                                    </Badge>
                                                )}
                                                {isDisabled && (
                                                    <div className="absolute -top-2 right-4 bg-gray-400 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        Locked
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {plan.label}
                                                        {isSelected && isLocked && (
                                                            <span className="ml-2 text-emerald-600">✓ Paid</span>
                                                        )}
                                                    </h3>
                                                    {isSelected && !isLocked && (
                                                        <Check className="h-5 w-5 text-red-600" />
                                                    )}
                                                    {isSelected && isLocked && (
                                                        <Lock className="h-5 w-5 text-emerald-600" />
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <span className="text-3xl font-bold text-gray-900">
                                                        {plan.id === 'free' ? 'Free' : `₹${plan.priceRupees}`}
                                                    </span>
                                                    {plan.id !== 'free' && (
                                                        <span className="text-gray-600 text-sm ml-1">
                                                            /{plan.duration}
                                                        </span>
                                                    )}
                                                </div>

                                                <ul className="space-y-2">
                                                    {plan.features.map((feature, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm">
                                                            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                                            <span className="text-gray-700">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </button>
                                        )
                                    })}
                                </div>

                                {store.selectedPlan !== 'free' && (
                                    <div className="mt-6">
                                        {store.paymentCompleted ? (
                                            <Alert className="border-emerald-200 bg-emerald-50">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <AlertDescription className="ml-2 text-emerald-800">
                                                    Payment completed successfully! You can now proceed to review and create your listing.
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <Button
                                                onClick={initiatePayment}
                                                disabled={isProcessingPayment}
                                                size="lg"
                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {isProcessingPayment ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Processing Payment...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="mr-2 h-5 w-5" />
                                                        Pay ₹{PLANS[store.selectedPlan].priceRupees} with Razorpay
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Review & Create */}
                        {store.currentStep === 4 && (
                            <div className="space-y-6">
                                <Alert className="border-gray-200">
                                    <ShieldCheck className="h-5 w-5" />
                                    <AlertDescription className="ml-2">
                                        Review your listing details before creating. Once created, your listing will be live on the platform.
                                    </AlertDescription>
                                </Alert>

                                {/* Tabbed Review Interface */}
                                <Tabs defaultValue="details" className="w-full">
                                    <TabsList className="grid w-full grid-cols-5">
                                        <TabsTrigger value="details" className="text-xs sm:text-sm">
                                            <FileText className="h-4 w-4 mr-1" />
                                            Details
                                        </TabsTrigger>
                                        <TabsTrigger value="photos" className="text-xs sm:text-sm">
                                            <ImageIcon className="h-4 w-4 mr-1" />
                                            Photos
                                        </TabsTrigger>
                                        <TabsTrigger value="address" className="text-xs sm:text-sm">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            Address
                                        </TabsTrigger>
                                        <TabsTrigger value="contact" className="text-xs sm:text-sm">
                                            <Phone className="h-4 w-4 mr-1" />
                                            Contact
                                        </TabsTrigger>
                                        <TabsTrigger value="reviews" className="text-xs sm:text-sm">
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            Reviews
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Details Tab */}
                                    <TabsContent value="details" className="mt-4 space-y-4">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-gray-600" />
                                                Business Details
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Business Name</p>
                                                        <p className="font-medium text-gray-900">{store.selectedPlace?.name}</p>
                                                    </div>
                                                </div>

                                                {store.selectedPlace?.primaryType && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                                                            <Badge variant="secondary" className="mt-1">{store.selectedPlace.primaryType}</Badge>
                                                        </div>
                                                    </div>
                                                )}

                                                {store.selectedPlace?.editorialSummary && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <MessageSquare className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                                                            <p className="text-sm text-gray-700">{store.selectedPlace.editorialSummary}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {store.selectedPlace?.rating && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Google Rating</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-gray-900">{store.selectedPlace.rating} / 5.0</p>
                                                                {store.selectedPlace.userRatingCount && (
                                                                    <p className="text-sm text-gray-600">({store.selectedPlace.userRatingCount} reviews)</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Photos Tab */}
                                    <TabsContent value="photos" className="mt-4">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <ImageIcon className="h-5 w-5 text-gray-600" />
                                                Uploaded Photos ({store.uploadedImages.length})
                                            </h3>
                                            {store.uploadedImages.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {store.uploadedImages.map((img, index) => (
                                                        <div key={img.id} className="relative group">
                                                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
                                                                <Image
                                                                    src={img.localUrl}
                                                                    alt={`Business photo ${index + 1}`}
                                                                    fill
                                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="absolute top-2 left-2 flex gap-1">
                                                                <Badge className="bg-gray-900/80 text-white">
                                                                    {index + 1}
                                                                </Badge>
                                                                {img.id === store.primaryImageId && (
                                                                    <Badge className="bg-red-500">
                                                                        <Star className="h-3 w-3 mr-1" />
                                                                        Primary
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                    <p>No photos uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Address Tab */}
                                    <TabsContent value="address" className="mt-4">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-gray-600" />
                                                Location Information
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Address</p>
                                                        <p className="text-sm text-gray-900">{store.selectedPlace?.address || store.selectedPlace?.formattedAddress}</p>
                                                    </div>
                                                </div>

                                                {store.selectedPlace?.location && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coordinates</p>
                                                            <p className="text-sm font-mono text-gray-700">
                                                                {store.selectedPlace.location.lat.toFixed(6)}, {store.selectedPlace.location.lng.toFixed(6)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {store.selectedPlace?.googleMapsUri && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <Globe className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Google Maps Link</p>
                                                            <a
                                                                href={store.selectedPlace.googleMapsUri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline break-all"
                                                            >
                                                                View on Google Maps
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Contact Tab */}
                                    <TabsContent value="contact" className="mt-4">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Phone className="h-5 w-5 text-gray-600" />
                                                Contact Information
                                            </h3>
                                            <div className="space-y-4">
                                                {store.selectedPlace?.phone && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <Phone className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                                                            <a href={`tel:${store.selectedPlace.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                                                                {store.selectedPlace.phone}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {store.selectedPlace?.website && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <Globe className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</p>
                                                            <a
                                                                href={store.selectedPlace.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline break-all"
                                                            >
                                                                {store.selectedPlace.website}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {store.selectedPlace?.openingHours && store.selectedPlace.openingHours.length > 0 && (
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                                        <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Opening Hours</p>
                                                            <div className="space-y-1">
                                                                {store.selectedPlace.openingHours.map((hours, idx) => (
                                                                    <p key={idx} className="text-sm text-gray-700">{hours}</p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {(!store.selectedPlace?.phone && !store.selectedPlace?.website && (!store.selectedPlace?.openingHours || store.selectedPlace.openingHours.length === 0)) && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                        <p>No contact information available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Reviews Tab */}
                                    <TabsContent value="reviews" className="mt-4">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-gray-600" />
                                                Google Reviews
                                            </h3>
                                            {store.selectedPlace?.rating && (
                                                <div className="mb-4 p-4 rounded-lg bg-white border border-gray-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`h-5 w-5 ${star <= Math.round(store.selectedPlace?.rating || 0)
                                                                        ? "fill-yellow-400 text-yellow-400"
                                                                        : "text-gray-300"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="font-semibold text-lg">{store.selectedPlace.rating}</span>
                                                    </div>
                                                    {store.selectedPlace.userRatingCount && (
                                                        <p className="text-sm text-gray-600">Based on {store.selectedPlace.userRatingCount} Google reviews</p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-center py-8 text-gray-500">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Individual reviews will be synced from Google Places after listing creation</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {/* Plan Summary */}
                                <div className={`rounded-lg border p-4 ${store.paymentCompleted && store.lockedPlan ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">Plan Details</h3>
                                        {store.paymentCompleted && store.lockedPlan && (
                                            <div className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                                                <Lock className="h-4 w-4" />
                                                Locked & Paid
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Selected Plan</p>
                                            <Badge className={store.paymentCompleted && store.lockedPlan ? "bg-emerald-600" : "bg-red-500"}>
                                                {PLANS[store.selectedPlan].label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">{store.paymentCompleted ? 'Amount Paid' : 'Amount'}</p>
                                            <p className="font-medium text-gray-900">
                                                {store.selectedPlan === 'free' ? 'Free' : `₹${PLANS[store.selectedPlan].priceRupees}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Duration</p>
                                            <p className="font-medium text-gray-900">{PLANS[store.selectedPlan].duration}</p>
                                        </div>
                                        {store.paymentCompleted && (
                                            <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                                                <p className="text-sm text-gray-600">Payment Status</p>
                                                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Completed
                                                </div>
                                            </div>
                                        )}
                                        {getExpiryDate() && (
                                            <div className="flex items-start justify-between pt-3 border-t">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Plan Expires On</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">
                                                        {format(getExpiryDate()!, 'PPP')}
                                                    </p>
                                                    <p className="text-xs text-gray-600 flex items-center gap-1 justify-end mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(getExpiryDate()!, 'p')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {store.paymentId && store.orderId && (
                                            <>
                                                <div className="flex items-center justify-between text-xs pt-3 border-t border-emerald-200">
                                                    <p className="text-gray-500">Payment ID</p>
                                                    <p className="font-mono text-gray-700">{store.paymentId}</p>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <p className="text-gray-500">Order ID</p>
                                                    <p className="font-mono text-gray-700">{store.orderId}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Create Button */}
                                <div className="pt-4">
                                    <Button
                                        onClick={createListing}
                                        disabled={isLoading}
                                        size="lg"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Creating Listing... {uploadProgress}%
                                            </>
                                        ) : (
                                            <>
                                                <FileCheck className="mr-2 h-5 w-5" />
                                                Create My Listing
                                            </>
                                        )}
                                    </Button>
                                    {isLoading && uploadProgress > 0 && (
                                        <div className="mt-3 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                    <Button
                        onClick={handlePreviousStep}
                        variant="outline"
                        disabled={store.currentStep === 1 || isLoading || (store.currentStep === 4 && store.paymentCompleted)}
                        className="border-2 hover:bg-gray-50"
                        title={store.currentStep === 4 && store.paymentCompleted ? "Cannot go back after payment" : ""}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                        {store.currentStep === 4 && store.paymentCompleted && (
                            <Lock className="ml-2 h-3 w-3 text-gray-500" />
                        )}
                    </Button>

                    {store.currentStep < 4 && (
                        <Button
                            onClick={handleNextStep}
                            disabled={isLoading || isFetchingDetails || isProcessingPayment}
                            className="bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Terms Dialog */}
            <AlertDialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-red-600" />
                            Terms and Conditions
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p>
                                    Before proceeding, please confirm that you agree to the following:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li>I confirm that all business details provided are accurate and up-to-date</li>
                                    <li>I am the sole owner or authorized representative of this business</li>
                                    <li>I have read and agree to the <a href="/policies" target="_blank" className="text-red-600 hover:underline">Terms & Conditions</a> and <a href="/policies" target="_blank" className="text-red-600 hover:underline">Privacy Policy</a></li>
                                    <li>I understand that false or misleading information may result in listing removal</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowTermsDialog(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAcceptTerms}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            I Agree, Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
