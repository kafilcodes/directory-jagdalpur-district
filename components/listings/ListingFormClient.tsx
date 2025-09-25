"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ListingSchema } from "@/lib/validators/listing"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"

export default function ListingFormClient({ action }: { action: (fd: FormData) => Promise<any> }) {
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof ListingSchema>>({
    resolver: zodResolver(ListingSchema),
    defaultValues: { name: "", category: "", address: "", phone: "", email: "", website: "" },
  })

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
      const res = await action(formData)
      if (res?.ok) {
        toast.success("Submitted! Pending approval.")
        form.reset()
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit listing"}
      </Button>
    </form>
  )
}
