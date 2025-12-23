"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
    Loader2, AlertCircle, Info, FileText, Tag, Phone, Mail,
    Globe, Clock, X, Save, Building2, CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Days of the week
const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

// Time options for dropdown (30 min intervals)
const TIME_OPTIONS = [
    "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
    "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
    "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
    "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
]

// Improved Schema with strict validation
const EditListingSchema = z.object({
    description: z.string()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .or(z.literal("")),
    tags: z.string()
        .max(200, "Tags cannot exceed 200 characters")
        .optional(),
    phone: z.string()
        .regex(/^$|^[0-9]{10}$/, "Phone must be exactly 10 digits")
        .optional(),
    email: z.string()
        .email("Please enter a valid email address")
        .optional()
        .or(z.literal("")),
    website: z.string()
        .regex(/^$|^https?:\/\/.+\..+/, "Please enter a valid URL (starting with http:// or https://)")
        .optional()
        .or(z.literal("")),
})

type EditListingFormData = z.infer<typeof EditListingSchema>

// Opening hours type
interface DayHours {
    isOpen: boolean
    openTime: string
    closeTime: string
}

interface EditListingDialogProps {
    open: boolean
    onClose: () => void
    listing: any
    onSuccess: () => void
}

// Parse existing opening hours from string array
function parseOpeningHours(hoursArray?: string[]): Record<string, DayHours> {
    const defaultHours: Record<string, DayHours> = {}

    DAYS_OF_WEEK.forEach(day => {
        defaultHours[day] = { isOpen: false, openTime: "9:00 AM", closeTime: "6:00 PM" }
    })

    if (!hoursArray || !Array.isArray(hoursArray)) return defaultHours

    hoursArray.forEach(hourString => {
        const match = hourString.match(/^(\w+):\s*(.+)$/)
        if (match) {
            const [, day, times] = match
            const normalizedDay = DAYS_OF_WEEK.find(d =>
                d.toLowerCase() === day.toLowerCase()
            )

            if (normalizedDay) {
                if (times.toLowerCase() === 'closed') {
                    defaultHours[normalizedDay] = { isOpen: false, openTime: "9:00 AM", closeTime: "6:00 PM" }
                } else {
                    const timeMatch = times.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
                    if (timeMatch) {
                        defaultHours[normalizedDay] = {
                            isOpen: true,
                            openTime: timeMatch[1].trim(),
                            closeTime: timeMatch[2].trim()
                        }
                    }
                }
            }
        }
    })

    return defaultHours
}

// Format hours back to string array
function formatOpeningHours(hours: Record<string, DayHours>): string[] {
    return DAYS_OF_WEEK.map(day => {
        const dayHours = hours[day]
        if (!dayHours?.isOpen) {
            return `${day}: Closed`
        }
        return `${day}: ${dayHours.openTime} - ${dayHours.closeTime}`
    })
}

