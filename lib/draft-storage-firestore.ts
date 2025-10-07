/**
 * Firestore Draft Storage Manager with Payment Protection
 * Handles saving and loading listing drafts from Firestore
 * Prevents clearing drafts after payment is completed
 */

import { getAdminDb } from "@/lib/firebase/admin"

const DRAFT_EXPIRY_DAYS = 30 // Drafts expire after 30 days

export interface ListingDraft {
    // User identification
    userId: string
    userEmail: string

    // Step 1: Business Info (Google Places Data)
    businessName: string
    placeId?: string
    googleMapsUrl?: string
    googlePlaceData?: any
    address?: string
    phone?: string
    website?: string
    category?: string
    photos?: string[] // Google Places photo URLs

    // Step 2: Payment
    selectedPlan: 'free' | 'sponsored' | 'featured'
    orderId?: string
    paymentId?: string
    paymentAmount?: number
    paymentCompleted: boolean // Critical flag to prevent clearing

    // Step 3: Creation metadata
    termsAccepted: boolean
    status: 'draft' | 'payment_pending' | 'payment_completed' | 'created'

    // Timestamps
    createdAt: number
    updatedAt: number
    expiresAt?: number
}

/**
 * Save draft to Firestore
 * Server-side function
 */
export async function saveDraftToFirestore(
    draft: Partial<ListingDraft>
): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
        if (!draft.userId) {
            return { success: false, error: 'User ID is required' }
        }

        const db = getAdminDb()
        const draftsRef = db.collection('listing_drafts')

        const now = Date.now()
        const expiresAt = now + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

        const draftData = {
            ...draft,
            updatedAt: now,
            expiresAt,
            ...(draft.createdAt ? {} : { createdAt: now }),
        }

        // Check if user already has a draft
        // Gracefully handle non-existent collection
        let existingDrafts
        try {
            existingDrafts = await draftsRef
                .where('userId', '==', draft.userId)
                .limit(5)
                .get()
        } catch (queryError: any) {
            // Collection doesn't exist yet - create first draft
            if (queryError.code === 5 || queryError.message?.includes('NOT_FOUND')) {
                const docRef = await draftsRef.add(draftData)
                return { success: true, draftId: docRef.id }
            }
            throw queryError
        }

        // Filter out 'created' status drafts in memory
        const activeDrafts = existingDrafts.docs.filter(doc => {
            const data = doc.data() as ListingDraft
            return data.status !== 'created'
        })

        let draftId: string

        if (activeDrafts.length > 0) {
            // Update existing draft
            const existingDraft = activeDrafts[0]
            draftId = existingDraft.id
            await draftsRef.doc(draftId).update(draftData)
        } else {
            // Create new draft
            const docRef = await draftsRef.add(draftData)
            draftId = docRef.id
        }

        return { success: true, draftId }
    } catch (error: any) {
        console.error('Failed to save draft to Firestore:', error)
        // Gracefully handle collection not existing
        if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
            // Try creating the document directly with fresh data
            try {
                const now = Date.now()
                const expiresAt = now + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
                const freshData = {
                    ...draft,
                    updatedAt: now,
                    expiresAt,
                    ...(draft.createdAt ? {} : { createdAt: now }),
                }
                const docRef = await getAdminDb().collection('listing_drafts').add(freshData)
                return { success: true, draftId: docRef.id }
            } catch (createError: any) {
                return { success: false, error: 'Database not ready. Please try again.' }
            }
        }
        return { success: false, error: error.message || 'Failed to save draft' }
    }
}

/**
 * Load draft from Firestore
 * Server-side function
 */
export async function loadDraftFromFirestore(
    userId: string
): Promise<{ success: boolean; draft?: ListingDraft & { id: string }; error?: string }> {
    try {
        const db = getAdminDb()
        const draftsRef = db.collection('listing_drafts')

        const snapshot = await draftsRef
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(10)
            .get()

        // Filter out 'created' status drafts
        const activeDrafts = snapshot.docs.filter(doc => {
            const data = doc.data() as ListingDraft
            return data.status !== 'created'
        })

        if (activeDrafts.length === 0) {
            return { success: false, error: 'No draft found' }
        }

        const draftDoc = activeDrafts[0]
        const draft = draftDoc.data() as ListingDraft

        // Check if draft has expired
        if (draft.expiresAt && draft.expiresAt < Date.now()) {
            // Only delete if payment not completed
            if (!draft.paymentCompleted) {
                await draftsRef.doc(draftDoc.id).delete()
                return { success: false, error: 'Draft expired' }
            }
        }

        return {
            success: true,
            draft: { ...draft, id: draftDoc.id },
        }
    } catch (error: any) {
        // Gracefully handle missing collection (common on fresh setup)
        if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
            return { success: false, error: 'No draft found' }
        }
        console.error('Failed to load draft from Firestore:', error)
        return { success: false, error: error.message || 'Failed to load draft' }
    }
}

