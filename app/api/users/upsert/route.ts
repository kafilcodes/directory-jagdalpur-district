import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAdminApp, getAdminDb, FieldValue } from "@/lib/firebase/admin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    if (!token) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 })

    const admin = getAdminApp()
    const decoded = await admin.auth().verifyIdToken(token)

    const uid = decoded.uid
    const email = decoded.email || undefined
    const displayName = decoded.name || decoded.displayName || undefined
    const photoURL = decoded.picture || decoded.photoURL || undefined

    const db = getAdminDb()
    const ref = db.collection("users").doc(uid)

    let snap
    try {
      snap = await ref.get()
    } catch (getError) {
      // Collection might not exist yet - that's okay
      snap = null
    }

    const now = Date.now()
    const data: any = {
      uid,
      email,
      displayName,
      photoURL,
      updatedAt: now,
    }

    // Default role only if not set before
    if (!snap || !snap.exists || !snap.data()?.role) {
      data.role = "business"
    }
    if (!snap || !snap.exists || !snap.data()?.createdAt) {
      data.createdAt = now
    }

    await ref.set(data, { merge: true })

    return NextResponse.json({ ok: true, uid, role: data.role || (snap?.data()?.role) || null })
  } catch (e: any) {
    console.error('[users/upsert] Error:', e)
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

