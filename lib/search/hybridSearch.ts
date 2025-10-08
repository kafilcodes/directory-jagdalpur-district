/**
 * Hybrid Search System
 * Combines search collection (sharded index) with listings collection (full data)
 * Provides fast, accurate, and comprehensive search results
 * 
 * Architecture:
 * 1. Query search shards for matching terms (fast, indexed)
 * 2. Query listings collection for recent/complete data (comprehensive)
 * 3. Merge and deduplicate results
 * 4. Rank by relevance + plan type + engagement
 * 5. Return unified, sorted results
 */

"use server"

import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import type { Firestore } from "firebase-admin/firestore"

const POPULARITY_BOOST = 0.001 // Weight per impression
const ENGAGEMENT_BOOST = 0.05  // Weight per click
const PLAN_BOOST = {
    featured: 100,
    sponsored: 50,
    free: 0
}

interface SearchEntry {
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
    location?: { lat: number; lng: number } | null
    planType?: string
    rating?: number
    imp?: number
    clk?: number
    createdAt?: number
    updatedAt?: number
    photos?: string[]
    images?: string[]
    thumbnail?: string
    googlePhotos?: string[]
}

interface SearchResult extends SearchEntry {
    id: string
    finalScore: number
    source: 'search' | 'listings' | 'both'
}

/**
 * Normalize search term for consistent indexing
 */
