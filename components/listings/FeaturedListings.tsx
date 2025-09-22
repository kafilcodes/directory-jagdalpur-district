import { getAdminDb } from "@/lib/firebase/admin"
import { ListingCard } from "@/components/listings/ListingCard"
import { Skeleton } from "@/components/ui/skeleton"

export async function FeaturedListings() {
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
        <ListingCard
          key={it.id}
          id={it.id}
          name={it.name || it.listingName || "Unnamed"}
          category={it.category || it.listingType || "General"}
          address={it.address || ""}
          rating={typeof it.rating === "number" ? it.rating : undefined}
        />
      ))}
    </div>
  )
}
