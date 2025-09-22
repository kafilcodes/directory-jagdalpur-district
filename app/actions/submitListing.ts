"use server"

import { adminDb } from "@/lib/firebase/admin"
import { ListingSchema } from "@/lib/validators/listing"
import { nanoid } from "nanoid"

export async function submitListing(formData: FormData) {
  const entries = Object.fromEntries(formData.entries())
  const parsed = ListingSchema.safeParse(entries)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() }
  }
  const data = parsed.data
  const id = nanoid()
  const now = Date.now()
  await adminDb.collection("listings").doc(id).set({
    ...data,
    id,
    rating: 0,
    approved: false,
    createdAt: now,
    updatedAt: now,
  })
  return { ok: true, id }
}
