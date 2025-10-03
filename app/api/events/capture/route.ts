import { NextRequest, NextResponse } from "next/server"
import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import { checkRate } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const rate = checkRate(req, "/api/events/capture", 20, 60_000) // 20 per minute per IP
    if (!rate.allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })

    const { type, listingId, meta } = await req.json()
    if (!listingId || !type) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })

    const db = getAdminDb()
    const now = Date.now()

    // Append event
    const evRef = db.collection("listingEvents").doc(String(listingId)).collection("events").doc()
    await evRef.set({ type, meta: meta || null, ts: now })

    // Increment counters atomically
    const statsRef = db.collection("listingStats").doc(String(listingId))
    const increments: any = { lastEventAt: now }
    if (type === "view") increments.views_total = FieldValue.increment(1)
    if (type === "click") increments.clicks_total = FieldValue.increment(1)
    await statsRef.set(increments, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