function normalizeSearchTerm(term: string): string {
    return term.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

/**
 * Extract words from search query
 */
function extractSearchWords(query: string): string[] {
    return Array.from(
        new Set(
            query.toLowerCase().trim().split(/[^a-z0-9]+/).filter(Boolean)
        )
    )
}

/**
 * Get shard ID for a search term
 */
function getShardId(term: string): string {
    const firstChar = term[0]
    return (firstChar >= 'a' && firstChar <= 'z') ? `index_${firstChar}` : 'index_other'
}

/**
 * Calculate final score for ranking
 */
function calculateFinalScore(entry: SearchEntry): number {
    const baseScore = Number(entry.score || 0)
    const impressions = Number(entry.imp || 0) * POPULARITY_BOOST
    const clicks = Number(entry.clk || 0) * ENGAGEMENT_BOOST
    const planBoost = PLAN_BOOST[entry.planType as keyof typeof PLAN_BOOST] || 0

    return baseScore + impressions + clicks + planBoost
}

/**
 * Search from sharded search collection
 */
async function searchFromShards(
    db: Firestore,
    searchTerms: string[]
): Promise<Map<string, SearchResult>> {
    const results = new Map<string, SearchResult>()

    // Get unique shard IDs
    const shardIds = Array.from(new Set(searchTerms.map(getShardId)))

    // Fetch all shards in parallel
    const shardSnaps = await Promise.allSettled(
        shardIds.map(id => db.collection('search').doc(id).get())
    )

    // Process each term
    for (const term of searchTerms) {
        const shardId = getShardId(term)
        const snapIdx = shardIds.indexOf(shardId)
        const snapResult = shardSnaps[snapIdx]

        // Skip failed shards
        if (snapResult.status === 'rejected') {
            console.warn(`Failed to fetch shard ${shardId}:`, snapResult.reason)
            continue
        }

        const doc = snapResult.value
        if (!doc.exists) continue

        const data = doc.data() as any
        const termIndex = data?.index?.[term] || {}

        // Add all matching listings for this term
        for (const [listingId, entry] of Object.entries(termIndex)) {
            const searchEntry = entry as SearchEntry
            const finalScore = calculateFinalScore(searchEntry)

            // Keep highest score if listing appears in multiple terms
            if (!results.has(listingId) || finalScore > results.get(listingId)!.finalScore) {
                results.set(listingId, {
                    ...searchEntry,
                    id: listingId,
                    finalScore,
                    source: 'search'
                })
            }
        }
    }

    return results
}

/**
 * Search from listings collection (full data)
 */
async function searchFromListings(
    db: Firestore,
    searchQuery: string,
    limit: number = 60
): Promise<Map<string, SearchResult>> {
    const results = new Map<string, SearchResult>()
    const queryLower = searchQuery.toLowerCase()
    const now = Date.now()

    try {
        // Get approved active listings (simplified query to avoid composite index requirement)
        const snap = await db.collection('listings')
            .where('approved', '==', true)
            .where('status', '==', 'active')
            .limit(Math.max(limit, 100))
            .get()

        // Filter and map results
        for (const doc of snap.docs) {
            const data = doc.data()
            const name = String(data.name || data.businessName || '').toLowerCase()
            const description = String(data.description || '').toLowerCase()
            const category = String(data.category || '').toLowerCase()
            const address = String(data.address || '').toLowerCase()

            // Check if any field matches query
            const matches = name.includes(queryLower) ||
                description.includes(queryLower) ||
                category.includes(queryLower) ||
                address.includes(queryLower)

            if (!matches) continue

            // Calculate plan boost based on active plan
            let planType = 'free'
            const activePlan = data.activePlan || data.monetization
            if (activePlan) {
                const endAt = Number(activePlan.endAt || 0)
                const type = String(activePlan.type || '')
                if (endAt > now) {
                    planType = type
                }
            }

            // Calculate base score based on name match quality
            let baseScore = 5
            if (name === queryLower) baseScore = 20 // Exact match
            else if (name.startsWith(queryLower)) baseScore = 15 // Starts with
            else if (name.includes(queryLower)) baseScore = 10 // Contains

            const entry: SearchEntry = {
                score: baseScore,
                name: data.name || data.businessName || '',
                cat: data.category || '',
                categorySlug: data.categorySlug || '',
                description: data.description || '',
                address: data.address || '',
                city: data.city || '',
                phone: data.phone || '',
                email: data.email || '',
                website: data.website || '',
                location: data.location || null,
                planType,
                rating: data.rating || 0,
                imp: data.views || 0,
                clk: data.clicks || 0,
                createdAt: data.createdAt || now,
                updatedAt: data.updatedAt || now,
                photos: data.photos || [],
                images: data.images || [],
                thumbnail: data.thumbnail || '',
                googlePhotos: data.googlePhotos || []
            }

            const finalScore = calculateFinalScore(entry)

            results.set(doc.id, {
                ...entry,
                id: doc.id,
                finalScore,
                source: 'listings'
            })
        }
    } catch (error) {
        console.error('Error searching listings collection:', error)
    }

    return results
}

/**
 * Merge and deduplicate results from both sources
 */
function mergeResults(
    shardResults: Map<string, SearchResult>,
    listingsResults: Map<string, SearchResult>
): SearchResult[] {
    const merged = new Map<string, SearchResult>()

    // Add all shard results
    for (const [id, result] of shardResults) {
        merged.set(id, result)
    }

    // Merge or add listings results
    for (const [id, result] of listingsResults) {
        if (merged.has(id)) {
            // Listing exists in both - merge data, prefer listings for freshness
            const existing = merged.get(id)!
            merged.set(id, {
                ...result, // Use listings data (more complete)
                finalScore: Math.max(existing.finalScore, result.finalScore),
                source: 'both'
            })
        } else {
            merged.set(id, result)
        }
    }

    return Array.from(merged.values())
}

/**
 * Main hybrid search function
 * Combines search index and listings collection for comprehensive results
 */
export async function hybridSearch(
    searchQuery: string,
    options?: {
        limit?: number
        sort?: 'relevance' | 'popular' | 'recent'
        categoryFilter?: string[]
    }
): Promise<SearchResult[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
        return []
    }

    const limit = options?.limit || 60
    const sort = options?.sort || 'relevance'
    const categoryFilter = options?.categoryFilter || []

    try {
        const db = getAdminDb() as Firestore
        const searchTerms = extractSearchWords(searchQuery)

        if (searchTerms.length === 0) return []

        // Query both sources in parallel
        const [shardResults, listingsResults] = await Promise.all([
            searchFromShards(db, searchTerms),
            searchFromListings(db, searchQuery, limit)
        ])

        // Merge results
        let results = mergeResults(shardResults, listingsResults)

        // Apply category filter - handle both singular and plural forms
        if (categoryFilter.length > 0) {
            const filterSet = new Set<string>()

            // Add both original and normalized versions (handle singular/plural)
            for (const cat of categoryFilter) {
                const lower = cat.toLowerCase()
                filterSet.add(lower)
                // Add singular/plural variants
                if (lower.endsWith('s') && lower.length > 2) {
                    filterSet.add(lower.slice(0, -1)) // stores -> store
                } else {
                    filterSet.add(lower + 's') // store -> stores
                }
            }

            results = results.filter(r => {
                const cat = r.cat.toLowerCase()
                const slug = r.categorySlug?.toLowerCase() || ''
                return filterSet.has(cat) || filterSet.has(slug)
            })
        }

        // Sort results
        if (sort === 'popular') {
            results.sort((a, b) =>
                (Number(b.clk || 0) - Number(a.clk || 0)) ||
                (Number(b.imp || 0) - Number(a.imp || 0)) ||
                (b.finalScore - a.finalScore)
            )
        } else if (sort === 'recent') {
            results.sort((a, b) =>
                (Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)) ||
                (b.finalScore - a.finalScore)
            )
        } else {
            // Default: relevance
            results.sort((a, b) => b.finalScore - a.finalScore)
        }

        // Apply limit
        results = results.slice(0, limit)

        // Fire-and-forget: increment impressions in search shards
        incrementImpressions(db, searchTerms, results).catch(err =>
            console.warn('Failed to increment impressions:', err)
        )

        return results
    } catch (error) {
        console.error('Hybrid search error:', error)
        return []
    }
}

