import { getAdminDb } from "@/lib/firebase/admin"

export type SearchParams = { q?: string; cat?: string; limit?: number }

function hasAlgoliaEnv() {
  return !!process.env.ALGOLIA_APP_ID && !!process.env.ALGOLIA_API_KEY && !!process.env.ALGOLIA_INDEX
}

export async function searchListings({ q = "", cat = "", limit = 60 }: SearchParams) {
  if (hasAlgoliaEnv()) {
    try {
      const mod: any = await import("algoliasearch")
      const client = (mod.default || mod.algoliasearch)(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_API_KEY!)
      const index = client.initIndex(process.env.ALGOLIA_INDEX!)
      const res = await index.search(q, {
        hitsPerPage: limit,
        filters: cat ? `category:\"${cat}\"` : undefined,
      })
      return (res.hits as any[]) || []
    } catch {
      // ignore and fallback
    }
  }

  // Fallback: Firestore
  const db = getAdminDb()
  const snap = await db.collection("listings").where("approved", "==", true).orderBy("createdAt", "desc").limit(limit).get()
  const items = snap.docs.map((d) => d.data())
  const qLower = q.toLowerCase()
  return items.filter((it: any) => {
    const name = String(it?.name || it?.listingName || "").toLowerCase()
    const category = String(it?.category || it?.listingType || "")
    const matchesQ = q ? name.includes(qLower) : true
    const matchesCat = cat ? category === cat : true
    return matchesQ && matchesCat
  })
}
