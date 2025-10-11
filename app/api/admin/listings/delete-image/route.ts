import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminBucket, FieldValue } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
    try {
        const { listingId, imageUrl } = await request.json()

        if (!listingId || !imageUrl) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get Firebase Admin instances
        const db = getAdminDb()
        const bucket = getAdminBucket()

        // Extract storage path from URL
        // Supports both formats:
        // 1. https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
        // 2. https://storage.googleapis.com/{bucket}/{path}
        let storagePath: string | null = null

        try {
            const url = new URL(imageUrl)

            // Format 1: firebasestorage.googleapis.com
            if (url.hostname === 'firebasestorage.googleapis.com') {
                const pathMatch = url.pathname.match(/\/o\/(.+)/)
                if (pathMatch) {
                    storagePath = decodeURIComponent(pathMatch[1].split('?')[0])
                }
            }
            // Format 2: storage.googleapis.com
            else if (url.hostname === 'storage.googleapis.com') {
                // Path format: /{bucket}/{path}
                const pathParts = url.pathname.split('/')
                if (pathParts.length >= 3) {
                    storagePath = pathParts.slice(2).join('/')
                }
            }
        } catch (error) {
            console.error('Error parsing image URL:', error)
        }

        if (!storagePath) {
            return NextResponse.json(
                { error: 'Invalid storage URL format' },
                { status: 400 }
            )
        }

        // Delete from Firebase Storage
        try {
            const file = bucket.file(storagePath)
            await file.delete()
        } catch (storageError) {
            console.error('Storage deletion error (file may not exist):', storageError)
            // Continue to remove from Firestore even if storage deletion fails
        }

        // Update Firestore listing - remove photo URL
        await db.collection('listings').doc(listingId).update({
            photos: FieldValue.arrayRemove(imageUrl)
        })

        return NextResponse.json({
            success: true
        })
    } catch (error) {
        console.error('Error deleting image:', error)
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        )
    }
}