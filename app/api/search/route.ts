import { NextRequest, NextResponse } from "next/server"
import { searchListings } from "@/lib/search/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get("q") || "")
  const catsParam = searchParams.get("cats")
  const limit = Number(searchParams.get("limit") || 10)
  const sort = String(searchParams.get("sort") || "relevance")
  const cats = catsParam ? catsParam.split(",").filter(Boolean) : []

  try {
    const data = await searchListings({ q, cats, limit, sort })
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

