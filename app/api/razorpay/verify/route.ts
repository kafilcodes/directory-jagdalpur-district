import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId, signature } = (await req.json()) as {
      orderId?: string
      paymentId?: string
      signature?: string
    }
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ ok: false, error: "MISSING_PARAMS" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || ""
    if (!secret) return NextResponse.json({ ok: false, error: "MISSING_SECRET" }, { status: 500 })

    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
    const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))

    if (!valid) return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

