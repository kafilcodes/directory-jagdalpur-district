/**
 * Admin API: Delete User
 * Deletes user from both Firebase Authentication and Firestore
 * Uses Firebase Admin SDK via Cloud Functions (server-side only)
 * 
 * Security: Requires admin password verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminApp } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
    try {
        // 1. Verify admin authentication
        const adminPassword = request.headers.get('X-Admin-Password')
        const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASS || 'AdminDmt@9340897799'

        if (!adminPassword || adminPassword !== expectedPassword) {
            console.warn('❌ Unauthorized delete user attempt - Password mismatch')
            console.log('Received:', adminPassword ? '[REDACTED]' : 'null')
            return NextResponse.json(
                { error: 'Unauthorized: Invalid admin password' },
                { status: 401 }
            )
        }

        // 2. Parse request body
        const body = await request.json()
        const { userId } = body

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { error: 'userId is required and must be a string' },
                { status: 400 }
            )
        }

        console.log(`🗑️  Admin delete user request: ${userId}`)

        // 3. Delete from Firebase Authentication
        try {
            const app = getAdminApp()
            const auth = app.auth()
            await auth.deleteUser(userId)
            console.log(`✅ Deleted user from Firebase Auth: ${userId}`)
        } catch (authError: any) {
            // User might not exist in Auth (e.g., manual deletion)
            if (authError.code === 'auth/user-not-found') {
                console.warn(`⚠️  User not found in Auth: ${userId}`)
            } else {
                throw authError
            }
        }

        // 4. Delete from Firestore users collection
        const db = getAdminDb()
        try {
            await db.collection('users').doc(userId).delete()
            console.log(`✅ Deleted user doc from Firestore: ${userId}`)
        } catch (firestoreError: any) {
            console.warn(`⚠️  Error deleting user doc: ${firestoreError.message}`)
        }

        // 5. Find and delete user's listings
        let deletedListings = 0
        try {
            const listingsSnapshot = await db.collection('listings')
                .where('userId', '==', userId)
                .get()

            if (!listingsSnapshot.empty) {
                const batch = db.batch()
                listingsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref)
                })
                await batch.commit()
                deletedListings = listingsSnapshot.size
                console.log(`✅ Deleted ${deletedListings} listings for user: ${userId}`)
            }
        } catch (listingsError: any) {
            console.warn(`⚠️  Error deleting user listings: ${listingsError.message}`)
        }

        // 6. Optional: Delete user's payments records (for audit trail, might want to keep these)
        let deletedPayments = 0
        try {
            const paymentsSnapshot = await db.collection('listings_payments')
                .where('userId', '==', userId)
                .get()

            if (!paymentsSnapshot.empty) {
                const batch = db.batch()
                paymentsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref)
                })
                await batch.commit()
                deletedPayments = paymentsSnapshot.size
                console.log(`✅ Deleted ${deletedPayments} payment records for user: ${userId}`)
            }
        } catch (paymentsError: any) {
            console.warn(`⚠️  Error deleting user payments: ${paymentsError.message}`)
        }

        // 7. Return success response
        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
            details: {
                userId,
                deletedFromAuth: true,
                deletedFromFirestore: true,
                deletedListings,
                deletedPayments,
            },
        })

    } catch (error: any) {
        console.error('❌ Error in delete user API:', error)

        return NextResponse.json(
            {
                error: error.message || 'Internal server error',
                details: error.code || 'unknown_error',
            },
            { status: 500 }
        )
    }
}

// Prevent GET requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    )
}
