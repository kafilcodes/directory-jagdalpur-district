"use client"

import { useState } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, AlertCircle, Lock, Info } from "lucide-react"

// Schema for editable fields only
// Non-editable: images, reviews, businessName/title
// Editable: description, tags, phone, email, website, openingHours
const EditListingSchema = z.object({
    description: z.string().min(10, "Description must be at least 10 characters").max(500).optional(),
    tags: z.string().optional(), // Comma-separated tags
    phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, "Invalid phone number").optional(),
    email: z.string().email("Invalid email address").optional(),
    website: z.string().url("Invalid URL").optional(),
    openingHours: z.string().optional(), // Newline-separated hours
})

type EditListingFormData = z.infer<typeof EditListingSchema>

interface EditListingDialogProps {
    open: boolean
    onClose: () => void
    listing: any
    onSuccess: () => void
}

export function EditListingDialog({ open, onClose, listing, onSuccess }: EditListingDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<EditListingFormData>({
        resolver: zodResolver(EditListingSchema),
        defaultValues: {
            description: listing.description || "",
            tags: listing.tags?.join(", ") || "",
            phone: listing.phone || "",
            email: listing.email || "",
            website: listing.website || "",
            openingHours: listing.openingHours?.join("\n") || "",
        }
    })

    const onSubmit = async (data: EditListingFormData) => {
        setIsSubmitting(true)

        try {
            // Process tags and hours
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
            }

            // Process opening hours (newline-separated -> array)
            if (data.openingHours) {
                processedData.openingHours = data.openingHours
                    .split("\n")
                    .map(h => h.trim())
                    .filter(Boolean)
            }

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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Listing</DialogTitle>
                    <DialogDescription>
                        Update your business information. Some fields are protected and cannot be edited.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Info notice */}
                    <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-900">
                            Update your business contact information and details below. Business name, images, and reviews are managed separately.
                        </AlertDescription>
                    </Alert>

                    {/* Description (Editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Describe your business..."
                            rows={4}
                            className="resize-none"
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {form.formState.errors.description.message}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            {form.watch("description")?.length || 0} / 500 characters
                        </p>
                    </div>

                    {/* Tags (Editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">
                            Tags
                        </Label>
                        <Input
                            id="tags"
                            {...form.register("tags")}
                            placeholder="e.g., fast delivery, outdoor seating, parking available"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Separate tags with commas
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone (Editable) */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                {...form.register("phone")}
                                placeholder="+91 1234567890"
                            />
                            {form.formState.errors.phone && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {form.formState.errors.phone.message}
                                </p>
                            )}
                        </div>

                        {/* Email (Editable) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...form.register("email")}
                                placeholder="business@example.com"
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Website (Editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            {...form.register("website")}
                            placeholder="https://www.example.com"
                        />
                        {form.formState.errors.website && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {form.formState.errors.website.message}
                            </p>
                        )}
                    </div>

                    {/* Opening Hours (Editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="openingHours">
                            Opening Hours
                        </Label>
                        <Textarea
                            id="openingHours"
                            {...form.register("openingHours")}
                            placeholder="Monday: 9:00 AM - 6:00 PM&#10;Tuesday: 9:00 AM - 6:00 PM&#10;..."
                            rows={7}
                            className="resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            One day per line (e.g., "Monday: 9:00 AM - 6:00 PM")
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
