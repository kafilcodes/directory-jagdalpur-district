import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || ""
    const secret = process.env.AGGREGATION_SECRET || ""
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    const db = getAdminDb()
    const shards = await db.collection("search").get()

    const agg: Record<string, { imp: number; clk: number; keywords: Record<string, { imp: number; clk: number }> }> = {}

    shards.docs.forEach((doc) => {
      const data = doc.data() as any
      const index = data?.index || {}
      for (const [term, listings] of Object.entries<any>(index)) {
        for (const [listingId, entry] of Object.entries<any>(listings)) {
          const a = (agg[listingId] = agg[listingId] || { imp: 0, clk: 0, keywords: {} })
          const imp = Number((entry as any)?.imp || 0)
          const clk = Number((entry as any)?.clk || 0)
          a.imp += imp
          a.clk += clk
          const kw = (a.keywords[term] = a.keywords[term] || { imp: 0, clk: 0 })
          kw.imp += imp
          kw.clk += clk
        }
      }
    })

    const batch = db.batch()
    for (const [listingId, data] of Object.entries(agg)) {
      const topKeywords = Object.entries(data.keywords)
        .map(([term, v]) => ({ term, imp: v.imp, clk: v.clk }))
        .sort((a, b) => b.imp + b.clk - (a.imp + a.clk))
        .slice(0, 10)
      const ref = db.collection("listingStats").doc(listingId)
      batch.set(ref, {
        totalImpressions: data.imp,
        totalClicks: data.clk,
        topKeywords,
        lastAggregated: Date.now(),
      }, { merge: true })
    }
    await batch.commit()

    return NextResponse.json({ ok: true, listings: Object.keys(agg).length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

