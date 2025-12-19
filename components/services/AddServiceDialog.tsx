"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
    Loader2, AlertCircle, CheckCircle, Upload, User, Phone, MapPin, Clock,
    IndianRupee, Star, Briefcase, Mail, Globe, X, Image as ImageIcon,
    FileText, Info, Send, XCircle, Wrench, PlusCircle, Building, Calendar,
    CreditCard, Tag, Users
} from "lucide-react"
import {
    SERVICE_CATEGORIES, SERVICE_QUALITY_LEVELS,
    type QualityLevel
} from "@/config/services"

// ==================== VALIDATION CONSTANTS ====================
const VALIDATION_LIMITS = {
    NAME_MIN: 2,
    NAME_MAX: 50,
    ADDRESS_MIN: 10,
    ADDRESS_MAX: 200,
    PHONE_LENGTH: 10,
    CHARGES_MIN: 50,
    CHARGES_MAX: 50000,
    BLOCK_MAX: 50,
    OFFICE_MAX: 200,
    EXP_MAX: 60,
    AGE_MIN: 18,
    AGE_MAX: 80,
    AADHAR_LENGTH: 12,
    EMAIL_MAX: 100,
    WEBSITE_MAX: 100,
    TAGS_MAX: 200,
}

// Working hours options
const WORKING_HOURS_START = [
    "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"
]

const WORKING_HOURS_END = [
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
    "10:00 PM", "11:00 PM", "12:00 AM"
]

const WORKING_DAYS = [
    { value: "mon-sun", label: "Mon - Sun" },
    { value: "mon-sat", label: "Mon - Sat" },
    { value: "mon-fri", label: "Mon - Fri" },
    { value: "sat-sun", label: "Weekends" },
    { value: "flexible", label: "Flexible" },
]

