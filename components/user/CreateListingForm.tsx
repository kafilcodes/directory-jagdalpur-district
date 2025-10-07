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
import { CATEGORIES, MONETIZATION_PLANS, formatPrice } from "@/config/directory"
import { Loader2, Search, Save, Check, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const DRAFT_KEY = "create_listing_draft"

interface ListingFormData {
    placeUrl: string
    businessName: string
    categorySlug: string
    description: string
    phoneNumber: string
    website: string
    address: string
    planId: string
}

const defaultFormData: ListingFormData = {
    placeUrl: "",
    businessName: "",
    categorySlug: "",
    description: "",
    phoneNumber: "",
    website: "",
    address: "",
    planId: "free",
}

export function CreateListingForm() {
    const router = useRouter()
    const [formData, setFormData] = React.useState<ListingFormData>(defaultFormData)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetchingPlaces, setIsFetchingPlaces] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [draftSaved, setDraftSaved] = React.useState(false)

    // Load draft from localStorage on mount
    React.useEffect(() => {
        try {
            const draft = localStorage.getItem(DRAFT_KEY)
            if (draft) {
                setFormData(JSON.parse(draft))
            }
        } catch (err) {
            console.error("Failed to load draft:", err)
        }
    }, [])

    // Save draft to localStorage
    const saveDraft = React.useCallback(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
        } catch (err) {
            console.error("Failed to save draft:", err)
        }
    }, [formData])

    // Fetch Google Places details
    const fetchPlaceDetails = async () => {
        if (!formData.placeUrl) {
            setError("Please enter a Google Places URL or Place ID")
            return
        }

        setIsFetchingPlaces(true)
        setError(null)

        try {
            const response = await fetch("/api/google-places-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: formData.placeUrl }),
            })

            if (!response.ok) {
                throw new Error("Failed to fetch place details")
            }

            const data = await response.json()

            if (data.error) {
                setError(data.error)
                return
            }

            // Populate form with Google Places data
            setFormData((prev) => ({
                ...prev,
                businessName: data.name || prev.businessName,
                phoneNumber: data.phoneNumber || prev.phoneNumber,
                website: data.website || prev.website,
                address: data.formattedAddress || prev.address,
            }))
        } catch (err: any) {
            setError(err.message || "Failed to fetch place details")
        } finally {
            setIsFetchingPlaces(false)
        }
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!formData.businessName) {
            setError("Business name is required")
            return
        }
        if (!formData.categorySlug) {
            setError("Please select a category")
            return
        }

        // Save draft first
        saveDraft()

        // Check if paid plan selected
        const selectedPlan = MONETIZATION_PLANS.find((p) => p.id === formData.planId)

        if (selectedPlan && selectedPlan.priceINR > 0) {
            // Redirect to payment page (future implementation)
            router.push(`/user/payment?plan=${formData.planId}` as any)
            return
        }

        // Free plan - submit directly
        setIsLoading(true)

        try {
            const response = await fetch("/api/listings/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessName: formData.businessName,
                    categorySlug: formData.categorySlug,
                    description: formData.description,
                    phoneNumber: formData.phoneNumber,
                    website: formData.website,
                    address: formData.address,
                    planId: formData.planId,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to create listing")
            }

            const result = await response.json()

            // Clear draft
            localStorage.removeItem(DRAFT_KEY)

            // Redirect to my listing
            router.push("/user/my-listing" as any)
        } catch (err: any) {
            setError(err.message || "Failed to create listing")
        } finally {
            setIsLoading(false)
        }
    }

    const updateFormData = (key: keyof ListingFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const selectedPlan = MONETIZATION_PLANS.find((p) => p.id === formData.planId)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-red-900">Error</p>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Google Places Fetch */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Import from Google Places</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Optional: Paste your Google Maps URL or Place ID to auto-fill details
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label htmlFor="placeUrl">Google Maps URL or Place ID</Label>
                        <Input
                            id="placeUrl"
                            type="text"
                            placeholder="https://maps.google.com/..."
                            value={formData.placeUrl}
                            onChange={(e) => updateFormData("placeUrl", e.target.value)}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={fetchPlaceDetails}
                        disabled={isFetchingPlaces || !formData.placeUrl}
                    >
                        {isFetchingPlaces ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Fetching...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Fetch Details
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="businessName">
                            Business Name <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="businessName"
                            type="text"
                            required
                            placeholder="Your Business Name"
                            value={formData.businessName}
                            onChange={(e) => updateFormData("businessName", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="categorySlug">
                            Category <span className="text-red-600">*</span>
                        </Label>
                        <Select
                            value={formData.categorySlug}
                            onValueChange={(value) => updateFormData("categorySlug", value)}
                            required
                        >
                            <SelectTrigger id="categorySlug" className="bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800">
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.slug} value={cat.slug}>
                                        {cat.icon} {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of your business..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => updateFormData("description", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+91 1234567890"
                            value={formData.phoneNumber}
                            onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://yourbusiness.com"
                            value={formData.website}
                            onChange={(e) => updateFormData("website", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            placeholder="Full address..."
                            rows={3}
                            value={formData.address}
                            onChange={(e) => updateFormData("address", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Monetization Plan */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Select Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {MONETIZATION_PLANS.map((plan) => (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => updateFormData("planId", plan.id)}
                                className={`relative p-4 rounded-lg border-2 transition-all text-left ${formData.planId === plan.id
                                    ? "border-red-600 bg-red-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                {plan.popular && (
                                    <Badge className="absolute -top-2 -right-2 bg-yellow-500">
                                        Popular
                                    </Badge>
                                )}
                                <div className="font-semibold text-gray-900">{plan.name}</div>
                                <div className="text-2xl font-bold text-red-600 mt-2">
                                    {formatPrice(plan.priceINR)}
                                </div>
                                {plan.durationWeeks > 0 && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        {plan.durationWeeks} weeks
                                    </div>
                                )}
                                <ul className="mt-3 space-y-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                            <Check className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={saveDraft}
                    disabled={isLoading}
                >
                    {draftSaved ? (
                        <>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                        </>
                    )}
                </Button>

                <Button
                    type="submit"
                    disabled={isLoading || !formData.businessName || !formData.categorySlug}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : selectedPlan && selectedPlan.priceINR > 0 ? (
                        <>Proceed to Payment ({formatPrice(selectedPlan.priceINR)})</>
                    ) : (
                        "Create Free Listing"
                    )}
                </Button>
            </div>
        </form>
    )
}
