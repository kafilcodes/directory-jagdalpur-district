import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = context.params as { id: string }
    const db = getAdminDb()
    const snap = await db.collection("listings").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, data: snap.data() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}
