import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { cookies } from "next/headers"
import { getAdminApp, getAdminDb, FieldValue } from "@/lib/firebase/admin"

export const runtime = "nodejs"

const VerifySchema = z.object({
  orderId: z.string().min(5),
  paymentId: z.string().min(5),
  signature: z.string().min(5),
  amount: z.number().int().positive(), // paise
  listingId: z.string().optional(),
  planType: z.enum(["featured", "sponsored"]).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = VerifySchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })

    const { orderId, paymentId, signature, amount, listingId, planType } = parsed.data

    const secret = process.env.RAZORPAY_KEY_SECRET || ""
    if (!secret) return NextResponse.json({ ok: false, error: "Missing Razorpay secret" }, { status: 500 })

    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
    const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    if (!valid) return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 })

    // Try to resolve current user from session for receipt owner
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    let userUid: string | null = null
    try {
      if (token) {
        const admin = getAdminApp()
        const decoded = await admin.auth().verifyIdToken(token)
        userUid = decoded.uid || null
      }
    } catch {}

    const db = getAdminDb()

    // Create receipt first
    const receiptRef = db.collection("receipts").doc()
    const now = Date.now()
    const receipt = {
      id: receiptRef.id,
      userUid,
      listingId: listingId || null,
      amount,
      planType: planType || null,
      paymentId,
      orderId,
      ts: now,
    }
    await receiptRef.set(receipt)

    // Optionally update listing activePlan if listingId + planType provided
    if (listingId && planType) {
      const startAt = now
      const endAt = now + 7 * 24 * 60 * 60 * 1000 // 1 week TTL
      const lref = db.collection("listings").doc(listingId)
      await lref.set(
        {
          activePlan: { type: planType, startAt, endAt },
          status: "active",
          planHistory: FieldValue.arrayUnion({ type: planType, startAt, endAt, paymentId, orderId, amount, receiptId: receiptRef.id }),
          updatedAt: now,
        },
        { merge: true }
      )
    }

    return NextResponse.json({ ok: true, receiptId: receiptRef.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

