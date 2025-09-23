import { Suspense } from "react"
import SearchBox from "@/components/search/SearchBox"
import { FeaturedListings } from "@/components/listings/FeaturedListings"
import ClientAdSlot from "@/components/ads/ClientAdSlot"
import ListingDetailSheet from "@/components/listings/ListingDetailSheet"
import AuthButtons from "@/components/auth/AuthButtons"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dhamtari Directory",
  description: "Find and connect with local businesses and service providers.",
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dhamtari Directory</h1>
            <p className="text-gray-600">Search and discover local businesses and services.</p>
          </div>
          <AuthButtons />
        </div>
      </header>

      <section>
        <Suspense>
          <SearchBox />
        </Suspense>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-4 bg-white">Featured</div>
        <FeaturedListings />
      </section>

      <section>
        <ClientAdSlot placementId="homepage-top-banner" />
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Dhamtari Directory",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
            potentialAction: {
              "@type": "SearchAction",
              target: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <Suspense>
        <ListingDetailSheet />
      </Suspense>
    </main>
  )
}
