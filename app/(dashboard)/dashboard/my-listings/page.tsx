import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import ListingCardClient from "@/components/listings/ListingCardClient"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

async function getMyListings(uid: string) {
  try {
    const db = getAdminDb()
    const snap = await db.collection("listings").where("ownerId", "==", uid).orderBy("createdAt", "desc").limit(30).get()
    return snap.docs.map((d) => d.data() as any)
  } catch {
    return []
  }
}

export default async function MyListingsPage() {
  const user = await getCurrentUser()
  if (!user) return redirect("/") as any

  const hasAdmin = !!process.env.FIREBASE_ADMIN_PROJECT_ID && !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL && !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  let items: any[] = []
  if (hasAdmin) items = await getMyListings(user.uid)

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My Listings</h1>
      </div>

      {!hasAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border-0 shadow-md bg-white p-6 text-gray-600">No listings yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <ListingCardClient
              key={it.id}
              id={it.id}
              name={it.name || it.listingName || "Unnamed"}
              category={it.category || it.listingType || "General"}
              address={it.address || ""}
              rating={typeof it.rating === "number" ? it.rating : undefined}
              planType={it.activePlan?.type || it.planType}
              photoUrl={it.thumbnail || it.photos?.[0] || it.googlePhotos?.[0] || it.images?.[0]}
              images={it.images || []}
              googlePhotos={it.googlePhotos || it.photos || []}
              phone={it.phone}
              email={it.email}
            />
          ))}
        </div>
      )}

      {/* Listing Detail Sheet - Opens when ?id= param is present */}
      {require("react").createElement(require("@/components/listings/ListingDetailSheet").default)}
    </main>
  )
}