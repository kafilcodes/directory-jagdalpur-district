import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function mapListing(id: string, data: any) {
  const x = data || {}
  return {
    id,
    name: x.name || x.listingName || "",
    category: x.category || x.listingType || "",
    address: x.address?.line1 || x.address || "",
    rating: typeof x.rating === "number" ? x.rating : null,
    price: x.price || null,
    image: x.photos?.[0] || x.photoUrl || "/bg.png",
    approved: !!x.approved,
    activeType: x.activePlan?.type || null,
    activeEndAt: x.activePlan?.endAt || null,
  }
}
function stripPrivate(x: any) {
  // remove fields not needed by client
  const { approved, activeType, activeEndAt, ...rest } = x
  return rest
}

export async function GET(_req: NextRequest) {
  try {
    const db = getAdminDb()
    const now = Date.now()
    let items: any[] = []
    try {
      const snap = await db
        .collection("listings")
        .where("approved", "==", true)
        .where("activePlan.type", "==", "featured")
        .where("activePlan.endAt", ">", now)
        .limit(10)
        .get()
      items = snap.docs.map((d) => mapListing(d.id, d.data()))
    } catch (err: any) {
      console.error("[featured] primary query failed", { code: err?.code, message: err?.message })
      // Fallback when composite index is missing: query by type only, filter in memory
      const snap = await db
        .collection("listings")
        .where("activePlan.type", "==", "featured")
        .limit(100)
        .get()
      items = snap.docs
        .map((d) => mapListing(d.id, d.data()))
        .filter((x) => x.approved === true && Number(x.activeEndAt || 0) > now)
        .slice(0, 10)
        .map(stripPrivate)
    }

    // If we got mapped from primary path, strip private fields
    if (items.length && items[0].approved !== undefined) items = items.map(stripPrivate)

    // Fallback: if no featured listings, return random approved listings
    if (items.length === 0) {
      try {
        const snap = await db
          .collection("listings")
          .where("approved", "==", true)
          .limit(50)
          .get()
        const all = snap.docs.map((d) => mapListing(d.id, d.data())).map(stripPrivate)
        // Randomize and take up to 10
        items = all.sort(() => Math.random() - 0.5).slice(0, 10)
      } catch (fallbackErr) {
        console.error("[featured] fallback to random approved failed", fallbackErr)
      }
    }

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    console.error("/api/listings/featured failed", e)
    if (e?.code === 5 || /NOT_FOUND/i.test(String(e?.message || ""))) {
      // Database or collection missing: return empty list instead of 500
      return NextResponse.json({ ok: true, items: [], note: "firestore_not_found" }, { status: 200 })
    }
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

