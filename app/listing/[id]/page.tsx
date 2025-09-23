import { getAdminDb } from "@/lib/firebase/admin"
import { notFound } from "next/navigation"

function hasAdminEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

export async function generateMetadata({ params }: any) {
  const id = params.id
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
    } catch {}
  }

  return {
    title: `${name} | Dhamtari Directory`,
    description,
  }
}

export default async function ListingPage({ params }: any) {
  const id = params.id

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: d?.name || d?.listingName,
    address: d?.address || undefined,
    url: (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com") + `/listing/${id}`,
    telephone: d?.phone || undefined,
  }

  return (
    <main className="mx-auto max-w-3xl p-4 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{d?.name || d?.listingName}</h1>
        <p className="text-gray-600">{d?.category || d?.listingType}</p>
      </header>

      {d?.address && <p className="text-gray-700">{d.address}</p>}
      {d?.phone && <p className="text-gray-700">Phone: {d.phone}</p>}
      {d?.website && (
        <p className="text-gray-700">
          Website:{" "}
          <a className="text-accent-600 underline" href={d.website} target="_blank" rel="noreferrer">
            {d.website}
          </a>
        </p>
      )}
    </main>
  )
}
