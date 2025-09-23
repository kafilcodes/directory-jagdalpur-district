import { getAdminDb } from "@/lib/firebase/admin"
import ListingCardClient from "@/components/listings/ListingCardClient"
import ClientAdSlot from "@/components/ads/ClientAdSlot"
import { Skeleton } from "@/components/ui/skeleton"

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

export async function FeaturedListings() {
  if (!hasAdminEnv()) {
    // Dev fallback: render skeletons when Firebase Admin is not configured
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  try {
    const db = getAdminDb()
    const snap = await db
      .collection("listings")
      .where("approved", "==", true)
      .orderBy("createdAt", "desc")
      .limit(6)
      .get()

    const items = snap.docs.map((d) => d.data() as any)

    if (items.length === 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it: any, idx: number) => (
          <>
            <ListingCardClient
              key={it.id}
              id={it.id}
              name={it.name || it.listingName || "Unnamed"}
              category={it.category || it.listingType || "General"}
              address={it.address || ""}
              rating={typeof it.rating === "number" ? it.rating : undefined}
            />
            {idx === 2 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <ClientAdSlot placementId="search-inline-1" />
              </div>
            )}
          </>
        ))}
      </div>
    )
  } catch {
    // On any server-side error, render skeletons to avoid crashing page
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    )
  }
}
