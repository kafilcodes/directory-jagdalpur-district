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
          name: process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 md:space-y-5">
        <div className="rounded-md border p-2.5 sm:p-3 md:p-4 bg-gray-50">
          <Label htmlFor="place" className="text-sm sm:text-sm md:text-base font-medium">Google Places URL or Place ID</Label>
          <div className="mt-1.5 sm:mt-2 flex flex-col sm:flex-row gap-2">
            <Input
              id="place"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              placeholder="Paste URL or Place ID"
              className="h-10 sm:h-10 md:h-11 text-sm sm:text-base flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={autofillFromGoogle}
              className="h-10 sm:h-10 md:h-11 w-full sm:w-auto px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
            >
              Autofill
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">We only use this to prefill your form. You can edit any field.</p>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-sm md:text-base font-medium">Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            {...form.register("name")}
            aria-invalid={!!form.formState.errors.name}
            className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
            placeholder="Business name"
          />
          {form.formState.errors.name && (
            <p className="text-[10px] sm:text-xs text-red-600 mt-1">{form.formState.errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="category" className="text-sm sm:text-sm md:text-base font-medium">Category <span className="text-red-500">*</span></Label>
          <Input
            id="category"
            {...form.register("category")}
            aria-invalid={!!form.formState.errors.category}
            className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
            placeholder="e.g., Restaurant, Hotel, Healthcare"
          />
          {form.formState.errors.category && (
            <p className="text-[10px] sm:text-xs text-red-600 mt-1">{form.formState.errors.category.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="address" className="text-sm sm:text-sm md:text-base font-medium">Address <span className="text-red-500">*</span></Label>
          <Input
            id="address"
            {...form.register("address")}
            aria-invalid={!!form.formState.errors.address}
            className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
            placeholder="Full business address"
          />
          {form.formState.errors.address && (
            <p className="text-[10px] sm:text-xs text-red-600 mt-1">{form.formState.errors.address.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-sm md:text-base font-medium">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
              placeholder="Contact number"
              type="tel"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-sm md:text-base font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
              placeholder="Email address"
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="website" className="text-sm sm:text-sm md:text-base font-medium">Website</Label>
          <Input
            id="website"
            {...form.register("website")}
            className="h-10 sm:h-10 md:h-11 text-sm sm:text-base"
            placeholder="https://example.com"
            type="url"
          />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="photo" className="text-sm sm:text-sm md:text-base font-medium">Photo</Label>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            className="h-10 sm:h-10 md:h-11 text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
          />
          <p className="text-[10px] sm:text-xs text-gray-500">Upload business photo (optional)</p>
        </div>

        <div className="rounded-md border p-2.5 sm:p-3 md:p-4 bg-gray-50">
          <Label className="text-sm sm:text-base md:text-base font-medium">Choose Your Package</Label>
          <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
            <button
              type="button"
              className={`rounded-md border p-3 sm:p-3.5 md:p-4 text-left transition-all duration-200 hover:bg-gray-50 hover:shadow-md ${selectedPlan === "free" ? "ring-2 ring-red-500 bg-white shadow-md" : "bg-white"}`}
              onClick={() => setSelectedPlan("free")}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-semibold text-sm sm:text-base text-gray-900">Free</span>
                {selectedPlan === "free" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{PLANS.free.display}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">Basic visibility</p>
            </button>

            <button
              type="button"
              disabled={!hasRazorpayKey}
              aria-disabled={!hasRazorpayKey}
              title={!hasRazorpayKey ? "Razorpay key missing; contact admin" : undefined}
              className={`rounded-md border p-3 sm:p-3.5 md:p-4 text-left transition-all duration-200 hover:bg-gray-50 hover:shadow-md ${selectedPlan === "featured" ? "ring-2 ring-red-500 bg-white shadow-md" : "bg-white"} ${!hasRazorpayKey ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => hasRazorpayKey && setSelectedPlan("featured")}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-semibold text-sm sm:text-base text-gray-900">Featured</span>
                {selectedPlan === "featured" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{PLANS.featured.display}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">Priority placement</p>
            </button>
          </div>
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500 leading-relaxed">Featured includes homepage highlight and priority placement in search results.</p>
        </div>

        <div className="pt-2 sm:pt-3 md:pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 sm:h-11 md:h-12 text-sm sm:text-base font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Listing"
            )}
          </Button>
        </div>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent showCloseButton className="sm:max-w-md max-w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Listing Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Thanks! We received your submission. You will be redirected to My Listings in <span className="font-semibold text-red-600">{countdown}s</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            {createdId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setSuccessOpen(false); router.push(`/listing/${createdId}`) }}
                className="w-full sm:w-auto h-10 sm:h-10 text-sm sm:text-base"
              >
                View Listing
              </Button>
            )}
            <Button
              type="button"
              onClick={() => { setSuccessOpen(false); router.push("/dashboard/my-listings") }}
              className="w-full sm:w-auto h-10 sm:h-10 text-sm sm:text-base"
            >
              Go to My Listings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
