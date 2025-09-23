import ListingCardClient from "@/components/listings/ListingCardClient"
import ClientAdSlot from "@/components/ads/ClientAdSlot"
import { getAdminDb } from "@/lib/firebase/admin"
import { Skeleton } from "@/components/ui/skeleton"

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

export const dynamic = "force-dynamic"

export default async function SearchPage({ searchParams }: any) {
  const q = (searchParams.q || "").toLowerCase()
  const cat = searchParams.cat || ""

  // No admin env -> show skeletons
  if (!hasAdminEnv()) {
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

  const db = getAdminDb()
  // Simple approach: fetch N and filter locally for demo. For production, consider Algolia or composite indexes.
  const snap = await db.collection("listings").where("approved", "==", true).orderBy("createdAt", "desc").limit(60).get()
  const items = snap.docs.map((d) => d.data() as any)
  const filtered = items.filter((it) => {
    const name = String(it?.name || it?.listingName || "").toLowerCase()
    const category = String(it?.category || it?.listingType || "")
    const matchesQ = q ? name.includes(q) : true
    const matchesCat = cat ? category === cat : true
    return matchesQ && matchesCat
  })

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((it: any, idx: number) => (
          <>
            <ListingCardClient
              key={it.id}
              id={it.id}
              name={it.name || it.listingName || "Unnamed"}
              category={it.category || it.listingType || "General"}
              address={it.address || ""}
              rating={typeof it.rating === "number" ? it.rating : undefined}
            />
            {idx !== 0 && idx % 6 === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <ClientAdSlot placementId="search-inline-1" />
              </div>
            )}
          </>
        ))}
        {filtered.length === 0 && <p className="text-gray-600">No results.</p>}
      </div>
    </main>
  )
}
