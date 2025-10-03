import { Skeleton } from "@/components/ui/skeleton"
import SearchControls from "@/components/search/SearchControls"
import { searchListings as searchShard } from "@/app/actions/searchActions"
import Image from "next/image"
import EmptySearch from "@/components/icons/EmptySearch"

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

  const raw = (await searchShard(q, 60, { sort: sort as any })) as any[]
  const { normalizeCategoryToSlug } = await import("@/lib/categories")
  const filtered = cats.length ? raw.filter((it: any) => {
    const slug = normalizeCategoryToSlug(String(it.cat || it.category || ""))
    return slug ? cats.includes(slug) : false
  }) : raw
  const premiumFiltered = premiumFilter ? filtered.filter((it: any) => it?.planType === premiumFilter) : filtered
  const total = premiumFiltered.length

  // Split into businesses and services based on category (safe assumptions)
  const serviceSet = new Set(["Plumbers", "Electricians", "Carpenters", "Tutors", "Clinics"]) // assumptions per context
  const businessItems = premiumFiltered.filter((it: any) => !serviceSet.has(it.category || it.listingType))
  const serviceItems = premiumFiltered.filter((it: any) => serviceSet.has(it.category || it.listingType))

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
          <div className="text-center space-y-3 pt-4">
            <h2 className="text-xl font-semibold text-gray-900">No results found</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto px-4">
              Try different keywords or remove filters and search again.
            </p>
          </div>
        </div>
      ) : (
        require("react").createElement(require("@/components/ui/tabs").Tabs, { defaultValue: "businesses", className: "w-full" },
          require("react").createElement(require("@/components/ui/tabs").TabsList, { className: "grid w-full grid-cols-2" },
            require("react").createElement(require("@/components/ui/tabs").TabsTrigger, { value: "businesses" }, "Businesses"),
            require("react").createElement(require("@/components/ui/tabs").TabsTrigger, { value: "services" }, "Services")
          ),
          require("react").createElement(require("@/components/ui/tabs").TabsContent, { value: "businesses", className: "mt-6" },
            require("react").createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" },
              ...businessItems.map((it: any) => (
                require("react").createElement(require("@/components/listings/ListingCardClient").default, {
                  key: it.id,
                  id: it.id,
                  name: it.name || it.listingName || "Unnamed",
                  category: it.category || it.listingType || "General",
                  address: it.address || "",
                  rating: typeof it.rating === "number" ? it.rating : undefined,
                  planType: it.planType,
                })
              ))
            )
          ),
          require("react").createElement(require("@/components/ui/tabs").TabsContent, { value: "services", className: "mt-6" },
            require("react").createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" },
              ...serviceItems.map((it: any) => (
                require("react").createElement(require("@/components/listings/ListingCardClient").default, {
                  key: it.id,
                  id: it.id,
                  name: it.name || it.listingName || "Unnamed",
                  category: it.category || it.listingType || "General",
                  address: it.address || "",
                  rating: typeof it.rating === "number" ? it.rating : undefined,
                  planType: it.planType,
                })
              ))
            )
          )
        )
      )}
    </main>
  )
}
