"use client"
import * as React from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FormValues = {
  placeQuery: string
  businessName: string
  categorySlug: string
  addressLine: string
  confirm: boolean
  plan: "free" | "sponsored" | "featured"
}

export default function CreateListingForm() {
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { plan: "free" } as any,
  })
  const [prefill, setPrefill] = React.useState<any | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function fetchPlace() {
    setError(null)
    const q = watch("placeQuery")?.trim()
    if (!q) return setError("Enter a Google Places URL or place name")
    try {
      // If URL has place_id, try details; otherwise autocomplete and pick first
      let placeId = ""
      try {
        const url = new URL(q)
        const pid = url.searchParams.get("place_id") || url.pathname.split("/").find((s) => s.startsWith("Ch"))
        if (pid) placeId = pid
      } catch {}

      if (placeId) {
        const res = await fetch(`/api/google-places-proxy?mode=details&place_id=${encodeURIComponent(placeId)}`)
        const json = await res.json()
        const r = json?.data?.result
        if (r) applyPrefill(r)
        else setError("No details found for that place")
      } else {
        const res = await fetch(`/api/google-places-proxy?mode=autocomplete&input=${encodeURIComponent(q)}`)
        const json = await res.json()
        const first = json?.data?.predictions?.[0]
        if (first?.place_id) {
          const r2 = await fetch(`/api/google-places-proxy?mode=details&place_id=${encodeURIComponent(first.place_id)}`).then((r) => r.json())
          const r = r2?.data?.result
          if (r) applyPrefill(r)
          else setError("No details found for that place")
        } else {
          setError("No matches; try a different query")
        }
      }
    } catch (e:any) {
      setError(e?.message || "Failed to fetch place")
    }
  }

  function applyPrefill(r: any) {
    setPrefill(r)
    const name = r?.name || ""
    const addr = r?.formatted_address || ""
    setValue("businessName", name)
    setValue("addressLine", addr)
  }

  async function onSubmit(values: FormValues) {
    setError(null)
    if (!values.confirm) { setError("Please confirm the information is accurate."); return }
    if (!values.businessName || !values.categorySlug) { setError("Name and category are required"); return }

    // Create listing (free). For paid plans, the owner can upgrade after creation (safer UX)
    const payload = {
      businessName: values.businessName.trim(),
      categorySlug: values.categorySlug.trim(),
      isPublic: true,
      address: values.addressLine ? { line1: values.addressLine } : undefined,
      googleData: prefill || undefined,
    }
    const res = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (!json?.ok) { setError(json?.error ? String(json.error) : "Failed to create"); return }

    // If a paid plan was selected, navigate to dashboard to upgrade
    if (values.plan !== "free") {
      window.location.href = "/dashboard"
      return
    }

    window.location.href = "/my-listing"
  }

  const plan = watch("plan")

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="placeQuery">Google Places URL or name</Label>
          <div className="flex gap-2">
            <Input id="placeQuery" placeholder="https://maps.google.com/... or business name" {...register("placeQuery")} />
            <Button type="button" onClick={fetchPlace} variant="secondary">Prefill</Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {prefill && (
          <div className="rounded-md border p-3 text-sm bg-white">
            <div className="font-medium">Prefilled</div>
            <div className="text-gray-600">{prefill?.name} — {prefill?.formatted_address}</div>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" placeholder="Your business name" {...register("businessName")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categorySlug">Category</Label>
          <Input id="categorySlug" placeholder="e.g., restaurants, clinics, plumbers" {...register("categorySlug")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="addressLine">Address</Label>
          <Textarea id="addressLine" placeholder="Street, area, city" {...register("addressLine")} />
        </div>

        <div className="flex items-center gap-2">
          <input id="confirm" type="checkbox" {...register("confirm")} className="h-4 w-4" />
          <Label htmlFor="confirm">I confirm the information provided is accurate and I agree to the listing terms.</Label>
        </div>

        <div className="grid gap-2">
          <Label>Plan</Label>
          <div className="grid sm:grid-cols-3 gap-2">
            <button type="button" onClick={() => setValue("plan", "free")} className={`border rounded-md p-3 text-left ${plan === "free" ? "border-red-500" : "border-gray-200"}`}>
              <div className="font-medium">Free</div>
              <div className="text-sm text-gray-600">Standard visibility</div>
            </button>
            <button type="button" onClick={() => setValue("plan", "sponsored")} className={`border rounded-md p-3 text-left ${plan === "sponsored" ? "border-red-500" : "border-gray-200"}`}>
              <div className="font-medium">Sponsored</div>
              <div className="text-sm text-gray-600">Boosted for 7 days</div>
            </button>
            <button type="button" onClick={() => setValue("plan", "featured")} className={`border rounded-md p-3 text-left ${plan === "featured" ? "border-red-500" : "border-gray-200"}`}>
              <div className="font-medium">Featured</div>
              <div className="text-sm text-gray-600">Top placement for 7 days</div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Listing"}</Button>
        {plan !== "free" && <span className="text-sm text-gray-600">You can complete payment after creation from your dashboard.</span>}
      </div>
    </form>
  )
}

