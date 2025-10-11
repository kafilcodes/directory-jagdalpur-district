"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import type { Listing } from "@/stores/adminStore"
import { CATEGORIES } from "@/config/directory"
import { Loader2, Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import Image from "next/image"

interface ListingEditDialogProps {
    listing: Listing | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
}

export function ListingEditDialog({ listing, open, onOpenChange, onSave }: ListingEditDialogProps) {
    const [activeTab, setActiveTab] = useState<"basic" | "images">("basic")
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [localPhotos, setLocalPhotos] = useState<string[]>([])

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        phone: "",
        website: "",
        address: "",
        openingHours: "",
    })

    // Initialize form data when listing changes
    useEffect(() => {
        if (listing) {
            setFormData({
                name: listing.name || listing.title || listing.businessName || "",
                description: listing.description || "",
                phone: listing.phone || "",
                website: listing.website || "",
                address: typeof listing.address === 'string'
                    ? listing.address
                    : (listing.address as any)?.formattedAddress || "",
                openingHours: "",
            })
            setLocalPhotos(listing.photos || [])
            setHasChanges(false) // Reset changes when listing changes
        }
    }, [listing])

    // Track if form has changes
    useEffect(() => {
        if (!listing) {
            setHasChanges(false)
            return
        }

        const currentAddress = typeof listing.address === 'string'
            ? listing.address
            : (listing.address as any)?.formattedAddress || ""

        const changed =
            formData.name !== (listing.name || listing.title || listing.businessName || "") ||
            formData.description !== (listing.description || "") ||
            formData.phone !== (listing.phone || "") ||
            formData.website !== (listing.website || "") ||
            formData.address !== currentAddress ||
            formData.openingHours !== (listing.openingHours || "")

        setHasChanges(changed)
    }, [formData, listing])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!listing) return

        setIsSaving(true)
        try {
            // Build updates object with only changed fields
            const updates: Partial<Listing> = {}

            if (formData.name !== listing.name && formData.name.trim()) {
                updates.name = formData.name.trim()
            }
            if (formData.description !== listing.description) {
                updates.description = formData.description.trim()
            }
            if (formData.phone !== listing.phone) {
                updates.phone = formData.phone.trim()
            }
            if (formData.website !== listing.website) {
                updates.website = formData.website.trim()
            }

            const currentAddress = typeof listing.address === 'string'
                ? listing.address
                : (listing.address as any)?.formattedAddress || ""
            if (formData.address !== currentAddress) {
                updates.address = formData.address.trim()
            }

            if (formData.openingHours !== listing.openingHours) {
                updates.openingHours = formData.openingHours.trim()
            }

            // Only make API call if there are changes
            if (Object.keys(updates).length > 0) {
                const response = await fetch(`/api/admin/listings/${listing.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || 'Failed to update listing')
                }

                toast.success("Listing updated successfully")
                onSave()
                onOpenChange(false)
            } else {
                toast.info("No changes to save")
                // Don't close dialog if no changes
            }
        } catch (error) {
            console.error('Error updating listing:', error)
            toast.error(error instanceof Error ? error.message : "Failed to update listing")
        } finally {
            setIsSaving(false)
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!listing || !event.target.files || event.target.files.length === 0) return

        const file = event.target.files[0]

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB")
            return
        }

        setIsUploading(true)

        try {
            // Create form data
            const formData = new FormData()
            formData.append('image', file)
            formData.append('listingId', listing.id)

            // Upload via API
            const response = await fetch('/api/admin/listings/upload-image', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Upload failed')
            }

            const data = await response.json()

            // Update local photos state with the new image
            if (data.imageUrl) {
                setLocalPhotos(prev => [...prev, data.imageUrl])
            }

            toast.success("Image uploaded successfully")
            // Don't call onSave() to avoid page refresh

            // Reset file input
            if (event.target) {
                event.target.value = ''
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error(error instanceof Error ? error.message : "Failed to upload image")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteImage = async (imageUrl: string, index: number) => {
        if (!listing) return

        setDeletingImageIndex(index)

        try {
            // Delete via API
            const response = await fetch('/api/admin/listings/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: listing.id,
                    imageUrl: imageUrl,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Delete failed')
            }

            // Update local state to remove the deleted image
            setLocalPhotos(prev => prev.filter((_, i) => i !== index))

            toast.success("Image deleted successfully")
            // Don't call onSave() to avoid page refresh - just update local state
        } catch (error) {
            console.error('Error deleting image:', error)
            toast.error(error instanceof Error ? error.message : "Failed to delete image")
        } finally {
            setDeletingImageIndex(null)
        }
    }

    if (!listing) return null

    // Use local photos state instead of listing.photos directly
    const photos = localPhotos

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Listing</DialogTitle>
                    <DialogDescription>
                        Update listing information and manage images
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "basic" | "images")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="images">Images ({photos.length})</TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter business name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Enter description"
                                rows={4}
                            />
                        </div>

                        {/* <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => handleInputChange('category', value)}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.slug} value={cat.slug}>
                                            <div className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                <span>{cat.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div> */}

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+91 99999 99999"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Enter full address"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="openingHours">Opening Hours</Label>
                            <Input
                                id="openingHours"
                                value={formData.openingHours}
                                onChange={(e) => handleInputChange('openingHours', e.target.value)}
                                placeholder="e.g., Mon-Fri: 9AM-6PM"
                            />
                        </div>
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images" className="space-y-4 mt-4">
                        {/* Upload Section */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">Upload New Image</h3>
                                            <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Formats: JPG, PNG, WebP</p>
                                        </div>
                                        <Label htmlFor="image-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-sm font-medium">Choose File</span>
                                            </div>
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                                className="hidden"
                                            />
                                        </Label>
                                    </div>

                                    {isUploading && (
                                        <Alert>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <AlertDescription>
                                                Uploading image...
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Images Grid */}
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {photos.map((photo, index) => (
                                    <Card key={index} className="relative group overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="relative aspect-video">
                                                <Image
                                                    src={photo}
                                                    alt={`${listing.name} - Image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />

                                                {/* Delete overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteImage(photo, index)}
                                                        disabled={deletingImageIndex === index}
                                                    >
                                                        {deletingImageIndex === index ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <X className="h-4 w-4 mr-1" />
                                                                Delete
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Image number badge */}
                                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {index + 1}
                                                </div>

                                                {/* Delete icon button (always visible) */}
                                                <button
                                                    onClick={() => handleDeleteImage(photo, index)}
                                                    disabled={deletingImageIndex === index}
                                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                                    title="Delete image"
                                                >
                                                    {deletingImageIndex === index ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center text-gray-500">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-sm">No images uploaded yet</p>
                                        <p className="text-xs mt-1">Upload your first image to get started</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !formData.name.trim() || !hasChanges}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
