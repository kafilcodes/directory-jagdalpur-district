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

  // Firestore with premium-first merge; safe fallbacks to avoid index issues
  const db = getAdminDb()
  const now = Date.now()

  try {
    // Try premium queries first (may require composite indexes)
    const featuredSnap = await db
      .collection("listings")
      .where("approved", "==", true)
      .where("activePlan.type", "==", "featured")
      .where("activePlan.endAt", ">", now)
      .limit(10)
      .get()
    const sponsoredSnap = await db
      .collection("listings")
      .where("approved", "==", true)
      .where("activePlan.type", "==", "sponsored")
      .where("activePlan.endAt", ">", now)
      .limit(20)
      .get()

    const featured = featuredSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    const sponsored = sponsoredSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

    // Organic: recent approved excluding already included
    const organicSnap = await db
      .collection("listings")
      .where("approved", "==", true)
      .orderBy("createdAt", "desc")
      .limit(Math.max(20, limit))
      .get()
    const organicAll = organicSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    const seen = new Set<string>([...featured, ...sponsored].map((x) => String((x as any).id)))
    let organic = organicAll.filter((x) => !seen.has(String((x as any).id)))

    // Filter by q/cats
    const qLower = q.toLowerCase()
    const allowedCats = cats.length ? new Set(cats) : (cat ? new Set([cat]) : null)
    function matches(it: any) {
      const name = String(it?.name || it?.listingName || "").toLowerCase()
      const category = String(it?.category || it?.listingType || "")
      const matchesQ = q ? name.includes(qLower) : true
      const matchesCat = allowedCats ? allowedCats.has(category) : true
      return matchesQ && matchesCat
    }

    const featuredF = featured.filter(matches)
    const sponsoredF = sponsored.filter(matches)
    organic = organic.filter(matches)

    // Optional sort for organic part
    if (sort === "rating_desc") organic.sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0))
    if (sort === "created_desc") organic.sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

    // Enforce caps and final limit
    const f10 = featuredF.slice(0, 10)
    const s20 = sponsoredF.slice(0, 20)
    const remaining = Math.max(0, limit - (f10.length + s20.length))
    const tail = remaining ? organic.slice(0, remaining) : []
    return [...f10, ...s20, ...tail]
  } catch {
    // Fallback: single query then group in-memory
    const snap = await db.collection("listings").where("approved", "==", true).orderBy("createdAt", "desc").limit(200).get()
    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    const qLower = q.toLowerCase()
    const allowedCats = cats.length ? new Set(cats) : (cat ? new Set([cat]) : null)
    function matches(it: any) {
      const name = String(it?.name || it?.listingName || "").toLowerCase()
      const category = String(it?.category || it?.listingType || "")
      const matchesQ = q ? name.includes(qLower) : true
      const matchesCat = allowedCats ? allowedCats.has(category) : true
      return matchesQ && matchesCat
    }
    const featured = all.filter((x) => x?.activePlan?.type === "featured" && Number(x?.activePlan?.endAt || 0) > now)
    const sponsored = all.filter((x) => x?.activePlan?.type === "sponsored" && Number(x?.activePlan?.endAt || 0) > now)
    const used = new Set<string>([...featured, ...sponsored].map((x) => String((x as any).id)))
    let organic = all.filter((x) => !used.has(String((x as any).id)))

    const featuredF = featured.filter(matches).slice(0, 10)
    const sponsoredF = sponsored.filter(matches).slice(0, 20)
    organic = organic.filter(matches)
    if (sort === "rating_desc") organic.sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0))
    if (sort === "created_desc") organic.sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

    const remaining = Math.max(0, limit - (featuredF.length + sponsoredF.length))
    const tail = remaining ? organic.slice(0, remaining) : []
    return [...featuredF, ...sponsoredF, ...tail]
  }
}
