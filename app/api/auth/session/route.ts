import { NextRequest, NextResponse } from "next/server"
import { getAdminApp } from "@/lib/firebase/admin"

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ ok: false }, { status: 400 })
    const admin = getAdminApp()
    const decoded = await admin.auth().verifyIdToken(idToken)
    const res = NextResponse.json({ ok: true, uid: decoded.uid })
    res.cookies.set("session", idToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("session", "", { httpOnly: true, expires: new Date(0), path: "/" })
  return res
}
