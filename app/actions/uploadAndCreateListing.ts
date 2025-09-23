"use server"

import { ListingSchema } from "@/lib/validators/listing"
import { uploadImage } from "@/lib/images/upload"
import { getAdminDb } from "@/lib/firebase/admin"
import { nanoid } from "nanoid"

export async function uploadAndCreateListing(formData: FormData) {
  const entries = Object.fromEntries(formData.entries()) as any

  const parsed = ListingSchema.safeParse({
    name: entries.name,
    category: entries.category,
    address: entries.address,
    phone: entries.phone,
    email: entries.email,
    website: entries.website,
  })
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() }
  }

  let photos: string[] = []
  const file = formData.get("photo") as File | null
  if (file && typeof (file as any).arrayBuffer === "function") {
    const ab = await file.arrayBuffer()
    const buf = Buffer.from(ab)
    const contentType = file.type || "image/jpeg"
    const uploaded = await uploadImage(buf, contentType, `listings`)
    photos = [uploaded.publicUrl]
  }

  const id = nanoid()
  const now = Date.now()
  const db = getAdminDb()
  await db.collection("listings").doc(id).set({
    id,
    ...parsed.data,
    photos,
    rating: 0,
    approved: false,
    createdAt: now,
    updatedAt: now,
  })

  return { ok: true, id }
}
