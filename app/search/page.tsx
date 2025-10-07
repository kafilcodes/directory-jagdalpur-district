import { Skeleton } from "@/components/ui/skeleton"
import SearchControls from "@/components/search/SearchControls"
import { searchListingsHybrid } from "@/app/actions/searchActions"
import Image from "next/image"
import EmptySearch from "@/components/icons/EmptySearch"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Star } from "lucide-react"

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ searchParams }: any) {
  const params = await searchParams
  const q = params?.q || ""
  const title = q ? `Search: ${q} | Dhamtari Directory` : "Search | Dhamtari Directory"
  const description = q ? `Results for "${q}" in Dhamtari Directory.` : "Search local businesses and services."
  return { title, description }
}

export default async function SearchPage({ searchParams }: any) {
  const params = await searchParams
  const q = (params.q || "").toLowerCase()
  const catsParam = String(params.cats || params.category || "")
  const cats = catsParam.split(",").filter(Boolean)
  const sort = String(params.sort || "relevance")
  const premiumFilter = String(params.filter || "") // "sponsored" | "featured" | ""

  // No admin env -> show skeletons
  if (!hasAdminEnv() && !(process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY && process.env.ALGOLIA_INDEX)) {
    return (
      <main className="mx-auto max-w-5xl p-4 space-y-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </main>
    )
  }

  // Use hybrid search for better results
  const raw = (await searchListingsHybrid(q, 60, {
    sort: sort as any,
    categoryFilter: cats.length > 0 ? cats : undefined
  })) as any[]

  // Apply premium filter if specified
  const results = premiumFilter ? raw.filter((it: any) => it?.planType === premiumFilter) : raw
  const total = results.length

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

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8">
          <div className="relative w-48 h-36">
            <EmptySearch width={192} height={144} />
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((it: any, index: number) => {
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
      )}

      {/* Listing Detail Sheet - Opens when ?id= param is present */}
      {require("react").createElement(require("@/components/listings/ListingDetailSheet").default)}
    </main>
  )
}

