import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

// Razorpay API credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const paymentId = searchParams.get("paymentId")

        if (!paymentId) {
            return NextResponse.json(
                { error: "Payment ID is required" },
                { status: 400 }
            )
        }

        // Fetch payment from Razorpay API
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")

        const response = await fetch(
            `https://api.razorpay.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch payment from Razorpay")
        }

        const paymentData = await response.json()

        // If there's an invoice ID, fetch the invoice
        if (paymentData.invoice_id) {
            const invoiceResponse = await fetch(
                `https://api.razorpay.com/v1/invoices/${paymentData.invoice_id}`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                    },
                }
            )

            if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json()
                return NextResponse.json(invoiceData)
            }
        }

        // Return payment data if no invoice
        return NextResponse.json({
            ...paymentData,
            short_url: null, // No invoice available
        })
    } catch (error) {
        console.error("[API /api/razorpay/invoice] Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch invoice" },
            { status: 500 }
        )
    }
}
