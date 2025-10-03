"use client"
import React from "react"

declare global {
  interface Window {
    Razorpay?: any
  }
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve()
    if (window.Razorpay) return resolve()
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(s)
  })
}

export default function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  label = "Pay Now",
  listingId,
  planType,
}: {
  amount: number // in paise
  currency?: string
  label?: string
  listingId?: string
  planType?: "featured" | "sponsored"
}) {
  const onClick = async () => {
    await loadRazorpay()
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency }),
    }).then((r) => r.json())

    if (!res?.ok) return alert("Failed to create order")

    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
    if (!key) {
      alert("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID")
      return
    }

    const options = {
      key,
      amount,
      currency,
      name: "Dhamtari Directory",
      description: "Test Transaction",
      order_id: res.order.id,
      handler: async function (response: any) {
        try {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response || {}
          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return alert("Missing payment response")
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              signature: razorpay_signature,
              amount,
              listingId,
              planType,
            }),
          }).then((r) => r.json())
          if (!verify?.ok) return alert("Verification failed")
          alert("Payment verified. Receipt: " + verify.receiptId)
        } catch (e) {
          alert("Verification error")
        }
      },
      prefill: {},
      theme: { color: "#EF4444" },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <button className="px-4 py-2 rounded-md bg-accent-500 text-white" onClick={onClick}>
      {label}
    </button>
  )
}
