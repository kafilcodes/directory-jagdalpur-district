import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { uploadMultipleImages } from "@/lib/firebase/storage"

export const runtime = "nodejs"

// Max 10MB total for all images
const MAX_TOTAL_SIZE = 10 * 1024 * 1024

// Max 3MB per image
const MAX_IMAGE_SIZE = 3 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const formData = await req.formData()
        const listingId = formData.get('listingId') as string

        if (!listingId) {
            return NextResponse.json(
                { ok: false, error: "Listing ID is required" },
                { status: 400 }
            )
        }

        // Extract all files from formData
        const files: File[] = []
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image-') && value instanceof File) {
                files.push(value)
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No images provided" },
                { status: 400 }
            )
        }

        if (files.length > 20) {
            return NextResponse.json(
                { ok: false, error: "Maximum 20 images allowed" },
                { status: 400 }
            )
        }

        // Validate images
        let totalSize = 0
        const validatedImages: Array<{
            buffer: Buffer
            filename: string
            contentType: string
        }> = []

        for (const file of files) {
            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { ok: false, error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP allowed.` },
                    { status: 400 }
                )
            }

            // Check individual file size
            if (file.size > MAX_IMAGE_SIZE) {
                return NextResponse.json(
                    { ok: false, error: `Image ${file.name} exceeds 3MB limit` },
                    { status: 400 }
                )
            }

            totalSize += file.size

            // Convert to buffer
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            validatedImages.push({
                buffer,
                filename: file.name,
                contentType: file.type,
            })
        }

        // Check total size
        if (totalSize > MAX_TOTAL_SIZE) {
            return NextResponse.json(
                { ok: false, error: "Total size of all images exceeds 10MB" },
                { status: 400 }
            )
        }

        // Upload to Firebase Storage
        const uploadResults = await uploadMultipleImages(
            validatedImages,
            user.uid,
            listingId
        )

        // Check for any upload failures
        const failedUploads = uploadResults.filter(r => !r.success)
        if (failedUploads.length > 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Some images failed to upload",
                    failures: failedUploads
                },
                { status: 500 }
            )
        }

        // Return all uploaded URLs
        const urls = uploadResults.map(r => r.url).filter(Boolean) as string[]

        return NextResponse.json({
            ok: true,
            urls,
            count: urls.length,
        })

    } catch (error: any) {
        console.error('Image upload API error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "Failed to upload images" },
            { status: 500 }
        )
    }
}
