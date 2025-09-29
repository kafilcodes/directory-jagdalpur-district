"use server"

import { ListingSchema } from "@/lib/validators/listing"
import { uploadImage } from "@/lib/images/upload"
import { getAdminDb } from "@/lib/firebase/admin"
import { nanoid } from "nanoid"
import { getCurrentUser } from "@/lib/auth/server"

import { PLANS } from "@/lib/plans"

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

  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" }
  }

  const db = getAdminDb()
  // Enforce one listing per account on server side as well
  const existing = await db.collection("listings").where("ownerId", "==", user.uid).limit(1).get()
  if (!existing.empty) {
    return { ok: false, error: "ALREADY_HAS_LISTING" }
  }

  const id = nanoid()
  const now = Date.now()
  await db.collection("listings").doc(id).set({
    id,
    ownerId: user.uid,
    ...parsed.data,
    photos,
    rating: 0,
    approved: false,
    plan: entries.plan || "free",
    payment: entries.paymentStatus === "paid" ? {
      status: "paid",
      provider: "razorpay",
      orderId: entries.orderId || null,
      paymentId: entries.paymentId || null,
      signature: entries.signature || null,
    } : { status: "unpaid" },
    createdAt: now,
    updatedAt: now,
  })

  // Create a payment receipt when a paid featured listing is created
  if (entries.paymentStatus === "paid") {
    try {
      const amount = PLANS.featured.pricePaise
      await db.collection("payments").doc((entries.paymentId as string) || id).set({
        id: (entries.paymentId as string) || id,
        ownerId: user.uid,
        listingId: id,
        plan: (entries.plan as string) || "featured",
        provider: "razorpay",
        status: "paid",
        amount,
        currency: "INR",
        orderId: (entries.orderId as string) || null,
        paymentId: (entries.paymentId as string) || null,
        signature: (entries.signature as string) || null,
        createdAt: now,
      })
    } catch { }
  }

  return { ok: true, id }
}
