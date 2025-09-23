import { getAdminDb } from "@/lib/firebase/admin"

export type SearchParams = { q?: string; cat?: string; cats?: string[]; limit?: number; sort?: string }

function hasAlgoliaEnv() {
  return !!process.env.ALGOLIA_APP_ID && !!process.env.ALGOLIA_API_KEY && !!process.env.ALGOLIA_INDEX
}

export async function searchListings({ q = "", cat = "", cats = [], limit = 60, sort = "relevance" }: SearchParams) {
  if (hasAlgoliaEnv()) {
    try {
      const mod: any = await import("algoliasearch")
      const client = (mod.default || mod.algoliasearch)(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_API_KEY!)
      const index = client.initIndex(process.env.ALGOLIA_INDEX!)
      const categoryFilters = (cats.length ? cats : (cat ? [cat] : [])).map((c) => `category:\"${c}\"`)
      const filters = categoryFilters.length ? categoryFilters.join(" OR ") : undefined
      const res = await index.search(q, {
        hitsPerPage: limit,
        filters,
      })
      return (res.hits as any[]) || []
    } catch {
      // ignore and fallback
    }
  }

  // Fallback: Firestore
  const db = getAdminDb()
  const snap = await db.collection("listings").where("approved", "==", true).orderBy("createdAt", "desc").limit(limit).get()
  let items = snap.docs.map((d) => d.data() as any)
  const qLower = q.toLowerCase()
  items = items.filter((it: any) => {
    const name = String(it?.name || it?.listingName || "").toLowerCase()
    const category = String(it?.category || it?.listingType || "")
    const matchesQ = q ? name.includes(qLower) : true
    const allowedCats = cats.length ? new Set(cats) : (cat ? new Set([cat]) : null)
    const matchesCat = allowedCats ? allowedCats.has(category) : true
    return matchesQ && matchesCat
  })
  if (sort === "rating_desc") items.sort((a: any, b: any) => (Number(b.rating||0) - Number(a.rating||0)))
  if (sort === "created_desc") items.sort((a: any, b: any) => (Number(b.createdAt||0) - Number(a.createdAt||0)))
  return items
}
