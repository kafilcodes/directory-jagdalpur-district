import { LRUCache } from 'lru-cache'

/**
 * Local in-memory cache for listing data with 5-minute expiry
 * Reduces Firestore read costs and improves response times
 * 
 * Cache Configuration:
 * - Max entries: 1000 listings
 * - TTL: 5 minutes (300,000ms)
 * - Auto-purge: Stale entries removed on access
 * 
 * Cached Operations:
 * - Individual listing details (by ID)
 * - Search results (by query string)
 * - Category filters (by category slug)
 */

// Cache for individual listings by ID
const listingCache = new LRUCache<string, any>({
    max: 1000, // Maximum 1000 listings
    ttl: 1000 * 60 * 5, // 5 minutes (300000ms)
    updateAgeOnGet: false, // Don't refresh TTL on access
    updateAgeOnHas: false,
})

// Cache for search results by query
const searchCache = new LRUCache<string, any>({
    max: 500, // Maximum 500 search queries
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: false,
    updateAgeOnHas: false,
})

/**
 * Get cached listing by ID
 */
export function getCachedListing(id: string) {
    return listingCache.get(id)
}

/**
 * Set listing in cache
 */
export function setCachedListing(id: string, data: any) {
    listingCache.set(id, data)
}

/**
 * Invalidate single listing cache (e.g., after update)
 */
export function invalidateListing(id: string) {
    listingCache.delete(id)
}

/**
 * Get cached search results
 * @param query - Search query string
 * @param categories - Optional category filters
 * @param sort - Sort method
 * @param filter - Premium filter (sponsored/featured)
 */
export function getCachedSearch(
    query: string,
    categories?: string[],
    sort?: string,
    filter?: string
) {
    const cacheKey = buildSearchCacheKey(query, categories, sort, filter)
    return searchCache.get(cacheKey)
}

/**
 * Set search results in cache
 */
export function setCachedSearch(
    query: string,
    data: any,
    categories?: string[],
    sort?: string,
    filter?: string
) {
    const cacheKey = buildSearchCacheKey(query, categories, sort, filter)
    searchCache.set(cacheKey, data)
}

/**
 * Invalidate all search results (e.g., after bulk listing updates)
 */
export function invalidateAllSearches() {
    searchCache.clear()
}

/**
 * Invalidate specific search pattern (e.g., all searches for a category)
 */
export function invalidateSearchPattern(pattern: string) {
    // Find and delete all keys matching pattern
    const keys = Array.from(searchCache.keys())
    for (const key of keys) {
        if (key.includes(pattern)) {
            searchCache.delete(key)
        }
    }
}

/**
 * Build cache key for search results
 */
function buildSearchCacheKey(
    query: string,
    categories?: string[],
    sort?: string,
    filter?: string
): string {
    const parts = [
        `q:${query.toLowerCase().trim()}`,
        categories && categories.length > 0 ? `cats:${categories.sort().join(',')}` : null,
        sort ? `sort:${sort}` : null,
        filter ? `filter:${filter}` : null,
    ].filter(Boolean)

    return parts.join('|')
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
    return {
        listings: {
            size: listingCache.size,
            max: listingCache.max,
        },
        searches: {
            size: searchCache.size,
            max: searchCache.max,
        },
    }
}
