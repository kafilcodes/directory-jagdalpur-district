/**
 * Firestore Safe Collection Utilities
 * Handles graceful collection/document creation when they don't exist
 * Prevents 5 NOT_FOUND errors on fresh database
 * 
 * Production Architecture: Atomic operations, proper error handling
 */

import { getAdminDb, FieldValue } from "@/lib/firebase/admin"

/**
 * Safely create or get a Firestore document
 * If collection doesn't exist, creates it on first write
 * 
 * CRITICAL: The 5 NOT_FOUND error means Firestore database doesn't exist.
 * Solution: Use direct .set() without batch - Firestore auto-creates collections
 */
export async function safeCreateDocument(
    collectionName: string,
    docId: string,
    data: any,
    options?: { merge?: boolean }
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb()
        const ref = db.collection(collectionName).doc(docId)

        // Direct .set() - Firestore automatically creates collections
        // No need for batch writes or temp docs
        if (options?.merge) {
            await ref.set(data, { merge: true })
        } else {
            await ref.set(data)
        }

        console.log(`✅ [safeCreateDocument] Document ${collectionName}/${docId} created successfully`)
        return { success: true }
    } catch (error: any) {
        const errorCode = error.code || error.status || 'UNKNOWN'
        const errorMessage = error.message || 'Unknown error'

        console.error(`❌ [safeCreateDocument] ${collectionName}/${docId}:`, {
            code: errorCode,
            message: errorMessage,
            details: error.details || 'No additional details',
            stack: error.stack?.substring(0, 200) // First 200 chars of stack
        })

        // Special handling for NOT_FOUND (code 5)
        if (errorCode === 5 || errorCode === '5' || errorMessage.includes('NOT_FOUND')) {
            console.error(`
🚨 CRITICAL ERROR: Firestore Database NOT_FOUND (Error Code 5)

This error means:
1. Firestore is NOT enabled in your Firebase project
2. OR the database doesn't exist
3. OR Firebase Admin SDK credentials are incorrect

SOLUTION:
1. Go to Firebase Console: https://console.firebase.google.com/project/dhamtaridirectory
2. Click "Firestore Database" in left sidebar
3. Click "Create database" if not already created
4. Choose production mode
5. Select a region (asia-south1 recommended for India)

Current Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID || 'NOT SET'}
Service Account: ${process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'NOT SET'}
            `)

            return {
                success: false,
                error: `FIRESTORE_NOT_ENABLED: Firestore database doesn't exist. Please enable Firestore in Firebase Console.`
            }
        }

        return {
            success: false,
            error: `${errorCode}: ${errorMessage}`
        }
    }
}

/**
 * Safely get a document with graceful handling for missing collections
 */
export async function safeGetDocument(
    collectionName: string,
    docId: string
): Promise<{ success: boolean; data?: any; exists: boolean; error?: string }> {
    try {
        const db = getAdminDb()
        const ref = db.collection(collectionName).doc(docId)
        const snap = await ref.get()

        return {
            success: true,
            exists: snap.exists,
            data: snap.exists ? snap.data() : null
        }
    } catch (error: any) {
        // NOT_FOUND is expected for missing collections
        if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
            return {
                success: true,
                exists: false,
                data: null
            }
        }

        console.error(`[safeGetDocument] ${collectionName}/${docId}:`, error.message)
        return {
            success: false,
            exists: false,
            error: error.message || 'Failed to get document'
        }
    }
}

/**
 * Safely query collection with graceful handling for missing collections
 */
export async function safeQueryCollection(
    collectionName: string,
    where?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[],
    limit?: number
): Promise<{ success: boolean; docs: any[]; error?: string }> {
    try {
        const db = getAdminDb()
        let query: FirebaseFirestore.Query = db.collection(collectionName)

        // Apply where clauses
        if (where && where.length > 0) {
            for (const condition of where) {
                query = query.where(condition.field, condition.op, condition.value)
            }
        }

        // Apply limit
        if (limit) {
            query = query.limit(limit)
        }

        const snap = await query.get()

        return {
            success: true,
            docs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        }
    } catch (error: any) {
        // NOT_FOUND is expected for missing collections
        if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
            return {
                success: true,
                docs: []
            }
        }

        console.error(`[safeQueryCollection] ${collectionName}:`, error.message)
        return {
            success: false,
            docs: [],
            error: error.message || 'Failed to query collection'
        }
    }
}

/**
 * Safely create search shard index
 * Used in listings creation to index searchable terms
 * Uses safe pattern to ensure collection exists before transaction
 * 
 * Enhanced: Stores comprehensive business data for hybrid search
 */