export function EditListingDialog({ open, onClose, listing, onSuccess }: EditListingDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openingHours, setOpeningHours] = useState<Record<string, DayHours>>(() =>
        parseOpeningHours(listing.openingHours)
    )

    const form = useForm<EditListingFormData>({
        resolver: zodResolver(EditListingSchema),
        defaultValues: {
            description: listing.description || "",
            tags: listing.tags?.join(", ") || "",
            phone: listing.phone?.replace(/\D/g, '').slice(-10) || "",
            email: listing.email || "",
            website: listing.website || "",
        }
    })

    // Reset form when listing changes
    useEffect(() => {
        if (open && listing) {
            setOpeningHours(parseOpeningHours(listing.openingHours))
            form.reset({
                description: listing.description || "",
                tags: listing.tags?.join(", ") || "",
                phone: listing.phone?.replace(/\D/g, '').slice(-10) || "",
                email: listing.email || "",
                website: listing.website || "",
            })
        }
    }, [open, listing, form])

    const updateDayHours = (day: string, field: keyof DayHours, value: any) => {
        setOpeningHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }))
    }

    const onSubmit = async (data: EditListingFormData) => {
        setIsSubmitting(true)

        try {
            // Process data
            const processedData: any = {
                description: data.description?.trim() || null,
                phone: data.phone?.trim() || null,
                email: data.email?.trim() || null,
                website: data.website?.trim() || null,
            }

            // Process tags (comma-separated -> array)
            if (data.tags) {
                processedData.tags = data.tags
                    .split(",")
                    .map(t => t.trim())
                    .filter(Boolean)
                    .slice(0, 10) // Max 10 tags
            }

            // Format opening hours
            processedData.openingHours = formatOpeningHours(openingHours)

            // Call API to update listing
            const response = await fetch(`/api/listings/${listing.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(processedData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to update listing")
            }

            toast.success("Listing updated successfully!")
            onSuccess()
            onClose()
        } catch (error) {
            console.error("[EditListingDialog] Error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update listing")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header */}
                <DialogHeader className="p-4 sm:p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-red-50 flex items-center justify-center">
                            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl">Edit Listing</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm mt-0.5">
                                Update your business information below
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                    <div className="p-4 sm:p-6 space-y-5">
                        {/* Info Alert */}
                        <Alert className="bg-blue-50 border-blue-100">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-xs sm:text-sm text-blue-800">
                                Business name, images, and reviews are managed separately.
                            </AlertDescription>
                        </Alert>

                        {/* Description Section */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                {...form.register("description")}
                                placeholder="Describe your business in detail..."
                                rows={4}
                                maxLength={500}
                                className="resize-none text-sm"
                            />
                            <div className="flex items-center justify-between">
                                {form.formState.errors.description ? (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {form.formState.errors.description.message}
                                    </p>
                                ) : (
                                    <span className="text-xs text-gray-400">Min 10 characters</span>
                                )}
                                <span className={cn(
                                    "text-xs",
                                    (form.watch("description")?.length || 0) > 450 ? "text-orange-500" : "text-gray-400"
                                )}>
                                    {form.watch("description")?.length || 0}/500
                                </span>
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className="space-y-2">
                            <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium">
                                <Tag className="h-4 w-4 text-gray-500" />
                                Tags
                                <Badge variant="outline" className="text-[10px] font-normal">Max 10</Badge>
                            </Label>
                            <Input
                                id="tags"
                                {...form.register("tags")}
                                placeholder="e.g., fast delivery, outdoor seating, parking"
                                maxLength={200}
                                className="text-sm"
                            />
                            <p className="text-xs text-gray-400">
                                Separate with commas • Helps customers find your business
                            </p>
                        </div>

                        <Separator />

                        {/* Contact Information Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-gray-900">Contact Information</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        Phone
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="phone"
                                            {...form.register("phone")}
                                            placeholder="9876543210"
                                            maxLength={10}
                                            className={cn(
                                                "text-sm pl-12",
                                                form.formState.errors.phone && "border-red-300 focus:ring-red-500"
                                            )}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                            +91
                                        </span>
                                    </div>
                                    {form.formState.errors.phone && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...form.register("email")}
                                        placeholder="business@example.com"
                                        className={cn(
                                            "text-sm",
                                            form.formState.errors.email && "border-red-300 focus:ring-red-500"
                                        )}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
                                    <Globe className="h-4 w-4 text-gray-500" />
                                    Website
                                </Label>
                                <Input
                                    id="website"
                                    {...form.register("website")}
                                    placeholder="https://www.yourbusiness.com"
                                    className={cn(
                                        "text-sm",
                                        form.formState.errors.website && "border-red-300 focus:ring-red-500"
                                    )}
                                />
                                {form.formState.errors.website && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {form.formState.errors.website.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Opening Hours Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                Opening Hours
                            </h3>

                            <div className="space-y-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <Card key={day} className={cn(
                                        "border transition-colors",
                                        openingHours[day]?.isOpen
                                            ? "border-gray-200 bg-white"
                                            : "border-gray-100 bg-gray-50"
                                    )}>
                                        <CardContent className="p-2.5 sm:p-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                {/* Day Toggle */}
                                                <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[120px]">
                                                    <span className={cn(
                                                        "text-sm font-medium w-20",
                                                        openingHours[day]?.isOpen ? "text-gray-900" : "text-gray-400"
                                                    )}>
                                                        {day.slice(0, 3)}
                                                    </span>
                                                    <Switch
                                                        checked={openingHours[day]?.isOpen}
                                                        onCheckedChange={(checked) => updateDayHours(day, 'isOpen', checked)}
                                                    />
                                                </div>

                                                {/* Time Selectors */}
                                                {openingHours[day]?.isOpen ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Select
                                                            value={openingHours[day]?.openTime}
                                                            onValueChange={(v) => updateDayHours(day, 'openTime', v)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs flex-1 max-w-[110px]">
                                                                <SelectValue placeholder="Open" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {TIME_OPTIONS.map(time => (
                                                                    <SelectItem key={time} value={time} className="text-xs">
                                                                        {time}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <span className="text-gray-400 text-xs">to</span>
                                                        <Select
                                                            value={openingHours[day]?.closeTime}
                                                            onValueChange={(v) => updateDayHours(day, 'closeTime', v)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs flex-1 max-w-[110px]">
                                                                <SelectValue placeholder="Close" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {TIME_OPTIONS.map(time => (
                                                                    <SelectItem key={time} value={time} className="text-xs">
                                                                        {time}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs text-gray-500">
                                                        Closed
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 order-1 sm:order-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
