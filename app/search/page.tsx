"use client"

import { Skeleton } from "@/components/ui/skeleton"
import SearchControls from "@/components/search/SearchControls"
import EmptySearch from "@/components/icons/EmptySearch"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useRef, useCallback } from "react"
import { toast } from "sonner"
import { WifiOff, AlertCircle } from "lucide-react"

// Client-side cache for search results (5 minute TTL)
const searchCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function SearchPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const catsParam = searchParams.get("cats") || searchParams.get("category") || ""
  const cats = catsParam.split(",").filter(Boolean)
  const sort = searchParams.get("sort") || "relevance"
  const premiumFilter = searchParams.get("filter") || "" // "sponsored" | "featured" | ""

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [displayCount, setDisplayCount] = useState(9) // For search mode pagination
  const [hasReachedMax, setHasReachedMax] = useState(false)
  const [totalFetched, setTotalFetched] = useState(0)
  const [totalAvailable, setTotalAvailable] = useState(0) // Total listings available in DB
  const [isOffline, setIsOffline] = useState(false)

  // Simple ref to prevent duplicate requests
  const isLoadingRef = useRef(false)
  const totalFetchedRef = useRef(0) // Track with ref to get current value in loadMore
  const offlineToastShownRef = useRef(false) // Track if offline toast was shown

  // Build cache key
  const buildCacheKey = useCallback(() => {
    const parts = [q, sort, cats.join(","), premiumFilter].filter(Boolean)
    return parts.join("|")
  }, [q, sort, cats, premiumFilter])

  // Get cached data if available and not expired
  const getCachedData = useCallback(() => {
    const cacheKey = buildCacheKey()
    const cached = searchCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    // Clean up expired entries
    if (cached) {
      searchCache.delete(cacheKey)
    }

    return null
  }, [buildCacheKey])

  // Set cache data
  const setCachedData = useCallback((data: any[]) => {
    const cacheKey = buildCacheKey()
    searchCache.set(cacheKey, { data, timestamp: Date.now() })

    // Limit cache size to prevent memory issues
    if (searchCache.size > 50) {
      const firstKey = searchCache.keys().next().value
      if (firstKey) {
        searchCache.delete(firstKey)
      }
    }
  }, [buildCacheKey])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      offlineToastShownRef.current = false
      toast.success("Internet connection restored", {
        icon: "✓",
        className: "text-sm",
      })
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    // Check initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Fetch results
  // Initial fetch on mount or when search params change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setHasReachedMax(false)
      setTotalFetched(0)
      setTotalAvailable(0)
      totalFetchedRef.current = 0 // Reset ref
      setDisplayCount(12) // Show 12 initially for faster perceived load

      // Check cache first
      const cachedData = getCachedData()
      if (cachedData) {
        setResults(cachedData)
        setTotalFetched(cachedData.length)
        totalFetchedRef.current = cachedData.length // Sync ref
        setDisplayCount(cachedData.length) // Show all cached
        setLoading(false)
        return
      }

      // If offline and no cache, show toast and return
      if (!navigator.onLine) {
        setIsOffline(true)
        if (!offlineToastShownRef.current) {
          toast.error("No internet connection", {
            description: "Please check your connection and try again",
            icon: <WifiOff className="h-4 w-4" />,
            className: "text-sm",
          })
          offlineToastShownRef.current = true
        }
        setResults([])
        setLoading(false)
        return
      }

      try {
        // Build query params
        const params = new URLSearchParams()
        if (q) params.append("q", q)
        if (sort) params.append("sort", sort)
        if (cats.length > 0) params.append("cats", cats.join(","))
        if (premiumFilter) params.append("filter", premiumFilter)

        // For search query: fetch all matching results (60), for browse: start with 12 for better UX
        const limit = q ? 60 : 12
        params.append("limit", limit.toString())
        params.append("offset", "0")

        console.log(`[Initial Fetch] q="${q}", cats="${cats.join(",")}", sort="${sort}", limit=${limit}"`)

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) throw new Error("Search failed")

        const json = await response.json()

        if (json.ok) {
          const data = json.data || []
          const apiTotalAvailable = json.totalAvailable || data.length
          console.log(`[Initial Fetch] Received ${data.length} listings, Total available: ${apiTotalAvailable}`)
          setResults(data)
          setTotalFetched(data.length)
          setTotalAvailable(apiTotalAvailable)
          totalFetchedRef.current = data.length // Sync ref
          setDisplayCount(data.length) // Show all initially fetched

          // Cache the results for 5 minutes
          setCachedData(data)

          // Check if we've hit max browse limit (27 listings for browse mode)
          if (!q && json.maxReached) {
            setHasReachedMax(true)
          }
        } else {
          setResults([])
          setTotalFetched(0)
          setTotalAvailable(0)
        }
      } catch (error) {
        console.error("Search error:", error)

        // Check if it's a network error
        if (error instanceof TypeError && error.message.includes("fetch")) {
          // Try to use cached data as fallback
          const cachedData = getCachedData()
          if (cachedData && cachedData.length > 0) {
            setResults(cachedData)
            setTotalFetched(cachedData.length)
            totalFetchedRef.current = cachedData.length
            setDisplayCount(cachedData.length)
            toast.info("Showing cached results", {
              description: "Unable to fetch latest data",
              icon: <AlertCircle className="h-4 w-4" />,
              className: "text-sm",
            })
          } else {
            // No cache available, show error
            if (!offlineToastShownRef.current) {
              toast.error("Network error", {
                description: "Please check your internet connection",
                icon: <WifiOff className="h-4 w-4" />,
                className: "text-sm",
              })
              offlineToastShownRef.current = true
            }
            setResults([])
            setTotalFetched(0)
          }
        } else {
          // Other errors
          toast.error("Search failed", {
            description: "An error occurred while searching",
            className: "text-sm",
          })
          setResults([])
          setTotalFetched(0)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [q, sort, cats.join(","), premiumFilter, getCachedData, setCachedData])

  // Manual "Load More" function - only triggered by button click
  const loadMore = useCallback(async () => {
    // Prevent duplicate requests
    if (loadingMore || isLoadingRef.current) {
      console.log('[loadMore] Already loading, skipping')
      return
    }

    // Check internet connection first
    if (!navigator.onLine) {
      toast.error("No internet connection", {
        description: "Please check your connection and try again",
        icon: <WifiOff className="h-4 w-4" />,
        className: "text-sm",
      })
      return
    }

    isLoadingRef.current = true
    setLoadingMore(true)

    try {
      // SEARCH MODE: Just show more from already-fetched results
      if (q && displayCount < results.length) {
        const newCount = Math.min(displayCount + 12, results.length) // Show 12 more at a time
        console.log(`[loadMore - Search] Showing ${displayCount} -> ${newCount} of ${results.length}`)
        setDisplayCount(newCount)
        isLoadingRef.current = false
        setLoadingMore(false)
        return
      }

      // BROWSE MODE: Fetch more from API
      if (!q && totalFetchedRef.current < 27 && !hasReachedMax) {
        const params = new URLSearchParams()
        if (sort) params.append("sort", sort)
        if (cats.length > 0) params.append("cats", cats.join(","))
        if (premiumFilter) params.append("filter", premiumFilter)
        params.append("limit", "12") // Fetch 12 at a time for consistency
        params.append("offset", totalFetchedRef.current.toString()) // Use ref for current value

        console.log(`[loadMore - Browse] Fetching from offset ${totalFetchedRef.current}, cats="${cats.join(",")}"`)

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) throw new Error("Load more failed")

        const json = await response.json()

        if (json.ok) {
          const newData = json.data || []
          console.log(`[loadMore - Browse] Received ${newData.length} listings`)

          if (newData.length > 0) {
            // Append new listings - results is fresh from closure
            const updatedResults = [...results, ...newData]
            setResults(updatedResults)
            setTotalFetched(updatedResults.length)
            totalFetchedRef.current = updatedResults.length // Sync ref immediately
            // For browse mode, always show all fetched results
            setDisplayCount(updatedResults.length)

            console.log(`[loadMore - Browse] Total now: ${updatedResults.length}, displaying: ${updatedResults.length}`)

            // Update totalAvailable if API sends it
            if (json.totalAvailable) {
              setTotalAvailable(json.totalAvailable)
            }

            // Check if we've reached the end
            if (json.maxReached || newData.length === 0 || updatedResults.length >= 27) {
              console.log(`[loadMore - Browse] Reached max`)
              setHasReachedMax(true)
            }
          } else {
            // No new data received
            console.log(`[loadMore - Browse] No new data, marking as max reached`)
            setHasReachedMax(true)
          }
        }
      }
    } catch (error) {
      console.error("Load more error:", error)

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error", {
          description: "Please check your internet connection",
          icon: <WifiOff className="h-4 w-4" />,
          className: "text-sm",
        })
      } else {
        toast.error("Failed to load more", {
          description: "An error occurred",
          className: "text-sm",
        })
      }
    } finally {
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [loadingMore, q, displayCount, results, sort, cats, premiumFilter, hasReachedMax])

  const total = results.length
  const displayedResults = results.slice(0, displayCount)

  // Fixed logic: Only show "Show More" if there are ACTUALLY more listings to show
  // Use totalAvailable from API to know exactly how many listings exist in DB
  // Search mode: if we're displaying less than total fetched
  // Browse mode: if we haven't fetched all available listings yet
  const hasMore = q
    ? displayCount < total // For search, show if displaying less than fetched
    : (totalAvailable > 0 && totalFetched < totalAvailable && !hasReachedMax) // For browse, check against DB total

  // Internal logging for debugging (not shown to users)
  if (!loading && !loadingMore) {
    console.log(`[Show More Logic] Mode: ${q ? 'search' : 'browse'}, TotalAvailable: ${totalAvailable}, TotalFetched: ${totalFetched}, DisplayCount: ${displayCount}, HasMore: ${hasMore}`)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Search</h1>
          {require("react").createElement(require("@/components/search/SearchPageBar").default)}
        </div>
        <SearchControls />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) =>
            require("react").createElement(require("@/components/listings/ListingCardSkeleton").ListingCardSkeleton, { key: i })
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Search</h1>
        {/* Standalone search bar (no inline suggestions) - full width */}
        {require("react").createElement(require("@/components/search/SearchPageBar").default)}
      </div>
      {/* Filters */}
      <SearchControls />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            name: "Search results",
            url: (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com") + "/search",
          }),
        }}
      />

      {total === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative w-48 h-36">
            <EmptySearch width={192} height={144} />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm mt-10 text-gray-600">
              {q ? (
                <>We couldn&apos;t find any results for &quot;<span className="font-medium text-gray-900">{q}</span>&quot;. Try different keywords or browse all listings.</>
              ) : (
                <>No listings found. Try searching for businesses, services, or categories.</>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {/* Results Grid - Responsive: 2 cols mobile, 3 cols tablet, 3 cols desktop */}
      {/* When filtering by category on mobile, show 4 items then "Show More" */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedResults.map((it: any, index: number) => {
          // Extract images properly from Firestore data structure
          const imageUrl = it.thumbnail ||
            (it.images && Array.isArray(it.images) && it.images.length > 0
              ? (typeof it.images[0] === 'string' ? it.images[0] : it.images[0]?.url)
              : null) ||
            (it.photos && Array.isArray(it.photos) && it.photos.length > 0 ? it.photos[0] : null) ||
            (it.googlePhotos && Array.isArray(it.googlePhotos) && it.googlePhotos.length > 0 ? it.googlePhotos[0] : null) ||
            it.photoUrl

          // Extract formatted address
          const address = it.address?.formattedAddress || it.formattedAddress || it.address || ""

          // Extract plan type - check 'plan' field first (DB stores as 'plan'), then fallback
          const planType = it.plan || it.planType || it.activePlan?.type || it.monetization?.type

          const cardElement = require("react").createElement(require("@/components/listings/ListingCardClient").default, {
            key: it.id,
            id: it.id,
            name: it.name || it.businessName || it.listingName || "Unnamed",
            category: it.category || it.categorySlug || it.listingType || "General",
            address: typeof address === 'string' ? address : JSON.stringify(address),
            rating: typeof it.rating === "number" ? it.rating : undefined,
            planType: planType,
            photoUrl: imageUrl,
            thumbnail: imageUrl,
            images: it.images,
            googlePhotos: it.googlePhotos || it.photos,
            phone: it.phone,
            email: it.email,
          })

          return require("react").createElement("div", {
            key: it.id,
            className: "animate-fade-in-up",
            style: { animationDelay: `${index * 50}ms`, animationFillMode: 'both' }
          }, cardElement)
        })}
      </div>

      {/* Manual Load More Button - Only show if there are actually more results */}
      {hasMore && (
        <div className="flex items-center justify-center py-8">
          <Button
            onClick={loadMore}
            variant="ghost"
            size="lg"
            className="px-8 shadow-md hover:shadow-lg transition-shadow border-0"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
                Loading...
              </span>
            ) : (
              "Show More"
            )}
          </Button>
        </div>
      )}

      {/* Max reached message - Only show if we have results and reached max */}
      {!hasMore && total > 0 && hasReachedMax && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the results</p>
        </div>
      )}

      {/* Max browse limit reached message */}
      {!q && hasReachedMax && total >= 27 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center space-y-2 max-w-md">
            <p className="text-lg font-semibold text-gray-900">Browse Limit Reached</p>
            <p className="text-sm text-gray-600">
              You've browsed 27 listings. Please use the search feature to find specific businesses.
            </p>
          </div>
          <Button
            onClick={() => {
              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
              if (searchInput) searchInput.focus()
            }}
            variant="default"
            size="lg"
            className="mt-4"
          >
            Search Instead
          </Button>
        </div>
      )}

      {/* Listing Detail Sheet - Opens when ?id= param is present */}
      {require("react").createElement(require("@/components/listings/ListingDetailSheet").default)}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Search</h1>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

