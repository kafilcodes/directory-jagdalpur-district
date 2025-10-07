"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { PLANS, type PlanId } from "@/lib/plans"
import {
    Loader2,
    Search,
    Check,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    MapPin,
    CreditCard,
    FileCheck,
    X,
    AlertTriangle,
    ShieldCheck,
    Calendar,
    Clock,
    CheckCircle2,
    Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import {
    fetchPlaceDetails,
    type PlaceDetails,
} from "@/lib/google-places"
import { format, addDays } from "date-fns"
import { BusinessSearch, type BusinessSuggestion } from "@/components/user/BusinessSearch"

// Step definitions for 3-step flow
const STEPS = [
    { id: 1, name: "Details", icon: MapPin, description: "Business information" },
    { id: 2, name: "Plan", icon: CreditCard, description: "Choose your plan" },
    { id: 3, name: "Create", icon: FileCheck, description: "Review and create" },
]

export function CreateListingFormNew3Step() {
    const router = useRouter()

    // State management
    const [currentStep, setCurrentStep] = React.useState(1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)

    // Step 1: Google Places state
    const [selectedBusiness, setSelectedBusiness] = React.useState<BusinessSuggestion | null>(null)
    const [selectedPlace, setSelectedPlace] = React.useState<PlaceDetails | null>(null)
    const [isFetchingDetails, setIsFetchingDetails] = React.useState(false)
    const [showTermsDialog, setShowTermsDialog] = React.useState(false)
    const [termsAccepted, setTermsAccepted] = React.useState(false)

    // Step 2: Payment state
    const [selectedPlan, setSelectedPlan] = React.useState<PlanId>('free')
    const [lockedPlan, setLockedPlan] = React.useState<PlanId | null>(null) // Locked after payment
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [paymentCompleted, setPaymentCompleted] = React.useState(false)
    const [paymentId, setPaymentId] = React.useState<string | null>(null)
    const [orderId, setOrderId] = React.useState<string | null>(null)

    // Step 3: Creation state
    const [uploadProgress, setUploadProgress] = React.useState(0)

    // Load draft on mount
    React.useEffect(() => {
        loadDraft()
    }, [])

    // Auto-save draft
    React.useEffect(() => {
        if (selectedPlace || paymentCompleted) {
            saveDraft()
        }
    }, [selectedPlace, selectedPlan, paymentCompleted, paymentId, orderId, termsAccepted])

    async function loadDraft() {
        try {
            const response = await fetch('/api/drafts')
            if (response.ok) {
                const data = await response.json()
                if (data.ok && data.draft) {
                    const draft = data.draft
                    if (draft.selectedBusiness) setSelectedBusiness(draft.selectedBusiness)
                    if (draft.googlePlaceData) setSelectedPlace(draft.googlePlaceData)
                    if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan)
                    if (draft.paymentCompleted) {
                        setPaymentCompleted(true)
                        setPaymentId(draft.paymentId)
                        setOrderId(draft.orderId)
                    }
                    if (draft.termsAccepted) setTermsAccepted(true)

                    // Navigate to appropriate step
                    if (draft.paymentCompleted) {
                        setCurrentStep(3)
                    } else if (draft.termsAccepted && draft.googlePlaceData) {
                        setCurrentStep(2)
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load draft:', err)
        }
    }

    async function saveDraft() {
        try {
            await fetch('/api/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedBusiness,
                    googlePlaceData: selectedPlace,
                    selectedPlan,
                    paymentCompleted,
                    paymentId,
                    orderId,
                    termsAccepted,
                    status: paymentCompleted ? 'payment_completed' : termsAccepted ? 'payment_pending' : 'draft',
                }),
            })
        } catch (err) {
            console.error('Failed to save draft:', err)
        }
    }

    /**
     * Handle business selection from search
     * Fetch full place details using Place ID
     */
    async function handleBusinessSelect(business: BusinessSuggestion) {
        setSelectedBusiness(business)
        setIsFetchingDetails(true)
        setError(null)
        setSuccess(null)

        try {
            const placeId = business.placeId

            // Validate that we have a place ID
            if (!placeId) {
                setError("Invalid Google Maps URL or Place ID. Please use a valid business profile URL or Place ID.")
                return
            }

            // Fetch place details from Google Places API
            const result = await fetchPlaceDetails(placeId)

            if (!result.success || !result.placeDetails) {
                setError(result.error || "Could not fetch business details. Please check the URL and try again.")
                return
            }

            const details = result.placeDetails

            // Strict location validation: Must be in Dhamtari district or postcode 493773
            const addressLower = (details.address || "").toLowerCase()
            const hasValidLocation =
                addressLower.includes('dhamtari') ||
                addressLower.includes('493773')

            if (result.locationRestricted || !hasValidLocation) {
                setError("Only businesses located in Dhamtari district (Chhattisgarh, India) with postcode 493773 are allowed on this platform.")
                return
            }

            // Additional validation: Check if business has minimum required data
            if (!details.name || !details.address) {
                setError("Incomplete business information. Please ensure your Google Business Profile is complete.")
                return
            }

            setSelectedPlace(details)
            setSuccess("Business details fetched successfully!")
            setTimeout(() => setSuccess(null), 3000)

        } catch (err: any) {
            console.error('Fetch error:', err)
            setError(err.message || "Failed to fetch business details. Please try again.")
        } finally {
            setIsFetchingDetails(false)
        }
    }

    function handleNextStep() {
        setError(null)

        if (currentStep === 1) {
            // Validate business details
            if (!selectedPlace) {
                setError("Please fetch your business details from Google Maps URL")
                return
            }

            // Show terms dialog
            setShowTermsDialog(true)
        } else if (currentStep === 2) {
            // Validate payment for paid plans
            if (selectedPlan !== 'free' && !paymentCompleted) {
                setError("Please complete payment to continue")
                return
            }

            setCurrentStep(3)
        }
    }

    function handleAcceptTerms() {
        setTermsAccepted(true)
        setShowTermsDialog(false)
        setCurrentStep(2)
    }

    function handlePreviousStep() {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setError(null)
        }
    }

    async function initiatePayment() {
        if (selectedPlan === 'free') {
            setPaymentCompleted(true)
            return
        }

        setIsProcessingPayment(true)
        setError(null)

        try {
            const plan = PLANS[selectedPlan]

            // Create Razorpay order
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: plan.pricePaise,
                    plan: selectedPlan,
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
                name: "Dhamtari Directory",
                description: `${plan.label} Plan - ${plan.duration}`,
                order_id: orderData.orderId,
                handler: function (response: any) {
                    setPaymentId(response.razorpay_payment_id)
                    setOrderId(response.razorpay_order_id)
                    setPaymentCompleted(true)
                    setLockedPlan(selectedPlan) // 🔒 Lock the plan after successful payment
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
            console.error('Payment error:', err)
            setError(err.message || "Payment failed. Please try again.")
        } finally {
            setIsProcessingPayment(false)
        }
    }

    async function createListing() {
        if (!selectedPlace) {
            setError("Business details are missing")
            return
        }

        setIsLoading(true)
        setUploadProgress(10)
        setError(null)

        try {
            // Get photo reference names from Google Places (up to 20)
            setSuccess("📸 Processing business photos...")
            const googlePhotoRefs = selectedPlace.photos?.slice(0, 20).map(photo => photo.name) || []
            setUploadProgress(20)

            console.log('📸 Preparing listing with', googlePhotoRefs.length, 'photos')

            setSuccess("📝 Preparing listing data...")
            setUploadProgress(40)

            // Prepare listing data
            const listingData = {
                businessName: selectedPlace.name,
                placeId: selectedPlace.placeId,
                businessSearchName: selectedBusiness?.name || selectedPlace.name,
                address: selectedPlace.address,
                phone: selectedPlace.phone || '',
                website: selectedPlace.website || '',
                category: selectedPlace.primaryType || selectedPlace.types?.[0] || 'Business',
                photos: googlePhotoRefs,
                plan: selectedPlan,
                ...(orderId && { orderId }),
                ...(paymentId && { paymentId }),
                status: 'active',
            }

            console.log('📤 Sending listing data:', listingData)

            setSuccess("🚀 Creating your listing...")
            setUploadProgress(60)

            // Create listing
            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(listingData),
            })

            setUploadProgress(80)

            const responseData = await response.json()

            if (!response.ok) {
                console.error('API Error Response:', responseData)
                const errorMsg = responseData.details
                    ? `Validation error: ${JSON.stringify(responseData.details.fieldErrors)}`
                    : (responseData.error || 'Failed to create listing')
                throw new Error(errorMsg)
            }

            setSuccess("💳 Recording payment details...")
            setUploadProgress(85)

            // Store payment record if paid plan
            if (paymentId && orderId) {
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
            }

            setSuccess("✨ Finalizing your listing...")
            setUploadProgress(95)

            // Update draft status
            await fetch('/api/drafts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'created' }),
            })

            setUploadProgress(100)

            setSuccess("🎉 Listing created successfully! Redirecting to your listing...")

            // Clear error if any
            setError(null)

            setTimeout(() => {
                router.push('/user/my-listing')
            }, 2500)

        } catch (err: any) {
            console.error('❌ Creation error:', err)

            // Provide specific error messages
            let errorMessage = "Failed to create listing. Please try again."

            if (err.message.includes('already_has_listing')) {
                errorMessage = "You already have a listing. Each user can only create one listing."
            } else if (err.message.includes('Validation error')) {
                errorMessage = "Some required information is missing or invalid. Please check your business details."
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
        if (selectedPlan === 'free') return null
        const days = PLANS[selectedPlan].durationDays || 7
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
                                const isActive = currentStep === step.id
                                const isCompleted = currentStep > step.id

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
                            {STEPS[currentStep - 1].name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Business Details */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {/* Business Search Component */}
                                {!selectedPlace && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-900">
                                            Search for Your Business <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            Start typing your business name to search in Dhamtari district
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

                                {/* Business Details Display */}
                                {selectedPlace && (
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
                                                            {selectedPlace.name}
                                                        </h3>
                                                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                                                            {selectedPlace.address && (
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                                                    <span>{selectedPlace.address}</span>
                                                                </div>
                                                            )}
                                                            {selectedPlace.primaryType && (
                                                                <div>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {selectedPlace.primaryType}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                                                                <p className="text-xs text-gray-600">
                                                                    {selectedPlace.photos.length} photos available
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPlace(null)
                                                            setSelectedBusiness(null)
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

                        {/* Step 2: Plan Selection */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {paymentCompleted && lockedPlan && (
                                    <Alert className="border-emerald-200 bg-emerald-50 mb-4">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        <AlertDescription className="ml-2 text-emerald-800">
                                            <strong>🔒 Plan Locked:</strong> Your {PLANS[lockedPlan].label} plan payment is complete. You cannot change plans now.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <p className="text-sm text-gray-600">
                                    {paymentCompleted ? 'Your selected plan (locked after payment):' : 'Choose a plan that best fits your business needs'}
                                </p>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {Object.values(PLANS).map((plan) => {
                                        const isSelected = selectedPlan === plan.id
                                        const isLocked = paymentCompleted && lockedPlan !== null
                                        const isDisabled = isLocked && plan.id !== lockedPlan

                                        return (
                                            <button
                                                key={plan.id}
                                                onClick={() => !isDisabled && setSelectedPlan(plan.id)}
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

                                {selectedPlan !== 'free' && (
                                    <div className="mt-6">
                                        {paymentCompleted ? (
                                            <Alert className="border-emerald-200 bg-emerald-50">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <AlertDescription className="ml-2 text-emerald-800">
                                                    Payment completed successfully! You can now proceed to create your listing.
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
                                                        Pay ₹{PLANS[selectedPlan].priceRupees} with Razorpay
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Summary & Create */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <Alert className="border-gray-200">
                                    <ShieldCheck className="h-5 w-5" />
                                    <AlertDescription className="ml-2">
                                        Review your listing details before creating. Once created, your listing will be live on the platform.
                                    </AlertDescription>
                                </Alert>

                                {/* Business Summary */}
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-4">Business Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Business Name</p>
                                            <p className="font-medium text-gray-900">{selectedPlace?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="text-sm text-gray-900">{selectedPlace?.address}</p>
                                        </div>
                                        {selectedPlace?.primaryType && (
                                            <div>
                                                <p className="text-sm text-gray-600">Category</p>
                                                <Badge variant="secondary">{selectedPlace.primaryType}</Badge>
                                            </div>
                                        )}
                                        {selectedPlace?.photos && selectedPlace.photos.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-600">Photos</p>
                                                <p className="text-sm text-gray-900">
                                                    {Math.min(selectedPlace.photos.length, 10)} photos from Google Business Profile
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Plan Summary */}
                                <div className={`rounded-lg border p-4 ${paymentCompleted && lockedPlan ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">Plan Details</h3>
                                        {paymentCompleted && lockedPlan && (
                                            <div className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                                                <Lock className="h-4 w-4" />
                                                Locked & Paid
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Selected Plan</p>
                                            <Badge className={paymentCompleted && lockedPlan ? "bg-emerald-600" : "bg-red-500"}>
                                                {PLANS[selectedPlan].label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">{paymentCompleted ? 'Amount Paid' : 'Amount'}</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedPlan === 'free' ? 'Free' : `₹${PLANS[selectedPlan].priceRupees}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Duration</p>
                                            <p className="font-medium text-gray-900">{PLANS[selectedPlan].duration}</p>
                                        </div>
                                        {paymentCompleted && (
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
                                        {paymentId && orderId && (
                                            <>
                                                <div className="flex items-center justify-between text-xs pt-3 border-t border-emerald-200">
                                                    <p className="text-gray-500">Payment ID</p>
                                                    <p className="font-mono text-gray-700">{paymentId}</p>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <p className="text-gray-500">Order ID</p>
                                                    <p className="font-mono text-gray-700">{orderId}</p>
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
                                    {isLoading && (
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
                        disabled={currentStep === 1 || isLoading || (currentStep === 3 && paymentCompleted)}
                        className="border-2 hover:bg-gray-50"
                        title={currentStep === 3 && paymentCompleted ? "Cannot go back after payment" : ""}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                        {currentStep === 3 && paymentCompleted && (
                            <Lock className="ml-2 h-3 w-3 text-gray-500" />
                        )}
                    </Button>

                    {currentStep < 3 && (
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
