import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { listingId, orderId, paymentId, plan, amount } = body

        if (!listingId || !orderId || !paymentId || !plan) {
            return NextResponse.json(
                { ok: false, error: "missing_required_fields" },
                { status: 400 }
            )
        }

        const db = getAdminDb()
        const paymentsRef = db.collection("listings_payments")

        // Create payment record
        const paymentDoc = {
            listingId,
            orderId,
            paymentId,
            plan,
            amount: amount || 0,
            userId: user.uid,
            userEmail: user.email || '',
            status: 'completed',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        const docRef = await paymentsRef.add(paymentDoc)

        return NextResponse.json({ ok: true, id: docRef.id, payment: paymentDoc })
    } catch (error: any) {
        console.error('Payment record error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "error" },
            { status: 500 }
        )
    }
}
