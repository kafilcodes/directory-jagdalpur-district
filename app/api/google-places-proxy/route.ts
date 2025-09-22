import { NextRequest, NextResponse } from "next/server"
import { LRUCache } from "lru-cache"

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 10,
})

async function googleFetch(path: string, params: Record<string, string>) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new Error("Missing GOOGLE_PLACES_API_KEY")
  const qs = new URLSearchParams({ ...params, key })
  const url = `https://maps.googleapis.com/maps/api/place/${path}/json?${qs.toString()}`
  const res = await fetch(url, { next: { revalidate: 600 } })
  if (!res.ok) throw new Error("Google API error")
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("mode") || "autocomplete"
    const input = searchParams.get("input") || ""
    const placeId = searchParams.get("place_id") || ""
    const key = `${mode}:${input}:${placeId}`

    if (cache.has(key)) {
      return NextResponse.json({ fromCache: true, data: cache.get(key) }, { status: 200 })
    }

    let data
    if (mode === "details" && placeId) {
      data = await googleFetch("details", { place_id: placeId })
    } else {
      data = await googleFetch("autocomplete", { input })
    }

    cache.set(key, data)
    return NextResponse.json(
      { fromCache: false, data },
      { status: 200, headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
    )
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
