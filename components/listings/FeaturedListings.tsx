import { getAdminDb } from "@/lib/firebase/admin"
import ListingCardClient from "@/components/listings/ListingCardClient"
import ClientAdSlot from "@/components/ads/ClientAdSlot"
import { Skeleton } from "@/components/ui/skeleton"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Your City";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Your State";
const CITY_PIN_CODE = process.env.NEXT_PUBLIC_CITY_PIN_CODE || "000000";

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

// Sample data for development when Firebase is not configured
const sampleListings = [
  {
    id: "1",
    name: "Sharma Restaurant",
    category: "Restaurants",
    address: `Main Road, ${CITY_NAME}, ${STATE_NAME} ${CITY_PIN_CODE}`,
    rating: 4.5,
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "City Medical Store",
    category: "Pharmacies",
    address: `Station Road, Near Bus Stand, ${CITY_NAME}`,
    rating: 4.2,
    photoUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop"
  },
  {
    id: "3",
    name: "Kumar Electronics",
    category: "Electricians",
    address: `Market Square, ${CITY_NAME}`,
    rating: 4.8,
    photoUrl: "https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800&auto=format&fit=crop"
  },
  {
    id: "4",
    name: "FitLife Gym",
    category: "Gyms",
    address: `Ring Road, ${CITY_NAME}`,
    rating: 4.6,
    photoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop"
  },
  {
    id: "5",
    name: "Green Grocers",
    category: "Groceries",
    address: `Gandhi Chowk, ${CITY_NAME}`,
    rating: 4.3,
    photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop"
  },
  {
    id: "6",
    name: "Learn & Excel Tutors",
    category: "Tutors",
    address: `School Road, ${CITY_NAME}`,
    rating: 4.7,
    photoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop"
  }
]

export async function FeaturedListings() {
  if (!hasAdminEnv()) {
    // Dev fallback: render sample data when Firebase Admin is not configured
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleListings.map((item) => (
          <ListingCardClient
            key={item.id}
            id={item.id}
            name={item.name}
            category={item.category}
            address={item.address}
            rating={item.rating}
            photoUrl={item.photoUrl}
          />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
