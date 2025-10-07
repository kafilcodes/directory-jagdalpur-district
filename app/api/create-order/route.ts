import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import Razorpay from "razorpay"

export const runtime = "nodejs"

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { amount, plan } = await req.json()

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { ok: false, error: "Invalid amount" },
                { status: 400 }
            )
        }

        // Validate plan
        if (!['free', 'sponsored', 'featured'].includes(plan)) {
            return NextResponse.json(
                { ok: false, error: "Invalid plan" },
                { status: 400 }
            )
        }

        // Free plan should not create order
        if (plan === 'free') {
            return NextResponse.json(
                { ok: false, error: "Free plan does not require payment" },
                { status: 400 }
            )
        }

        // Create Razorpay order
        const order: any = await razorpay.orders.create({
            amount: amount, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user.uid,
                userEmail: user.email || '',
                plan: plan,
            },
        })

        return NextResponse.json({
            ok: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        })
    } catch (error: any) {
        console.error("Create order error:", error)
        return NextResponse.json(
            { ok: false, error: error.message || "Failed to create order" },
            { status: 500 }
        )
    }
}
