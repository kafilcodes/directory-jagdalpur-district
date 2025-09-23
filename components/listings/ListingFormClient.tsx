"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ListingSchema } from "@/lib/validators/listing"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ListingFormClient({ action }: { action: (fd: FormData) => Promise<any> }) {
  const form = useForm<z.infer<typeof ListingSchema>>({
    resolver: zodResolver(ListingSchema),
    defaultValues: { name: "", category: "", address: "" },
  })

  const onSubmit = async (values: z.infer<typeof ListingSchema>) => {
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v) formData.append(k, String(v))
    })
    const fileInput = document.getElementById("photo") as HTMLInputElement | null
    if (fileInput?.files && fileInput.files[0]) {
      formData.append("photo", fileInput.files[0])
    }
    await action(formData)
    alert("Submitted! Pending approval.")
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" {...form.register("category")} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...form.register("address")} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" {...form.register("website")} />
      </div>
      <div>
        <Label htmlFor="photo">Photo</Label>
        <Input id="photo" type="file" accept="image/*" />
      </div>
      <Button type="submit">Submit listing</Button>
    </form>
  )
}
