import { NextRequest, NextResponse } from "next/server"
import { getAdminDb, FieldValue } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(_req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development" && process.env.ALLOW_DEV_SEED !== "1") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }
    const db = getAdminDb()
    const now = Date.now()

    const sample = [
      { name: "Sunrise Hotel", category: "Hotels", approved: true, activePlan: { type: "featured", startAt: now, endAt: now + 7*24*60*60*1000 }, address: { line1: "Main Road" }, photos: ["/bg.png"], rating: 4.6 },
      { name: "Blue Spice Restaurant", category: "Restaurants", approved: true, activePlan: { type: "sponsored", startAt: now, endAt: now + 7*24*60*60*1000 }, address: { line1: "Market Street" }, photos: ["/bg.png"], rating: 4.2 },
      { name: "Healthy Life Clinic", category: "Healthcare", approved: true, address: { line1: "Central Ave" }, photos: ["/bg.png"], rating: 4.0 },
    ]

    const batch = db.batch()
    for (const s of sample) {
      const ref = db.collection("listings").doc()
      batch.set(ref, { ...s, createdAt: now, updatedAt: now, stats: { views: 0, clicks: 0 } })
      // initialize listingStats doc
      const statsRef = db.collection("listingStats").doc(ref.id)
      batch.set(statsRef, { views_total: 0, clicks_total: 0, lastEventAt: FieldValue.serverTimestamp?.() || now })
    }
    await batch.commit()

    return NextResponse.json({ ok: true, created: sample.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