/**
 * Track click on a listing (fire-and-forget)
 */
export async function trackListingClick(
    listingId: string,
    searchQuery: string
): Promise<{ ok: boolean; error?: string }> {
    const searchTerms = extractSearchWords(searchQuery)

    if (searchTerms.length === 0) {
        return { ok: false, error: 'empty_query' }
    }

    try {
        const db = getAdminDb() as Firestore
        const shardIds = Array.from(new Set(searchTerms.map(getShardId)))

        // Update each shard in parallel
        const updates = shardIds.map(async shardId => {
            const ref = db.collection('search').doc(shardId)
            const updateObj: any = {}

            for (const term of searchTerms) {
                if (getShardId(term) === shardId) {
                    updateObj[`index.${term}.${listingId}.clk`] = FieldValue.increment(1)
                }
            }

            await ref.set(updateObj, { merge: true })
        })

        await Promise.all(updates)

        // Also update listing document
        await db.collection('listings').doc(listingId).update({
            clicks: FieldValue.increment(1)
        })

        return { ok: true }
    } catch (error: any) {
        console.error('Click tracking error:', error)
        return { ok: false, error: error.message }
    }
}

/**
 * Increment impressions for displayed results (fire-and-forget)
 */
async function incrementImpressions(
    db: Firestore,
    searchTerms: string[],
    results: SearchResult[]
): Promise<void> {
    if (results.length === 0) return

    const shardIds = Array.from(new Set(searchTerms.map(getShardId)))
    const listingIds = results.map(r => r.id)

    // Update search shards
    const shardUpdates = shardIds.map(async shardId => {
        const ref = db.collection('search').doc(shardId)
        const updateObj: any = {}

        for (const term of searchTerms) {
            if (getShardId(term) === shardId) {
                for (const listingId of listingIds) {
                    updateObj[`index.${term}.${listingId}.imp`] = FieldValue.increment(1)
                }
            }
        }

        await ref.set(updateObj, { merge: true })
    })

    // Update listing documents
    const listingUpdates = listingIds.map(id =>
        db.collection('listings').doc(id).update({
            views: FieldValue.increment(1)
        }).catch(() => { }) // Ignore errors for missing docs
    )

    await Promise.all([...shardUpdates, ...listingUpdates])
}
