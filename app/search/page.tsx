"use client"

import { Skeleton } from "@/components/ui/skeleton"
import SearchControls from "@/components/search/SearchControls"
import EmptySearch from "@/components/icons/EmptySearch"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const catsParam = searchParams.get("cats") || searchParams.get("category") || ""
  const cats = catsParam.split(",").filter(Boolean)
  const sort = searchParams.get("sort") || "relevance"
  const premiumFilter = searchParams.get("filter") || "" // "sponsored" | "featured" | ""

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(10)

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        // Build query params
        const params = new URLSearchParams()
        if (q) params.append("q", q)
        if (sort) params.append("sort", sort)
        if (cats.length > 0) params.append("cats", cats.join(","))
        if (premiumFilter) params.append("filter", premiumFilter)

        // If no search query, only fetch 10 listings initially
        params.append("limit", q ? "60" : "50")

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) throw new Error("Search failed")

        const json = await response.json()
        if (json.ok) {
          setResults(json.data || [])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
    // Reset display count when search params change
    setDisplayCount(10)
  }, [q, sort, cats.join(","), premiumFilter])

  const total = results.length
  const displayedResults = results.slice(0, displayCount)
  const hasMore = total > displayCount
  const canLoadMore = hasMore

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Search</h1>
          {require("react").createElement(require("@/components/search/SearchPageBar").default)}
        </div>
        <SearchControls />
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

      {total === 0 && q ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative w-48 h-36">
            <EmptySearch width={192} height={144} />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm mt-10 text-gray-600">
              We couldn&apos;t find any results for &quot;<span className="font-medium text-gray-900">{q}</span>&quot;. Try different keywords or browse all listings below.
            </p>
          </div>
        </div>
      ) : null}

      {/* Results grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Load More Button */}
      {total > 0 && canLoadMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={() => setDisplayCount(prev => Math.min(prev + 10, total))}
            variant="outline"
            size="lg"
            className="px-8"
          >
            Load More ({Math.min(10, total - displayCount)} more listings)
          </Button>
        </div>
      )}

      {/* Empty state when no query and no results */}
      {total === 0 && !q && !loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative w-48 h-36">
            <EmptySearch width={192} height={144} />
          </div>
          <div className="text-center space-y-2 max-w-md mt-10">
            <p className="text-sm text-gray-600">
              No listings found. Try searching for businesses, services, or categories.
            </p>
          </div>
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

