import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"
import { z } from "zod"
import { getCachedListing, setCachedListing, invalidateListing } from "@/lib/cache/listingsCache"

export async function GET(req: NextRequest, context: any) {
  try {
    const params = await context.params
    const { id } = params as { id: string }

    // Check cache first (5-minute TTL)
    const cached = getCachedListing(id)
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, cached: true })
    }

    // Fetch from Firestore if not cached
    const db = getAdminDb()
    const snap = await db.collection("listings").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const data = snap.data()

    // Store in cache for future requests
    setCachedListing(id, data)

    return NextResponse.json({ ok: true, data, cached: false })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

// Update Schema - RESTRICTED FIELDS
// Non-editable: businessName, title, images, reviews (protected for integrity)
// Editable: description, tags, phone, email, website, openingHours
const UpdateSchema = z.object({
  description: z.string().min(10).max(500).optional().nullable(),
  tags: z.array(z.string()).optional(),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  openingHours: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({
        ok: false,
        message: "You must be signed in to edit listings"
      }, { status: 401 })
    }

    const params = await context.params
    const { id } = params as { id: string }

    const json = await req.json()
    const parsed = UpdateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        message: "Invalid data provided",
        errors: parsed.error.flatten()
      }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection("listings").doc(id)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json({
        ok: false,
        message: "Listing not found"
      }, { status: 404 })
    }

    const data = snap.data() as any

    // Verify ownership
    if (data.ownerUid !== user.uid) {
      return NextResponse.json({
        ok: false,
        message: "You don't have permission to edit this listing"
      }, { status: 403 })
    }

    // Build updates object - only include fields that were actually provided
    const updates: any = {
      updatedAt: Date.now()
    }

    // Apply only the fields that were provided (field-level updates)
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description
    }
    if (parsed.data.tags !== undefined) {
      updates.tags = parsed.data.tags
    }
    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone
    }
    if (parsed.data.email !== undefined) {
      updates.email = parsed.data.email
    }
    if (parsed.data.website !== undefined) {
      updates.website = parsed.data.website
    }
    if (parsed.data.openingHours !== undefined) {
      updates.openingHours = parsed.data.openingHours
    }

    // Use merge: true to preserve all other fields
    await ref.set(updates, { merge: true })

    // Invalidate cache after update so next fetch gets fresh data
    invalidateListing(id)

    return NextResponse.json({
      ok: true,
      message: "Listing updated successfully"
    })
  } catch (e: any) {
    console.error("[PATCH /api/listings/[id]] Error:", e)
    return NextResponse.json({
      ok: false,
      message: e?.message || "Failed to update listing"
    }, { status: 500 })
  }
}