// Validation schema for service form
const AddServiceSchema = z.object({
    // Required fields with strict validation
    name: z.string()
        .min(VALIDATION_LIMITS.NAME_MIN, `Name must be at least ${VALIDATION_LIMITS.NAME_MIN} characters`)
        .max(VALIDATION_LIMITS.NAME_MAX, `Name must not exceed ${VALIDATION_LIMITS.NAME_MAX} characters`)
        .regex(/^[a-zA-Z\u0900-\u097F\s.']+$/, "Name can only contain letters and spaces"),
    service: z.string().min(1, "Please select a service type"),
    customService: z.string()
        .max(20, "Custom service must not exceed 20 characters")
        .regex(/^[a-zA-Z\u0900-\u097F\s]*$/, "Only letters allowed")
        .optional(),
    address: z.string()
        .min(VALIDATION_LIMITS.ADDRESS_MIN, `Address must be at least ${VALIDATION_LIMITS.ADDRESS_MIN} characters`)
        .max(VALIDATION_LIMITS.ADDRESS_MAX, `Address must not exceed ${VALIDATION_LIMITS.ADDRESS_MAX} characters`),
    whatsappNumber: z.string()
        .length(VALIDATION_LIMITS.PHONE_LENGTH, `Must be exactly ${VALIDATION_LIMITS.PHONE_LENGTH} digits`)
        .regex(/^[6-9]\d{9}$/, "Enter valid mobile number starting with 6-9"),
    contactNumber: z.string()
        .length(VALIDATION_LIMITS.PHONE_LENGTH, `Must be exactly ${VALIDATION_LIMITS.PHONE_LENGTH} digits`)
        .regex(/^[6-9]\d{9}$/, "Enter valid mobile number starting with 6-9"),
    workingHoursStart: z.string().min(1, "Select start time"),
    workingHoursEnd: z.string().min(1, "Select end time"),
    workingDays: z.string().min(1, "Select working days"),
    chargesPerHour: z.number()
        .min(VALIDATION_LIMITS.CHARGES_MIN, `Minimum charge is ₹${VALIDATION_LIMITS.CHARGES_MIN}`)
        .max(VALIDATION_LIMITS.CHARGES_MAX, `Maximum charge is ₹${VALIDATION_LIMITS.CHARGES_MAX.toLocaleString()}`),
    qualityRating: z.number().min(1, "Please rate your quality").max(5),

    // Optional fields with validation
    isNegotiable: z.boolean().optional().default(false),
    profilePhoto: z.string().optional(),
    blockOfCity: z.string().max(VALIDATION_LIMITS.BLOCK_MAX).optional().or(z.literal("")),
    officeAddress: z.string().max(VALIDATION_LIMITS.OFFICE_MAX).optional().or(z.literal("")),
    experienceYears: z.number().min(0).max(VALIDATION_LIMITS.EXP_MAX).optional().nullable(),
    gender: z.enum(["male", "female", "other"]).optional(),
    age: z.number().min(VALIDATION_LIMITS.AGE_MIN).max(VALIDATION_LIMITS.AGE_MAX).optional().nullable(),
    aadharNumber: z.string().regex(/^(\d{12})?$/, "Aadhar must be 12 digits").optional().or(z.literal("")),
    email: z.string().email("Invalid email").max(VALIDATION_LIMITS.EMAIL_MAX).optional().or(z.literal("")),
    website: z.string().url("Invalid URL (include https://)").max(VALIDATION_LIMITS.WEBSITE_MAX).optional().or(z.literal("")),
    tags: z.string().max(VALIDATION_LIMITS.TAGS_MAX).optional().or(z.literal("")),
})

type AddServiceFormData = z.infer<typeof AddServiceSchema>

interface AddServiceDialogProps {
    open: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function AddServiceDialog({ open, onClose, onSuccess }: AddServiceDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
    const [currentTab, setCurrentTab] = useState("required")
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [showCustomService, setShowCustomService] = useState(false)

    const form = useForm<AddServiceFormData>({
        resolver: zodResolver(AddServiceSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            service: "",
            customService: "",
            address: "",
            whatsappNumber: "",
            contactNumber: "",
            workingHoursStart: "",
            workingHoursEnd: "",
            workingDays: "",
            chargesPerHour: 0,
            qualityRating: 3,
            isNegotiable: false,
            profilePhoto: "",
            blockOfCity: "",
            officeAddress: "",
            experienceYears: null,
            gender: undefined,
            age: null,
            aadharNumber: "",
            email: "",
            website: "",
            tags: "",
        }
    })

    // Watch values for progress
    const watchedValues = form.watch()

    // Calculate completion progress
    const completionProgress = useMemo(() => {
        const fields = [
            { filled: !!watchedValues.name && watchedValues.name.length >= VALIDATION_LIMITS.NAME_MIN },
            { filled: !!watchedValues.service },
            { filled: !!watchedValues.address && watchedValues.address.length >= VALIDATION_LIMITS.ADDRESS_MIN },
            { filled: /^[6-9]\d{9}$/.test(watchedValues.whatsappNumber || '') },
            { filled: /^[6-9]\d{9}$/.test(watchedValues.contactNumber || '') },
            { filled: !!watchedValues.workingHoursStart },
            { filled: !!watchedValues.workingHoursEnd },
            { filled: !!watchedValues.workingDays },
            { filled: (watchedValues.chargesPerHour || 0) >= VALIDATION_LIMITS.CHARGES_MIN },
            { filled: watchedValues.qualityRating >= 1 },
        ]
        return Math.round((fields.filter(f => f.filled).length / fields.length) * 100)
    }, [watchedValues])

    // Phone input handler - digits only
    const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'whatsappNumber' | 'contactNumber') => {
        const value = e.target.value.replace(/\D/g, '').slice(0, VALIDATION_LIMITS.PHONE_LENGTH)
        form.setValue(field, value, { shouldValidate: true })
    }

    // Charges input handler
    const handleChargesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '')
        const num = Math.min(parseInt(value) || 0, VALIDATION_LIMITS.CHARGES_MAX)
        form.setValue('chargesPerHour', num, { shouldValidate: true })
    }

    // Aadhar input handler
    const handleAadharInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, VALIDATION_LIMITS.AADHAR_LENGTH)
        form.setValue('aadharNumber', value, { shouldValidate: true })
    }

    // Service change handler
    const handleServiceChange = (value: string) => {
        if (value === "custom") {
            setShowCustomService(true)
            form.setValue("service", "other")
        } else {
            setShowCustomService(false)
            form.setValue("service", value)
            form.setValue("customService", "")
        }
    }

    // Handle profile photo upload
    const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a PNG, JPEG, or HEIC image")
            return
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be less than 2MB")
            return
        }

        setUploadingPhoto(true)

        try {
            // Create FormData for upload
            const formData = new FormData()
            formData.append("file", file)
            formData.append("type", "service-profile")

            // Upload to our API
            const response = await fetch("/api/upload-image", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to upload image")
            }

            const result = await response.json()
            setProfilePhotoUrl(result.url)
            form.setValue("profilePhoto", result.url)
            toast.success("Photo uploaded successfully!")
        } catch (error) {
            console.error("[AddServiceDialog] Photo upload error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to upload photo")
        } finally {
            setUploadingPhoto(false)
        }
    }, [form])

    // Remove profile photo
    const removePhoto = useCallback(() => {
        setProfilePhotoUrl(null)
        form.setValue("profilePhoto", "")
    }, [form])

    // Handle form submission
    const onSubmit = async (data: AddServiceFormData) => {
        setIsSubmitting(true)

        try {
            // Combine working hours into single string for API
            // Format: "9 AM - 6 PM, Mon-Sat"
            const workingHours = `${data.workingHoursStart} - ${data.workingHoursEnd}, ${data.workingDays}`

            // Process tags (comma-separated -> array)
            const processedData: any = {
                ...data,
                profilePhoto: profilePhotoUrl || undefined,
                workingHours, // Combined working hours string
                tags: data.tags
                    ? data.tags.split(",").map(t => t.trim()).filter(Boolean)
                    : [],
            }

            // Remove separate working hours fields (API expects combined workingHours)
            delete processedData.workingHoursStart
            delete processedData.workingHoursEnd
            delete processedData.workingDays

            // Clean up empty optional fields
            if (!processedData.email) delete processedData.email
            if (!processedData.website) delete processedData.website
            if (!processedData.aadharNumber) delete processedData.aadharNumber
            if (!processedData.experienceYears) delete processedData.experienceYears
            if (!processedData.age) delete processedData.age
            if (!processedData.gender) delete processedData.gender

            // Submit to API
            const response = await fetch("/api/services", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(processedData),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit service")
            }

            // Success!
            setSubmitSuccess(true)
            toast.success("Service submitted for review!")

            // Reset form immediately after success
            form.reset()
            setProfilePhotoUrl(null)
            setCurrentTab("required")

            // Close dialog after a short delay
            setTimeout(() => {
                setSubmitSuccess(false)
                onSuccess?.()
                onClose()
            }, 2000)

        } catch (error) {
            console.error("[AddServiceDialog] Submit error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to submit service")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Check if required tab is complete
    const isRequiredComplete = () => {
        const values = form.getValues()
        return !!(
            values.name &&
            values.service &&
            values.address &&
            values.whatsappNumber &&
            values.contactNumber &&
            values.workingHoursStart &&
            values.workingHoursEnd &&
            values.workingDays &&
            values.chargesPerHour > 0 &&
            values.qualityRating > 0
        )
    }

    // Render star rating selector
    const renderQualityRating = () => {
        const rating = form.watch("qualityRating")
        const qualityInfo = SERVICE_QUALITY_LEVELS.find((q: QualityLevel) => q.value === rating)

        return (
            <div className="space-y-2">
                <Label>Quality of Work Rating *</Label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => form.setValue("qualityRating", star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-8 w-8 ${star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                {qualityInfo && (
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">{qualityInfo.label}</span>
                        {" — "}{qualityInfo.description}
                    </p>
                )}
            </div>
        )
    }

    // If success, show confirmation
    if (submitSuccess) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Service Submitted!
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Your service request has been submitted for review.
                            It will be visible once approved by our team.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-3xl max-h-[85vh] sm:max-h-[90vh] p-0 rounded-lg overflow-hidden">
                <DialogHeader className="px-5 sm:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Briefcase className="h-5 w-5 sm:h-5 sm:w-5 text-red-600" />
                        Add Your Service
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        List your service for free! Fill in your details below.
                        No sign-up required.
                    </DialogDescription>
                    {/* Progress Bar */}
                    <div className="mt-2 sm:mt-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px] sm:text-xs">
                            <span className="text-gray-600">Form Completion</span>
                            <span className={`font-medium ${completionProgress === 100 ? 'text-green-600' :
                                completionProgress >= 70 ? 'text-yellow-600' : 'text-gray-600'
                                }`}>
                                {completionProgress}%
                            </span>
                        </div>
                        <Progress
                            value={completionProgress}
                            className="h-1.5 sm:h-2"
                        />
                    </div>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <fieldset disabled={isSubmitting} className="disabled:opacity-60">
                        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                            <div className="px-5 sm:px-8">
                                <TabsList className="grid w-full grid-cols-2 bg-gray-200/80 h-9 sm:h-10">
                                    <TabsTrigger value="required" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Required
                                        {isRequiredComplete() && (
                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="optional" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Optional
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[45vh] sm:h-[50vh] px-5 sm:px-8 py-3 sm:py-4">
                                {/* REQUIRED TAB */}
                                <TabsContent value="required" className="mt-0 space-y-4 sm:space-y-5">
                                    {/* Profile Photo */}
                                    <div className="space-y-2">
                                        <Label className="text-xs sm:text-sm">Profile Photo</Label>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-2 border-dashed border-gray-300">
                                                {profilePhotoUrl ? (
                                                    <AvatarImage src={profilePhotoUrl} alt="Profile" />
                                                ) : (
                                                    <AvatarFallback className="bg-gray-100">
                                                        <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="flex flex-col gap-1.5 sm:gap-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={uploadingPhoto}
                                                        onClick={() => document.getElementById('profile-photo-input')?.click()}
                                                        className="shadow-sm bg-white hover:bg-gray-50 h-8 text-xs sm:text-sm"
                                                    >
                                                        {uploadingPhoto ? (
                                                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                                                        ) : (
                                                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                        )}
                                                        {uploadingPhoto ? "Uploading..." : "Upload"}
                                                    </Button>
                                                    {profilePhotoUrl && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={removePhoto}
                                                            className="h-8 text-xs sm:text-sm"
                                                        >
                                                            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-gray-500">
                                                    PNG, JPEG, or HEIC. Max 2MB.
                                                </p>
                                            </div>
                                            <input
                                                id="profile-photo-input"
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Full Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            {...form.register("name")}
                                            placeholder="e.g., Rajesh Kumar"
                                            className="text-sm h-9 sm:h-10"
                                        />
                                        {form.formState.errors.name && (
                                            <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {form.formState.errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Service Type */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1 text-xs sm:text-sm">
                                            <Wrench className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Service Type *
                                        </Label>
                                        <Select
                                            value={showCustomService ? "custom" : form.watch("service")}
                                            onValueChange={handleServiceChange}
                                        >
                                            <SelectTrigger className="bg-white shadow-sm shadow-red-100/50 border border-gray-100 focus:ring-1 focus:ring-red-200 h-9 sm:h-10 text-sm">
                                                <SelectValue placeholder="Select your service" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white shadow-lg shadow-red-100/30 border border-gray-100 z-50 max-h-[250px] w-[var(--radix-select-trigger-width)]">
                                                {SERVICE_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.slug} value={cat.slug} className="cursor-pointer hover:bg-red-50 text-sm">
                                                        <span className="flex items-center gap-2">
                                                            <span>{cat.icon}</span>
                                                            <span>{cat.label}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom" className="cursor-pointer hover:bg-red-50 border-t border-gray-100 mt-1 pt-2 text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <PlusCircle className="h-4 w-4 text-red-600" />
                                                        <span className="text-red-600 font-medium">Other / Custom Service</span>
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {showCustomService && (
                                            <Input
                                                placeholder="Enter custom service (letters only)"
                                                value={form.watch("customService") || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '').slice(0, 20)
                                                    form.setValue("customService", val)
                                                }}
                                                maxLength={20}
                                                className="mt-2 shadow-sm border border-gray-100 h-9 sm:h-10 text-sm"
                                            />
                                        )}
                                        {form.formState.errors.service && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {form.formState.errors.service.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="address" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Address *
                                        </Label>
                                        <Textarea
                                            id="address"
                                            {...form.register("address")}
                                            placeholder="Your home or office address"
                                            rows={2}
                                            className="text-sm min-h-[60px] sm:min-h-[70px]"
                                        />
                                        {form.formState.errors.address && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {form.formState.errors.address.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Phone Numbers */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="whatsappNumber" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                                <span className="hidden sm:inline">WhatsApp Number *</span>
                                                <span className="sm:hidden">WhatsApp *</span>
                                            </Label>
                                            <Input
                                                id="whatsappNumber"
                                                {...form.register("whatsappNumber")}
                                                placeholder="9876543210"
                                                maxLength={10}
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                            {form.formState.errors.whatsappNumber && (
                                                <p className="text-xs text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span className="truncate">{form.formState.errors.whatsappNumber.message}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="contactNumber" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="hidden sm:inline">Contact Number *</span>
                                                <span className="sm:hidden">Contact *</span>
                                            </Label>
                                            <Input
                                                id="contactNumber"
                                                {...form.register("contactNumber")}
                                                placeholder="9876543210"
                                                maxLength={10}
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                            {form.formState.errors.contactNumber && (
                                                <p className="text-xs text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span className="truncate">{form.formState.errors.contactNumber.message}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Working Hours */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label className="flex items-center gap-1 text-xs sm:text-sm">
                                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Working Hours *
                                        </Label>
                                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-500">From</Label>
                                                <Select
                                                    value={form.watch("workingHoursStart") || ""}
                                                    onValueChange={(value) => form.setValue("workingHoursStart", value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger className="bg-white shadow-sm border border-gray-100 h-9 sm:h-10 text-xs sm:text-sm">
                                                        <SelectValue placeholder="Start" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white shadow-lg border border-gray-100 z-50">
                                                        {WORKING_HOURS_START.map((time) => (
                                                            <SelectItem key={time} value={time} className="cursor-pointer hover:bg-gray-100 text-xs sm:text-sm">
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-500">To</Label>
                                                <Select
                                                    value={form.watch("workingHoursEnd") || ""}
                                                    onValueChange={(value) => form.setValue("workingHoursEnd", value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger className="bg-white shadow-sm border border-gray-100 h-9 sm:h-10 text-xs sm:text-sm">
                                                        <SelectValue placeholder="End" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white shadow-lg border border-gray-100 z-50">
                                                        {WORKING_HOURS_END.map((time) => (
                                                            <SelectItem key={time} value={time} className="cursor-pointer hover:bg-gray-100 text-xs sm:text-sm">
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-500">Days</Label>
                                                <Select
                                                    value={form.watch("workingDays") || ""}
                                                    onValueChange={(value) => form.setValue("workingDays", value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger className="bg-white shadow-sm border border-gray-100 h-9 sm:h-10 text-xs sm:text-sm">
                                                        <SelectValue placeholder="Days" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white shadow-lg border border-gray-100 z-50">
                                                        {WORKING_DAYS.map((day) => (
                                                            <SelectItem key={day.value} value={day.value} className="cursor-pointer hover:bg-gray-100 text-xs sm:text-sm">
                                                                {day.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {(form.formState.errors.workingHoursStart || form.formState.errors.workingHoursEnd || form.formState.errors.workingDays) && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Please select all working hour options
                                            </p>
                                        )}
                                    </div>

                                    {/* Charges */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="chargesPerHour" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Charges per Hour (₹) *
                                        </Label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <div className="flex-1 relative">
                                                <IndianRupee className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                <Input
                                                    id="chargesPerHour"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={form.watch("chargesPerHour") || ''}
                                                    onChange={handleChargesInput}
                                                    placeholder="500"
                                                    className="pl-7 sm:pl-9 h-9 sm:h-10 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
                                                <Switch
                                                    id="isNegotiable"
                                                    checked={form.watch("isNegotiable") || false}
                                                    onCheckedChange={(checked: boolean) => form.setValue("isNegotiable", checked)}
                                                />
                                                <Label htmlFor="isNegotiable" className={`text-xs sm:text-sm font-medium cursor-pointer ${form.watch("isNegotiable") ? 'text-green-600' : 'text-gray-500'
                                                    }`}>
                                                    {form.watch("isNegotiable") ? '✓ Negotiable' : 'Negotiable'}
                                                </Label>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Min: ₹{VALIDATION_LIMITS.CHARGES_MIN} • Max: ₹{VALIDATION_LIMITS.CHARGES_MAX.toLocaleString()}
                                        </p>
                                        {form.formState.errors.chargesPerHour && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {form.formState.errors.chargesPerHour.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Quality Rating */}
                                    {renderQualityRating()}
                                </TabsContent>

                                {/* OPTIONAL TAB */}
                                <TabsContent value="optional" className="mt-0 space-y-3 sm:space-y-5">
                                    <Alert className="bg-blue-50 border-blue-200 py-2 sm:py-3">
                                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                        <AlertDescription className="text-xs sm:text-sm text-blue-800">
                                            These fields are optional. Adding more details helps customers find you better!
                                        </AlertDescription>
                                    </Alert>

                                    {/* Block of City */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="blockOfCity" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Block / Area of City
                                        </Label>
                                        <Input
                                            id="blockOfCity"
                                            {...form.register("blockOfCity")}
                                            placeholder="e.g., Gandhi Nagar, Near Bus Stand"
                                            maxLength={VALIDATION_LIMITS.BLOCK_MAX}
                                            className="h-9 sm:h-10 text-sm"
                                        />
                                    </div>

                                    {/* Office Address */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="officeAddress" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Office Address (if different)
                                        </Label>
                                        <Textarea
                                            id="officeAddress"
                                            {...form.register("officeAddress")}
                                            placeholder="Your shop or office address"
                                            rows={2}
                                            maxLength={VALIDATION_LIMITS.OFFICE_MAX}
                                            className="text-sm min-h-[60px] sm:min-h-[70px]"
                                        />
                                    </div>

                                    {/* Experience, Gender, Age */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="experienceYears" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="hidden sm:inline">Experience</span>
                                                <span className="sm:hidden">Exp</span>
                                            </Label>
                                            <Input
                                                id="experienceYears"
                                                type="number"
                                                {...form.register("experienceYears", { valueAsNumber: true })}
                                                placeholder="5"
                                                min={0}
                                                max={VALIDATION_LIMITS.EXP_MAX}
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                                Gender
                                            </Label>
                                            <Select
                                                value={form.watch("gender") || ""}
                                                onValueChange={(value) => form.setValue("gender", value as any)}
                                            >
                                                <SelectTrigger className="bg-white shadow-sm border-0 h-9 sm:h-10 text-xs sm:text-sm">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white shadow-lg border-0 z-50">
                                                    <SelectItem value="male" className="cursor-pointer hover:bg-gray-100">
                                                        <span className="flex items-center gap-2">
                                                            👨 Male
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="female" className="cursor-pointer hover:bg-gray-100">
                                                        <span className="flex items-center gap-2">
                                                            👩 Female
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="other" className="cursor-pointer hover:bg-gray-100">
                                                        <span className="flex items-center gap-2">
                                                            🧑 Other
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="age" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                                Age
                                            </Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                {...form.register("age", { valueAsNumber: true })}
                                                placeholder="35"
                                                min={VALIDATION_LIMITS.AGE_MIN}
                                                max={VALIDATION_LIMITS.AGE_MAX}
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Aadhar Number */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="aadharNumber" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Aadhar Number (for verification)
                                        </Label>
                                        <Input
                                            id="aadharNumber"
                                            value={form.watch("aadharNumber") || ""}
                                            onChange={handleAadharInput}
                                            placeholder="XXXX XXXX XXXX"
                                            maxLength={VALIDATION_LIMITS.AADHAR_LENGTH}
                                            className="h-9 sm:h-10 text-sm"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Kept private. Helps verify your identity. (12 digits)
                                        </p>
                                        {form.formState.errors.aadharNumber && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {form.formState.errors.aadharNumber.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email & Website */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...form.register("email")}
                                                placeholder="your@email.com"
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                            {form.formState.errors.email && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {form.formState.errors.email.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="website" className="flex items-center gap-1 text-xs sm:text-sm">
                                                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                                                Website
                                            </Label>
                                            <Input
                                                id="website"
                                                {...form.register("website")}
                                                placeholder="https://yourwebsite.com"
                                                className="h-9 sm:h-10 text-sm"
                                            />
                                            {form.formState.errors.website && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {form.formState.errors.website.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="tags" className="flex items-center gap-1 text-xs sm:text-sm">
                                            <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Tags / Skills
                                        </Label>
                                        <Textarea
                                            id="tags"
                                            {...form.register("tags")}
                                            placeholder="e.g., plumbing repair, bathroom fitting, emergency service"
                                            rows={2}
                                            maxLength={VALIDATION_LIMITS.TAGS_MAX}
                                            className="text-sm min-h-[60px] sm:min-h-[70px]"
                                        />
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Comma-separated. Helps customers find your specific skills.
                                        </p>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>

                        <DialogFooter className="px-5 sm:px-8 py-3 sm:py-4 border-t bg-gray-50 flex flex-col-reverse sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto gap-1.5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            >
                                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isRequiredComplete()}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 gap-1.5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Submit Service
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    )
}
