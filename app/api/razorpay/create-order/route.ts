import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getRazorpay } from "@/lib/payments/razorpay"

export const runtime = "nodejs"

const CreateOrderSchema = z.object({
  amount: z.number().positive(), // amount in rupees (will be converted to paise)
  planType: z.enum(['free', 'sponsored', 'featured']),
  listingTitle: z.string().optional(),
  currency: z.string().default("INR"),
  receipt: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = CreateOrderSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: parsed.error.flatten()
      }, { status: 400 })
    }

    const { amount, planType, listingTitle, currency } = parsed.data
    const razorpay = getRazorpay()

    // Convert amount to paise
    const amountInPaise = Math.round(amount * 100)

    // Create order with notes
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        planType,
        listingTitle: listingTitle || 'New Listing',
        createdAt: new Date().toISOString(),
      }
    })

    console.log('Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
      planType,
    })

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      }
    }, { status: 200 })
  } catch (e: any) {
    console.error('Create Order Error:', e)
    return NextResponse.json({
      success: false,
      error: e?.message || "Failed to create order"
    }, { status: 500 })
  }
}
