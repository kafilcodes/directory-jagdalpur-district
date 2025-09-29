import { NextResponse } from "next/server"
import { trackClick } from "@/app/actions/searchActions"

export async function POST(req: Request) {
  try {
    const { listingId, q } = await req.json()
    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_listingId" }, { status: 400 })
    }
    const term = typeof q === "string" ? q : ""
    if (!term) return NextResponse.json({ ok: false, error: "empty_term" }, { status: 400 })
    const r = await trackClick(listingId, term)
    return NextResponse.json(r)
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
  }
}

