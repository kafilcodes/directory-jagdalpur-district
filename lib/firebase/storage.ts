/**
 * Firebase Storage Service for Image Uploads
 * Handles secure image upload to Firebase Storage
 * Follows /images/{userId}/{listingId}/ structure from Database Modeling.md
 * Server-side only - uses Admin SDK
 */

import "server-only"
import { getAdminBucket } from "@/lib/firebase/admin"
import { Readable } from "stream"

export interface UploadImageResult {
    success: boolean
    url?: string
    path?: string
    error?: string
}

/**
 * Upload a single image to Firebase Storage
 * @param imageBuffer - Image file buffer
 * @param userId - User ID for path organization
 * @param listingId - Listing ID for path organization
 * @param filename - Original filename
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns Upload result with CDN URL
 */
export async function uploadImageToStorage(
    imageBuffer: Buffer,
    userId: string,
    listingId: string,
    filename: string,
    contentType: string
): Promise<UploadImageResult> {
    try {
        const bucket = getAdminBucket()

        // Generate unique filename with timestamp
        const timestamp = Date.now()
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `images/${userId}/${listingId}/${timestamp}_${sanitizedFilename}`

        const file = bucket.file(storagePath)

        // Upload with metadata
        await file.save(imageBuffer, {
            metadata: {
                contentType,
                metadata: {
                    uploadedBy: userId,
                    listingId: listingId,
                    originalName: filename,
                    uploadedAt: new Date().toISOString(),
                }
            },
            public: true, // Make publicly accessible
            validation: 'md5',
        })

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

        return {
            success: true,
            url: publicUrl,
            path: storagePath,
        }
    } catch (error: any) {
        console.error('Image upload error:', error)
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        }
    }
}

/**
 * Upload multiple images to Firebase Storage
 * @param images - Array of image buffers with metadata
 * @param userId - User ID
 * @param listingId - Listing ID
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
    images: Array<{
        buffer: Buffer
        filename: string
        contentType: string
    }>,
    userId: string,
    listingId: string
): Promise<UploadImageResult[]> {
    const uploadPromises = images.map(img =>
        uploadImageToStorage(img.buffer, userId, listingId, img.filename, img.contentType)
    )

    return await Promise.all(uploadPromises)
}

/**
 * Delete image from Firebase Storage
 * @param imagePath - Full storage path of the image
 * @returns Success status
 */
export async function deleteImageFromStorage(
    imagePath: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const bucket = getAdminBucket()
        const file = bucket.file(imagePath)

        await file.delete()

        return { success: true }
    } catch (error: any) {
        console.error('Image deletion error:', error)
        return {
            success: false,
            error: error.message || 'Failed to delete image'
        }
    }
}

/**
 * Delete all images for a listing
 * @param userId - User ID
 * @param listingId - Listing ID
 * @returns Success status
 */
export async function deleteAllListingImages(
    userId: string,
    listingId: string
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
        const bucket = getAdminBucket()
        const prefix = `images/${userId}/${listingId}/`

        const [files] = await bucket.getFiles({ prefix })

        if (files.length === 0) {
            return { success: true, deletedCount: 0 }
        }

        await Promise.all(files.map(file => file.delete()))

        return { success: true, deletedCount: files.length }
    } catch (error: any) {
        console.error('Bulk image deletion error:', error)
        return {
            success: false,
            error: error.message || 'Failed to delete images'
        }
    }
}