/**
 * Clear draft from Firestore
 * PROTECTED: Will not clear if payment is completed
 * Server-side function
 */
export async function clearDraftFromFirestore(
    userId: string,
    force: boolean = false
): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
        const db = getAdminDb()
        const draftsRef = db.collection('listing_drafts')

        const snapshot = await draftsRef
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(10)
            .get()

        // Filter out 'created' status drafts
        const activeDrafts = snapshot.docs.filter(doc => {
            const data = doc.data() as ListingDraft
            return data.status !== 'created'
        })

        if (activeDrafts.length === 0) {
            return { success: true }
        }

        const draftDoc = activeDrafts[0]
        const draft = draftDoc.data() as ListingDraft

        // PAYMENT PROTECTION: Do not clear if payment is completed (unless forced)
        if (draft.paymentCompleted && !force) {
            return {
                success: false,
                warning: 'Cannot clear draft with completed payment. Please create your listing first.',
                error: 'Payment completed - draft protected',
            }
        }

        await draftsRef.doc(draftDoc.id).delete()
        return { success: true }
    } catch (error: any) {
        console.error('Failed to clear draft from Firestore:', error)
        return { success: false, error: error.message || 'Failed to clear draft' }
    }
}

/**
 * Update draft status (e.g., after listing creation)
 * Server-side function
 */
export async function updateDraftStatus(
    userId: string,
    status: 'draft' | 'payment_pending' | 'payment_completed' | 'created'
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb()
        const draftsRef = db.collection('listing_drafts')

        const snapshot = await draftsRef
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(10)
            .get()

        // Filter out 'created' status drafts (unless we're setting it to created)
        const activeDrafts = snapshot.docs.filter(doc => {
            const data = doc.data() as ListingDraft
            return data.status !== 'created' || status === 'created'
        })

        if (activeDrafts.length === 0) {
            return { success: false, error: 'No draft found' }
        }

        const draftDoc = activeDrafts[0]
        await draftsRef.doc(draftDoc.id).update({
            status,
            updatedAt: Date.now(),
        })

        return { success: true }
    } catch (error: any) {
        console.error('Failed to update draft status:', error)
        return { success: false, error: error.message || 'Failed to update status' }
    }
}

/**
 * Get draft age in human-readable format
 */
export function getDraftAgeFromTimestamp(timestamp: number): string {
    const age = Date.now() - timestamp
    const minutes = Math.floor(age / (1000 * 60))
    const hours = Math.floor(age / (1000 * 60 * 60))
    const days = Math.floor(age / (1000 * 60 * 60 * 24))

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
        return 'Just now'
    }
}

/**
 * Check if user has an active draft with payment
 * Server-side function
 */
export async function hasPaymentProtectedDraft(
    userId: string
): Promise<{ hasDraft: boolean; draft?: ListingDraft & { id: string } }> {
    try {
        const db = getAdminDb()
        const draftsRef = db.collection('listing_drafts')

        const snapshot = await draftsRef
            .where('userId', '==', userId)
            .where('paymentCompleted', '==', true)
            .limit(5)
            .get()

        // Filter out 'created' status drafts
        const activeDrafts = snapshot.docs.filter(doc => {
            const data = doc.data() as ListingDraft
            return data.status !== 'created'
        })

        if (activeDrafts.length === 0) {
            return { hasDraft: false }
        }

        const draftDoc = activeDrafts[0]
        const draft = draftDoc.data() as ListingDraft

        return {
            hasDraft: true,
            draft: { ...draft, id: draftDoc.id },
        }
    } catch (error) {
        console.error('Failed to check for payment-protected draft:', error)
        return { hasDraft: false }
    }
}
