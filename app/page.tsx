export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Dhamtari Directory</h1>
        <p className="text-gray-600">Search and discover local businesses and services.</p>
      </header>

      <section>
        <div className="w-full">
          <input
            className="w-full rounded-md border border-gray-200 p-3"
            placeholder="Search by business name or category..."
          />
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-gray-200 p-4 bg-white">Featured listings coming soon...</div>
      </section>

      <section>
        {/* Top banner ad slot (placeholder config values in config/ads.ts) */}
        {/* @ts-expect-error Server Component can render client child */}
        <div className="mt-4">
          {/* eslint-disable-next-line react/no-unknown-property */}
          {/* @ts-ignore */}
          {require("@/components/ads/AdSlot").AdSlot({ placementId: "homepage-top-banner" })}
        </div>
      </section>
    </main>
  )
}
