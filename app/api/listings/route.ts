import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"
import {
  safeCreateDocument,
  safeQueryCollection,
  safeCreateSearchIndex,
  safeCreateListingStats,
} from "@/lib/firebase/safeCollections"

export const runtime = "nodejs"

const CreateListingSchema = z.object({
  businessName: z.string().min(2),
  categorySlug: z.string().optional(), // Will derive from category
  category: z.string().min(2),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(), // Optional - will use user's email if not provided
  website: z.string().url().optional().or(z.literal('')), // Allow empty string
  address: z.string().min(5),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional().nullable(),
  reviews: z.array(z.object({
    authorName: z.string(),
    authorPhoto: z.string().optional(),
    rating: z.number(),
    relativeTime: z.string().optional(),
    time: z.string().optional(),
    text: z.string(),
  })).optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
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
  businessSearchName: z.string().optional(), // Extra field from search
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

    const json = await req.json()
    console.log('📥 Received listing data:', JSON.stringify(json, null, 2))
    const parsed = CreateListingSchema.safeParse(json)
    if (!parsed.success) {
      console.error('❌ Validation failed:', JSON.stringify(parsed.error.flatten(), null, 2))
      return NextResponse.json({
        ok: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      }, { status: 400 })
    }

    const db = getAdminDb()

    // Enforce single-listing-per-user (using safe query)
    const existingResult = await safeQueryCollection(
      "listings",
      [{ field: "ownerUid", op: "==", value: user.uid }],
      1
    )

    if (!existingResult.success) {
      console.error('❌ Failed to check existing listings:', existingResult.error)
      return NextResponse.json({
        ok: false,
        error: "database_error",
        message: "Failed to check existing listings"
      }, { status: 500 })
    }

    if (existingResult.docs.length > 0) {
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

    // Create listing using safe collection utilities
    // Note: status starts as 'creating' until images are uploaded
    const listingData = {
      id,
      ownerUid: user.uid,
      name: data.businessName,
      category: data.category,
      categorySlug: data.categorySlug || data.category.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || '',
      tags: data.tags || [],
      phone: data.phone || '',
      email: data.email || user.email || '', // Use user's email if not provided
      website: data.website || '',
      address: data.address,
      city: data.city || '',
      state: data.state || 'Chhattisgarh',
      pincode: data.pincode || '',
      location: data.location || null,
      reviews: data.reviews || [],
      rating: data.rating || 0,
      userRatingCount: data.userRatingCount || 0,
      photos: [], // Will be populated via /api/listings/[id]/photos endpoint
      primaryImageIndex: 0, // Will be set when photos are uploaded
      openingHours: data.openingHours || [],
      amenities: data.amenities || [],
      plan: data.plan,
      orderId: data.orderId || null,
      paymentId: data.paymentId || null,
      isPublic: data.isPublic !== false,
      approved: true,
      status: 'creating', // Changed from 'active' - will be set to 'active' when photos are uploaded
      placeId: data.placeId || null,
      googlePlaceData: data.googlePlaceData || null,
      monetization: data.monetization || {},
      expiryDate: expiryDate, // null for free plan, timestamp for paid plans
      createdAt: now,
      updatedAt: now,
      views: 0,
      clicks: 0,
    }

    console.log('📝 Creating listing document with ID:', id)
    const createResult = await safeCreateDocument("listings", id, listingData)

    if (!createResult.success) {
      console.error('❌ Failed to create listing:', createResult.error)
      return NextResponse.json({
        ok: false,
        error: "database_error",
        message: "Failed to create listing document",
        details: createResult.error
      }, { status: 500 })
    }

    console.log('✅ Listing created successfully:', id)

    // Index into search shards using safe utilities
    // Generate all searchable terms: business name words + category
    const businessNameWords = data.businessName.toLowerCase().trim().split(/\s+/).filter(Boolean)
    const categorySlug = listingData.categorySlug
    const searchTerms = Array.from(new Set([categorySlug, ...businessNameWords]))

    // Get plan type for search ranking
    const planType = data.plan || 'free'

    // Index each term separately for better search coverage
    const indexPromises = searchTerms.map(term =>
      safeCreateSearchIndex(
        term,
        id,
        {
          score: 10,
          name: data.businessName,
          cat: categorySlug,
          categorySlug: categorySlug,
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          website: data.website || '',
          location: data.location || undefined,
          planType: planType,
          rating: 0,
          imp: 0,
          clk: 0,
        }
      )
    )

    const searchIndexResults = await Promise.allSettled(indexPromises)
    const failedIndexes = searchIndexResults.filter(r => r.status === 'rejected')

    if (failedIndexes.length > 0) {
      console.warn(`⚠️ Some search indexes failed (${failedIndexes.length}/${searchTerms.length}), but listing created`)
    } else {
      console.log(`✅ Search indexes created for ${searchTerms.length} terms:`, searchTerms.join(', '))
    }

    // Create listing stats document for analytics
    const statsResult = await safeCreateListingStats(id, {
      totalImpressions: 0,
      totalClicks: 0,
      topKeywords: [],
    })

    if (!statsResult.success) {
      console.warn('⚠️ Stats creation failed (non-fatal):', statsResult.error)
    } else {
      console.log('✅ Listing stats initialized')
    }

    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    console.error('Listing creation error:', e)
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 })
  }
}

