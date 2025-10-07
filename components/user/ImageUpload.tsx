/**
 * Image Upload Component
 * Drag & Drop + Click to Upload
 * Validation: 1-20 images, max 3MB each, JPEG/PNG/WebP only
 * Follows Design System & Principles from context
 */

"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Upload,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedImage {
    id: string
    file: File
    localUrl: string
    size: number
    type: string
    uploadProgress?: number
    error?: string
}

interface ImageUploadProps {
    images: UploadedImage[]
    onImagesChange: (images: UploadedImage[]) => void
    maxImages?: number
    maxSizePerImage?: number // in bytes
    disabled?: boolean
    className?: string
}

const MAX_IMAGES = 20
const MAX_SIZE_PER_IMAGE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function ImageUpload({
    images,
    onImagesChange,
    maxImages = MAX_IMAGES,
    maxSizePerImage = MAX_SIZE_PER_IMAGE,
    disabled = false,
    className,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) {
            setIsDragging(true)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (disabled) return

        const files = Array.from(e.dataTransfer.files)
        processFiles(files)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || disabled) return
        const files = Array.from(e.target.files)
        processFiles(files)
    }

    const processFiles = (files: File[]) => {
        setError(null)

        // Check if adding these files would exceed max
        if (images.length + files.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`)
            return
        }

        const validFiles: UploadedImage[] = []
        const errors: string[] = []

        for (const file of files) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Invalid type (only JPEG, PNG, WebP allowed)`)
                continue
            }

            // Validate file size
            if (file.size > maxSizePerImage) {
                const sizeMB = (maxSizePerImage / (1024 * 1024)).toFixed(1)
                errors.push(`${file.name}: Exceeds ${sizeMB}MB limit`)
                continue
            }

            // Create preview URL
            const localUrl = URL.createObjectURL(file)

            validFiles.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                localUrl,
                size: file.size,
                type: file.type,
            })
        }

        if (errors.length > 0) {
            setError(errors.join('; '))
        }

        if (validFiles.length > 0) {
            onImagesChange([...images, ...validFiles])
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = (imageId: string) => {
        const image = images.find(img => img.id === imageId)
        if (image) {
            URL.revokeObjectURL(image.localUrl)
        }
        onImagesChange(images.filter(img => img.id !== imageId))
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const totalSize = images.reduce((sum, img) => sum + img.size, 0)
    const remainingSlots = maxImages - images.length

    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            {images.length < maxImages && (
                <Card
                    className={cn(
                        "border-2 border-dashed transition-all cursor-pointer",
                        isDragging
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-gray-400",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                                isDragging ? "bg-red-100" : "bg-gray-100"
                            )}
                        >
                            <Upload
                                className={cn(
                                    "h-8 w-8",
                                    isDragging ? "text-red-600" : "text-gray-400"
                                )}
                            />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upload Images
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                            Drag and drop images here, or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                            JPEG, PNG, WebP • Max 3MB each • {remainingSlots} of {maxImages} slots remaining
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALLOWED_TYPES.join(',')}
                            onChange={handleFileSelect}
                            disabled={disabled}
                            className="hidden"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <Alert variant="destructive" className="border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Info Banner */}
            {images.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-gray-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {images.length} image{images.length !== 1 ? 's' : ''} selected
                            </p>
                            <p className="text-xs text-gray-600">
                                Total size: {formatFileSize(totalSize)}
                            </p>
                        </div>
                    </div>
                    {images.length === maxImages && (
                        <Badge className="bg-emerald-500">Maximum reached</Badge>
                    )}
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                                <Image
                                    src={image.localUrl}
                                    alt={`Upload ${index + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                    className="object-cover"
                                />
                                {/* First Image Badge */}
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge className="bg-red-500 text-white text-xs">
                                            Primary
                                        </Badge>
                                    </div>
                                )}
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeImage(image.id)
                                    }}
                                    disabled={disabled}
                                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                {/* Upload Progress (if uploading) */}
                                {image.uploadProgress !== undefined && image.uploadProgress < 100 && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        <p className="text-white text-sm font-medium">
                                            {image.uploadProgress}%
                                        </p>
                                    </div>
                                )}
                                {/* Upload Success */}
                                {image.uploadProgress === 100 && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* File Info */}
                            <p className="text-xs text-gray-600 mt-1 truncate">
                                {formatFileSize(image.size)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Requirements Notice */}
            {images.length === 0 && (
                <Alert className="border-gray-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Note:</strong> You must upload at least 1 image. The first image will be used as the primary listing photo.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
