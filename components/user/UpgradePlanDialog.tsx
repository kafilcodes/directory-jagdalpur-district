"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Loader2, Crown, Star, Check, Sparkles, TrendingUp,
    AlertCircle, CheckCircle2, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MONETIZATION_PLANS, formatPrice } from "@/config/directory"

// Lazy load Lottie for performance
const LottieAnimation = dynamic(() => import("@/components/common/LottieAnimation").then(mod => ({ default: mod.LottieAnimation })), {
    ssr: false,
    loading: () => <div className="w-24 h-24 bg-gray-100 rounded-full animate-pulse mx-auto" />
})

declare global {
    interface Window {
        Razorpay?: any
    }
}

interface UpgradePlanDialogProps {
    open: boolean
    onClose: () => void
    listingId: string
    listingName: string
    currentPlan: 'free' | 'sponsored' | 'featured'
    isPlanExpired: boolean
    onSuccess: () => void
}

// Load Razorpay script
function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return resolve()
        if (window.Razorpay) return resolve()
        const s = document.createElement("script")
        s.src = "https://checkout.razorpay.com/v1/checkout.js"
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("Failed to load Razorpay"))
        document.body.appendChild(s)
    })
}

export function UpgradePlanDialog({
    open,
    onClose,
    listingId,
    listingName,
    currentPlan,
    isPlanExpired,
    onSuccess
}: UpgradePlanDialogProps) {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successPlan, setSuccessPlan] = useState<string>("")
    const [razorpayOpen, setRazorpayOpen] = useState(false) // Track Razorpay modal state

    // Filter plans - only show paid plans (featured, sponsored)
    const availablePlans = MONETIZATION_PLANS.filter(p => p.id !== 'free')

    const handleSelectPlan = (planId: string) => {
        if (planId === currentPlan && !isPlanExpired) return
        setSelectedPlan(planId)
    }

    const handlePayment = useCallback(async () => {
        if (!selectedPlan) return

        const plan = MONETIZATION_PLANS.find(p => p.id === selectedPlan)
        if (!plan) return

        setIsProcessing(true)

        try {
            // Load Razorpay script
            await loadRazorpay()

            // Create order - API expects amount in rupees and planType
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: plan.priceINR,
                    planType: selectedPlan,
                    listingTitle: listingName,
                    currency: 'INR'
                })
            })

            const orderData = await orderResponse.json()
            if (!orderData?.success) {
                throw new Error(orderData?.error || 'Failed to create order')
            }

            const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
            if (!key) {
                throw new Error("Payment configuration error")
            }

            // Open Razorpay checkout
            const options = {
                key,
                amount: plan.pricePaise,
                currency: 'INR',
                name: process.env.NEXT_PUBLIC_APP_NAME || 'Dial Dhamtari',
                description: `${plan.name} for ${listingName}`,
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    setRazorpayOpen(false) // Razorpay closed
                    try {
                        // Verify payment - API expects razorpay_ prefixed keys
                        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                listingId,
                                planType: selectedPlan,
                                amount: plan.pricePaise
                            })
                        })

                        const verifyData = await verifyResponse.json()
                        if (!verifyData?.success) {
                            throw new Error(verifyData?.error || 'Payment verification failed')
                        }

                        // Show success animation
                        setSuccessPlan(plan.name)
                        setShowSuccess(true)

                        // Auto close after animation
                        setTimeout(() => {
                            setShowSuccess(false)
                            onSuccess()
                            onClose()
                        }, 3000)
                    } catch (error) {
                        console.error('[UpgradePlanDialog] Verification error:', error)
                        toast.error('Payment verification failed. Please contact support.')
                    } finally {
                        setIsProcessing(false)
                    }
                },
                prefill: {},
                theme: { color: '#EF4444' },
                modal: {
                    ondismiss: function () {
                        setRazorpayOpen(false) // Razorpay closed
                        setIsProcessing(false)
                    },
                    escape: true,
                    backdropclose: false
                }
            }

            // Set flag to indicate Razorpay is opening
            setRazorpayOpen(true)

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response: any) {
                setRazorpayOpen(false)
                toast.error('Payment failed. Please try again.')
                setIsProcessing(false)
            })
            rzp.open()
        } catch (error) {
            console.error('[UpgradePlanDialog] Error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to initiate payment')
            setIsProcessing(false)
        }
    }, [selectedPlan, listingId, listingName, onSuccess, onClose])

    // Success View
    if (showSuccess) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md text-center p-6 sm:p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {/* Lottie Success Animation */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                            <LottieAnimation
                                src="/lottie/listing_sucess.json"
                                loop={false}
                                autoplay={true}
                                className="w-full h-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Payment Successful! 🎉
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600">
                                Your listing has been upgraded to <span className="font-semibold text-red-500">{successPlan}</span>
                            </p>
                        </div>

                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Active Now
                        </Badge>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open && !razorpayOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header */}
                <DialogHeader className="p-4 sm:p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl">Upgrade Your Plan</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm mt-0.5">
                                Get more visibility and grow your business faster
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-4 sm:p-6 space-y-5">
                    {/* Current Plan Info */}
                    <Card className={cn(
                        "border-2",
                        isPlanExpired ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
                    )}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className={cn(
                                    "h-5 w-5",
                                    isPlanExpired ? "text-red-500" : "text-gray-500"
                                )} />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {isPlanExpired ? "Plan Expired" : "Current Plan"}
                                    </p>
                                    <p className={cn(
                                        "text-xs",
                                        isPlanExpired ? "text-red-600" : "text-gray-500"
                                    )}>
                                        {currentPlan === 'free' ? 'Free Listing' :
                                            currentPlan === 'featured' ? 'Featured Listing' : 'Sponsored Listing'}
                                        {isPlanExpired && " - Needs renewal"}
                                    </p>
                                </div>
                            </div>
                            {!isPlanExpired && currentPlan !== 'free' && (
                                <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                        </CardContent>
                    </Card>

                    {/* Plan Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availablePlans.map((plan) => {
                            const isSelected = selectedPlan === plan.id
                            const isCurrent = currentPlan === plan.id && !isPlanExpired
                            const isFeatured = plan.id === 'featured'

                            return (
                                <Card
                                    key={plan.id}
                                    className={cn(
                                        "relative cursor-pointer transition-all duration-200 border-2",
                                        isSelected
                                            ? "border-red-500 shadow-lg shadow-red-500/20"
                                            : isCurrent
                                                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                                : "border-gray-200 hover:border-red-300 hover:shadow-md",
                                        isFeatured && !isCurrent && "ring-2 ring-yellow-200"
                                    )}
                                    onClick={() => handleSelectPlan(plan.id)}
                                >
                                    {/* Popular Badge */}
                                    {plan.popular && !isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="pb-2 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {plan.id === 'featured' ? (
                                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                                ) : (
                                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                                )}
                                                <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                                            </div>
                                            {isSelected && (
                                                <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                                {formatPrice(plan.priceINR)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                / {plan.durationWeeks} week
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-2">
                                        <ul className="space-y-2">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                                                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrent && (
                                            <Badge className="mt-4 bg-green-100 text-green-700 w-full justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Current Plan
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Payment Button */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={!selectedPlan || isProcessing}
                            className="w-full sm:flex-1 bg-red-500 hover:bg-red-600"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Proceed to Payment
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Secure Payment Notice */}
                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        Secure payment powered by Razorpay
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
