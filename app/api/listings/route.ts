import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"

export const runtime = "nodejs"

const CreateListingSchema = z.object({
  businessName: z.string().min(2),
  categorySlug: z.string().optional(), // Will derive from category
  category: z.string().min(2),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  website: z.string().url().optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  photos: z.array(z.string()).optional(),
  openingHours: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  plan: z.enum(['free', 'sponsored', 'featured']),
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  status: z.string().default('active'),
  placeId: z.string().optional(),
  googlePlaceData: z.any().optional(),
  isPublic: z.boolean().default(true),
  monetization: z.record(z.string(), z.any()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

    const json = await req.json()
    const parsed = CreateListingSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const db = getAdminDb()

    // Enforce single-listing-per-user
    const existing = await db.collection("listings").where("ownerUid", "==", user.uid).limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ ok: false, error: "already_has_listing" }, { status: 400 })
    }

    const now = Date.now()
    const ref = db.collection("listings").doc()
    const id = ref.id
    const data = parsed.data

    // Calculate expiry date based on plan
    const planDurations = { free: null, sponsored: 7, featured: 7 } // null = permanent, 7 = 1 week
    const expiryDate = planDurations[data.plan] !== null
      ? (() => {
        const date = new Date()
        date.setDate(date.getDate() + (planDurations[data.plan] as number))
        return date.getTime()
      })()
      : null // Free plan has no expiry

    // Create listing
    await ref.set({
      id,
      ownerUid: user.uid,
      name: data.businessName,
      category: data.category,
      categorySlug: data.categorySlug || data.category.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || '',
      tags: data.tags || [],
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      address: data.address,
      city: data.city || '',
      state: data.state || 'Chhattisgarh',
      pincode: data.pincode || '',
      location: data.location || null,
      photos: data.photos || [],
      openingHours: data.openingHours || [],
      amenities: data.amenities || [],
      plan: data.plan,
      orderId: data.orderId || null,
      paymentId: data.paymentId || null,
      isPublic: data.isPublic !== false,
      approved: true,
      status: data.status || 'active',
      placeId: data.placeId || null,
      googlePlaceData: data.googlePlaceData || null,
      monetization: data.monetization || {},
      expiryDate: expiryDate, // null for free plan, timestamp for paid plans
      createdAt: now,
      updatedAt: now,
      views: 0,
      clicks: 0,
    })

    // Index into search shards minimal (defer rich terms to background if needed)
    const categorySlug = data.categorySlug || data.category.toLowerCase().replace(/\s+/g, '-')
    const shardId = `index_${(categorySlug?.[0] || 'o').toLowerCase()}`
    const refShard = db.collection("search").doc(shardId)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(refShard)
      const indexData = (snap.exists ? (snap.data() as any) : { index: {} })
      const term = categorySlug
      indexData.index[term] = indexData.index[term] || {}
      indexData.index[term][id] = {
        score: 10,
        name: data.businessName,
        cat: categorySlug,
        imp: 0,
        clk: 0,
        createdAt: now,
        updatedAt: now,
      }
      tx.set(refShard, indexData, { merge: true })
    })

    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

