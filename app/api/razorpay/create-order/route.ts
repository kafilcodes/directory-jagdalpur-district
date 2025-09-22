import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getRazorpay } from "@/lib/payments/razorpay"

export const runtime = "nodejs"

const CreateOrderSchema = z.object({
  amount: z.number().int().positive(), // amount in paise
  currency: z.string().default("INR"),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = CreateOrderSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { amount, currency, receipt, notes } = parsed.data
    const razorpay = getRazorpay()

    const order = await razorpay.orders.create({ amount, currency, receipt, notes })

    return NextResponse.json({ ok: true, order }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}
