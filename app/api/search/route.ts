import { NextRequest, NextResponse } from "next/server"
import { searchListings } from "@/lib/search/server"
import { getCachedSearch, setCachedSearch } from "@/lib/cache/listingsCache"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get("q") || "")
  const catsParam = searchParams.get("cats")
  const limit = Number(searchParams.get("limit") || 10)
  const sort = String(searchParams.get("sort") || "relevance")
  const filter = String(searchParams.get("filter") || "")
  const cats = catsParam ? catsParam.split(",").filter(Boolean) : []

  try {
    // Return empty results for empty queries instead of error
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ ok: true, data: [] })
    }

    // Check cache first (5-minute TTL configured in listingsCache.ts)
    const cached = getCachedSearch(q, cats, sort, filter)
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, cached: true })
    }

    // Fetch from database if not cached
    const data = await searchListings({ q, cats, limit, sort })

    // Store in cache for future requests
    setCachedSearch(q, data, cats, sort, filter)

    return NextResponse.json({ ok: true, data, cached: false })
  } catch (e: any) {
    console.error("[API /api/search] Error:", e)
    // Return empty results on error to prevent UI breakage
    return NextResponse.json({ ok: true, data: [], error: e?.message || "search_error" })
  }
}

