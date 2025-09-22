import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { adminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") || ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ""
  if (!secret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 })

  const bodyText = await req.text()
  const expected = crypto.createHmac("sha256", secret).update(bodyText).digest("hex")

  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(bodyText)

  const id = String(event?.payload?.payment?.entity?.id || event?.id || "")
  if (id) {
    const ref = adminDb.collection("analyticsEvents").doc(`razorpay:${id}`)
    const snap = await ref.get()
    if (!snap.exists) {
      await ref.set({
        type: "razorpay.webhook",
        timestamp: Date.now(),
        eventType: event?.event || "unknown",
        payload: event,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
