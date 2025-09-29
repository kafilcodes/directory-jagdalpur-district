"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ListingSchema } from "@/lib/validators/listing"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

import { PLANS } from "@/lib/plans"

export default function ListingFormClient({ action, initialValues }: { action: (fd: FormData) => Promise<any>, initialValues?: Partial<z.infer<typeof ListingSchema>> }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [successOpen, setSuccessOpen] = useState(false)
  const [countdown, setCountdown] = useState(8)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const hasRazorpayKey = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  useEffect(() => {
    if (!successOpen) return
    setCountdown(8)
    const id = setInterval(() => setCountdown((s) => s - 1), 1000)
    const t = setTimeout(() => {
      setSuccessOpen(false)
      router.push("/dashboard/my-listings")
    }, 8000)
    return () => { clearInterval(id); clearTimeout(t) }
  }, [successOpen, router])

  const [selectedPlan, setSelectedPlan] = useState<"free" | "featured">("free")
  const form = useForm<z.infer<typeof ListingSchema>>({
    resolver: zodResolver(ListingSchema),
    defaultValues: { name: "", category: "", address: "", phone: "", email: "", website: "", ...(initialValues || {}) },
  })

  async function loadRazorpay() {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return resolve()
      if ((window as any).Razorpay) return resolve()
      const s = document.createElement("script")
      s.src = "https://checkout.razorpay.com/v1/checkout.js"
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("Failed to load Razorpay"))
      document.body.appendChild(s)
    })
  }

  const onSubmit = async (values: z.infer<typeof ListingSchema>) => {
    try {
      setLoading(true)
      const formData = new FormData()
      Object.entries(values).forEach(([k, v]) => {
        if (v) formData.append(k, String(v))
      })
      const fileInput = document.getElementById("photo") as HTMLInputElement | null
      if (fileInput?.files && fileInput.files[0]) {
        formData.append("photo", fileInput.files[0])
      }
      // If featured plan, take payment first
      if (selectedPlan === "featured") {
        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
        if (!key) {
          toast.error("Missing Razorpay key. Set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local")
          return
        }
        await loadRazorpay()
        const amount = PLANS.featured.pricePaise
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency: "INR" }),
        }).then((r) => r.json())
        if (!orderRes?.ok) {
          toast.error("Failed to create order")
          return
        }
        const orderId = orderRes.order.id

        const options: any = {
          key,
          amount,
          currency: "INR",
          name: "Dhamtari Directory",
          description: "Featured Listing",
          order_id: orderId,
          prefill: {
            name: values.name,
            email: values.email || undefined,
            contact: values.phone || undefined,
          },
          theme: { color: "#EF4444" },
        }

        const paymentResult = await new Promise<{ paymentId: string; signature: string } | null>((resolve) => {
          options.handler = function (resp: any) {
            resolve({ paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature })
          }
          options.modal = { ondismiss: () => resolve(null) }
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        })

        if (!paymentResult) {
          toast.error("Payment cancelled")
          return
        }

        const verify = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId: paymentResult.paymentId, signature: paymentResult.signature }),
        }).then((r) => r.json())

        if (!verify?.ok) {
          toast.error("Payment verification failed")
          return
        }

        // attach plan + payment meta
        formData.append("plan", "featured")
        formData.append("paymentStatus", "paid")
        formData.append("orderId", orderId)
        formData.append("paymentId", paymentResult.paymentId)
        formData.append("signature", paymentResult.signature)
      } else {
        formData.append("plan", "free")
        formData.append("paymentStatus", "unpaid")
      }

      const res = await action(formData)
      if (res?.ok) {
        toast.success(selectedPlan === "featured" ? "Submitted as Featured! Pending approval." : "Submitted! Pending approval.")
        form.reset()
        setSelectedPlan("free")
        setSuccessOpen(true)
      } else if (res?.errors) {
        toast.error("Please fix the highlighted errors.")
        const errs = res.errors.fieldErrors || {}
        Object.entries(errs).forEach(([k, v]) => {
          if (Array.isArray(v) && v[0]) form.setError(k as any, { message: v[0] as string })
        })
      } else {
        toast.error("Submission failed. Try again.")
      }
    } catch {
      toast.error("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const [placeInput, setPlaceInput] = useState("")

  async function autofillFromGoogle() {
    try {
      const placeIdMatch = placeInput.match(/[?&]placeid=([^&]+)/i) || placeInput.match(/place\/details\/(.*)/i)
      const placeId = placeIdMatch ? decodeURIComponent(placeIdMatch[1]) : ""
      const params = placeId ? `mode=details&place_id=${encodeURIComponent(placeId)}` : `mode=autocomplete&input=${encodeURIComponent(placeInput)}`
      const res = await fetch(`/api/google-places-proxy?${params}`)
      const json = await res.json()
      const data = json?.data || {}
      const details = data.result || data.predictions?.[0] || null
      if (!details) return toast.error("No place data found")
      const name = details.name || details.structured_formatting?.main_text || ""
      const address = details.formatted_address || details.description || ""
      const phone = details.formatted_phone_number || ""
      form.setValue("name", name)
      form.setValue("address", address)
      if (phone) form.setValue("phone", phone)
      toast.success("Autofilled from Google")
    } catch {
      toast.error("Failed to fetch Google details")
    }
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md border p-3 bg-gray-50">
          <Label htmlFor="place">Google Places URL or Place ID</Label>
          <div className="mt-1 flex gap-2">
            <Input id="place" value={placeInput} onChange={(e) => setPlaceInput(e.target.value)} placeholder="Paste URL or Place ID" />
            <Button type="button" variant="secondary" onClick={autofillFromGoogle}>Autofill</Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">We only use this to prefill your form. You can edit any field.</p>
        </div>

        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message as string}</p>
          )}
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...form.register("category")} aria-invalid={!!form.formState.errors.category} />
          {form.formState.errors.category && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.category.message as string}</p>
          )}
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} aria-invalid={!!form.formState.errors.address} />
          {form.formState.errors.address && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.address.message as string}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...form.register("website")} />
        </div>
        <div>
          <Label htmlFor="photo">Photo</Label>
          <Input id="photo" type="file" accept="image/*" />
        </div>
        <div className="rounded-md border p-3">
          <Label>Package</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" className={`rounded-md border p-3 text-left hover:bg-gray-50 ${selectedPlan === "free" ? "ring-2 ring-red-500" : ""}`} onClick={() => setSelectedPlan("free")}>Free — {PLANS.free.display}</button>
            <button type="button" disabled={!hasRazorpayKey} aria-disabled={!hasRazorpayKey} title={!hasRazorpayKey ? "Razorpay key missing; contact admin" : undefined} className={`rounded-md border p-3 text-left hover:bg-gray-50 ${selectedPlan === "featured" ? "ring-2 ring-red-500" : ""} ${!hasRazorpayKey ? "opacity-50 cursor-not-allowed" : ""}`} onClick={() => hasRazorpayKey && setSelectedPlan("featured")}>Featured — {PLANS.featured.display}</button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Featured includes homepage highlight and priority placement.</p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit listing"}
        </Button>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Listing submitted</DialogTitle>
            <DialogDescription>
              Thanks! We received your submission. You will be redirected to My Listings in {countdown}s.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {createdId && (
              <Button type="button" variant="secondary" onClick={() => { setSuccessOpen(false); router.push(`/listing/${createdId}`) }}>
                View listing
              </Button>
            )}
            <Button type="button" onClick={() => { setSuccessOpen(false); router.push("/dashboard/my-listings") }}>
              Go now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