export async function safeCreateSearchIndex(
    term: string,
    listingId: string,
    listingData: {
        score: number
        name: string
        cat: string
        categorySlug?: string
        description?: string
        address?: string
        city?: string
        phone?: string
        email?: string
        website?: string
        location?: { lat: number; lng: number }
        planType?: string
        rating?: number
        imp?: number
        clk?: number
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb()
        const shardId = `index_${(term?.[0] || 'o').toLowerCase()}`
        const now = Date.now()

        // First attempt: Direct transaction (works if collection exists)
        try {
            const refShard = db.collection("search").doc(shardId)

            await db.runTransaction(async (tx) => {
                const snap = await tx.get(refShard)
                const indexData = snap.exists
                    ? (snap.data() as any)
                    : { index: {}, lastUpdatedAt: now }

                if (!indexData.index) {
                    indexData.index = {}
                }

                if (!indexData.index[term]) {
                    indexData.index[term] = {}
                }

                indexData.index[term][listingId] = {
                    score: listingData.score,
                    name: listingData.name,
                    cat: listingData.cat,
                    categorySlug: listingData.categorySlug || listingData.cat,
                    description: listingData.description || '',
                    address: listingData.address || '',
                    city: listingData.city || '',
                    phone: listingData.phone || '',
                    email: listingData.email || '',
                    website: listingData.website || '',
                    location: listingData.location || null,
                    planType: listingData.planType || 'free',
                    rating: listingData.rating || 0,
                    imp: listingData.imp || 0,
                    clk: listingData.clk || 0,
                    createdAt: now,
                    updatedAt: now,
                }

                indexData.lastUpdatedAt = now
                tx.set(refShard, indexData, { merge: true })
            })

            return { success: true }
        } catch (firstError: any) {
            // If NOT_FOUND, create collection first then retry
            if (firstError.code === 5 || firstError.message?.includes('NOT_FOUND')) {
                console.log(`[safeCreateSearchIndex] search collection doesn't exist, creating...`)

                // Create collection with temp document
                const tempRef = await db.collection("search").add({ _temp: true })
                await tempRef.delete()

                // Retry transaction
                const refShard = db.collection("search").doc(shardId)
                await db.runTransaction(async (tx) => {
                    const snap = await tx.get(refShard)
                    const indexData = snap.exists
                        ? (snap.data() as any)
                        : { index: {}, lastUpdatedAt: now }

                    if (!indexData.index) {
                        indexData.index = {}
                    }

                    if (!indexData.index[term]) {
                        indexData.index[term] = {}
                    }

                    indexData.index[term][listingId] = {
                        score: listingData.score,
                        name: listingData.name,
                        cat: listingData.cat,
                        categorySlug: listingData.categorySlug || listingData.cat,
                        description: listingData.description || '',
                        address: listingData.address || '',
                        city: listingData.city || '',
                        phone: listingData.phone || '',
                        email: listingData.email || '',
                        website: listingData.website || '',
                        location: listingData.location || null,
                        planType: listingData.planType || 'free',
                        rating: listingData.rating || 0,
                        imp: listingData.imp || 0,
                        clk: listingData.clk || 0,
                        createdAt: now,
                        updatedAt: now,
                    }

                    indexData.lastUpdatedAt = now
                    tx.set(refShard, indexData, { merge: true })
                })

                console.log(`✅ [safeCreateSearchIndex] Created and indexed for term: ${term}`)
                return { success: true }
            }

            throw firstError
        }
    } catch (error: any) {
        console.error(`[safeCreateSearchIndex] ${term}/${listingId}:`, error.message)
        return {
            success: false,
            error: error.message || 'Failed to create search index'
        }
    }
}

/**
 * Safely create listingStats document
 * Uses safe pattern to ensure collection exists before write
 */
export async function safeCreateListingStats(
    listingId: string,
    initialData?: {
        totalImpressions?: number
        totalClicks?: number
        topKeywords?: Array<{ term: string; imp: number; clk: number }>
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb()
        const now = Date.now()

        const data = {
            totalImpressions: initialData?.totalImpressions || 0,
            totalClicks: initialData?.totalClicks || 0,
            topKeywords: initialData?.topKeywords || [],
            lastAggregated: now,
            createdAt: now,
            updatedAt: now,
        }

        // Use safeCreateDocument to handle collection creation
        return await safeCreateDocument("listingStats", listingId, data, { merge: true })
    } catch (error: any) {
        console.error(`[safeCreateListingStats] ${listingId}:`, error.message)
        return {
            success: false,
            error: error.message || 'Failed to create listing stats'
        }
    }
}
