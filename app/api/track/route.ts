import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: NextRequest) {
  try {
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
    await adminDb.collection("analyticsEvents").add(payload)
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
