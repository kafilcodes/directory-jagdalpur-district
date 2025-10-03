import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"
import { z } from "zod"

export async function GET(req: NextRequest, context: any) {
  try {
    const params = await context.params
    const { id } = params as { id: string }
    const db = getAdminDb()
    const snap = await db.collection("listings").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, data: snap.data() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.any().optional(),
  phone: z.string().min(7).max(20).optional(),
  description: z.string().min(0).max(1000).optional(),
  hours: z.any().optional(),
})

export async function PATCH(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

    const params = await context.params
    const { id } = params as { id: string }

    const json = await req.json()
    const parsed = UpdateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })

    const db = getAdminDb()
    const ref = db.collection("listings").doc(id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    const data = snap.data() as any
    if (data.ownerUid !== user.uid) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })

    const updates: any = { updatedAt: Date.now() }
    if (parsed.data.name !== undefined) updates.name = parsed.data.name
    if (parsed.data.address !== undefined) updates.address = parsed.data.address
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone
    if (parsed.data.description !== undefined) updates.description = parsed.data.description
    if (parsed.data.hours !== undefined) updates.hours = parsed.data.hours

    await ref.set(updates, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}
