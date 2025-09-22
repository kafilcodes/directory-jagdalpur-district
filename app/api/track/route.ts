import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { checkRate } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const limited = checkRate(req, "/api/track", 30, 60_000)
    if (!limited.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })
    }
    const body = await req.json()
    const payload = {
      type: String(body?.type || "unknown"),
      listingId: body?.listingId || null,
      path: body?.path || null,
      referrer: body?.referrer || null,
      userAgent: req.headers.get("user-agent"),
      timestamp: Date.now(),
      meta: body?.meta || {},
    }
    const db = getAdminDb()
    await db.collection("analyticsEvents").add(payload)
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
