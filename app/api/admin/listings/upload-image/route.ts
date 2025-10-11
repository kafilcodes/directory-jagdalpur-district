import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminBucket, FieldValue } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('image') as File
        const listingId = formData.get('listingId') as string

        if (!file || !listingId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            )
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            )
        }

        // Get Firebase Admin instances
        const db = getAdminDb()
        const bucket = getAdminBucket()

        // Upload to Firebase Storage
        const timestamp = Date.now()
        const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const storagePath = `listings/${listingId}/${filename}`

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Storage
        const storageFile = bucket.file(storagePath)
        await storageFile.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        })

        // Make file publicly accessible
        await storageFile.makePublic()

        // Get public URL
        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

        // Update Firestore listing with new photo URL
        await db.collection('listings').doc(listingId).update({
            photos: FieldValue.arrayUnion(downloadURL)
        })

        return NextResponse.json({
            success: true,
            url: downloadURL
        })
    } catch (error) {
        console.error('Error uploading image:', error)
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        )
    }
}