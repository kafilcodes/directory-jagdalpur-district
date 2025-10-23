import { getAdminDb } from "@/lib/firebase/admin"
import { notFound } from "next/navigation"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

export async function generateMetadata({ params }: any) {
  const resolvedParams = await params
  const id = resolvedParams.id
  let name = "Listing"
  let description = "Local business listing"

  if (hasAdminEnv()) {
    try {
      const db = getAdminDb()
      const snap = await db.collection("listings").doc(id).get()
      if (snap.exists) {
        const d: any = snap.data()
        name = d?.name || d?.listingName || name
        description = `${name} - ${d?.category || d?.listingType || "Local service"}`
      }
    } catch { }
  }

  return {
    title: `${name} | ${APP_NAME}`,
    description,
  }
}

export default async function ListingPage({ params }: any) {
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!hasAdminEnv()) {
    return (
      <main className="mx-auto max-w-3xl p-4 space-y-3">
        <h1 className="text-2xl font-bold">Listing</h1>
        <p className="text-gray-600">Data not available in this environment.</p>
      </main>
    )
  }

  const db = getAdminDb()
  const snap = await db.collection("listings").doc(id).get()
  if (!snap.exists) return notFound()
  const d: any = snap.data()

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
  const url = `${base}/listing/${id}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: d?.name || d?.listingName,
    address: d?.address || undefined,
    url,
    telephone: d?.phone || undefined,
  }
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: d?.category || d?.listingType || "Listings", item: `${base}/search?cat=${encodeURIComponent(d?.category || d?.listingType || "")}` },
      { "@type": "ListItem", position: 3, name: d?.name || d?.listingName, item: url },
    ],
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{d?.name || d?.listingName}</h1>
        <p className="text-gray-600">{d?.category || d?.listingType}</p>
      </header>

      {/* Image gallery */}
      {Array.isArray(d?.photos) && d.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {d.photos.map((p: string, i: number) => (
            <div key={i} className="relative w-full h-48 sm:h-56">
              {require("react").createElement(require("next/image").default, { src: (require("@/lib/images/thumb").getThumbnailUrl(p, 800)), alt: d?.name || d?.listingName, fill: true, sizes: "(max-width: 768px) 50vw, 33vw", className: "object-cover rounded-md" })}
            </div>
          ))}
        </div>
      )}

      <section className="space-y-2 text-gray-700">
        {d?.address && <p>{d.address}</p>}
        {d?.phone && <p>Phone: {d.phone}</p>}
        {d?.website && (
          <p>
            Website:{" "}
            <a className="text-accent-600 underline" href={d.website} target="_blank" rel="noreferrer">
              {d.website}
            </a>
          </p>
        )}
      </section>
    </main>
  )
}
