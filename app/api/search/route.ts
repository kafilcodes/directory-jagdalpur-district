import { NextRequest, NextResponse } from "next/server"
import { hybridSearch } from "@/lib/search/hybridSearch"
import { getCachedSearch, setCachedSearch } from "@/lib/cache/listingsCache"

export const dynamic = "force-dynamic"

/**
 * Search services from Firestore
 */
async function searchServices(query: string, options: {
  limit?: number
  offset?: number
  serviceType?: string
}) {
  const { limit = 12, offset = 0, serviceType } = options
  const db = (await import("@/lib/firebase/admin")).getAdminDb()

  let firestoreQuery: FirebaseFirestore.Query = db.collection("services")
    .where("status", "==", "live")

  // Filter by service type if specified
  if (serviceType) {
    firestoreQuery = firestoreQuery.where("serviceSlug", "==", serviceType)
  }

  firestoreQuery = firestoreQuery.orderBy("createdAt", "desc")

  // If there's a search query, we'll do client-side filtering
  // since Firestore doesn't support full-text search
  if (query) {
    // Get more results to filter from
    firestoreQuery = firestoreQuery.limit(100)
  } else {
    firestoreQuery = firestoreQuery.offset(offset).limit(limit)
  }

  const snap = await firestoreQuery.get()

  let services = snap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      type: 'service' as const,
      name: data.name || '',
      service: data.service || '',
      serviceSlug: data.serviceSlug || '',
      serviceLabel: data.serviceLabel || '',
      address: data.address || '',
      qualityRating: data.qualityRating || 0,
      chargesPerHour: data.chargesPerHour || 0,
      isNegotiable: data.isNegotiable || false,
      profilePhoto: data.profilePhoto || null,
      workingHours: data.workingHours || '',
      contactNumber: data.contactNumber || '',
      whatsappNumber: data.whatsappNumber || '',
      experienceYears: data.experienceYears || null,
      tags: data.tags || [],
      createdAt: data.createdAt || 0,
    }
  })

  // Client-side search filtering
  if (query) {
    const queryLower = query.toLowerCase()
    services = services.filter(s =>
      s.name.toLowerCase().includes(queryLower) ||
      s.service.toLowerCase().includes(queryLower) ||
      s.serviceSlug?.toLowerCase().includes(queryLower) ||
      s.serviceLabel?.toLowerCase().includes(queryLower) ||
      s.address.toLowerCase().includes(queryLower) ||
      s.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))
    )
    // Apply pagination after filtering
    services = services.slice(offset, offset + limit)
  }

  return services
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get("q") || "")
  const catsParam = searchParams.get("cats")
  const limit = Number(searchParams.get("limit") || 12) // Default to 12 for better UX
  const sort = String(searchParams.get("sort") || "relevance") as 'relevance' | 'popular' | 'recent'
  const filter = String(searchParams.get("filter") || "")
  const offset = Number(searchParams.get("offset") || 0)
  const cats = catsParam ? catsParam.split(",").filter(Boolean) : []
  const type = String(searchParams.get("type") || "all") as 'all' | 'business' | 'service'
  const serviceType = searchParams.get("serviceType") || ""

  try {
    // If searching for services only
    if (type === 'service') {
      const services = await searchServices(q, {
        limit,
        offset,
        serviceType: serviceType || undefined
      })

      // Get count for pagination
      const db = (await import("@/lib/firebase/admin")).getAdminDb()
      let countQuery: FirebaseFirestore.Query = db.collection("services")
        .where("status", "==", "live")
      if (serviceType) {
        countQuery = countQuery.where("serviceSlug", "==", serviceType)
      }
      const countSnap = await countQuery.count().get()
      const totalServices = countSnap.data().count

      return NextResponse.json({
        ok: true,
        data: services,
        type: 'service',
        offset,
        limit,
        hasMore: offset + services.length < totalServices,
        totalAvailable: totalServices
      })
    }

    // Browse mode: no query or query too short
    // Default behavior shows all listings with pagination
    if (!q || q.trim().length < 2) {
      // Check cache for browse mode too
      const browseCacheKey = `browse:${cats.join(",")}:${sort}:${offset}:${limit}`
      const cached = getCachedSearch(browseCacheKey, cats, sort, filter)
      if (cached && offset === 0) { // Only use cache for initial page
        return NextResponse.json({ ok: true, data: cached, cached: true, browsing: true })
      }

      const db = (await import("@/lib/firebase/admin")).getAdminDb()

      // Build query for browse mode
      let query = db.collection("listings")
        .where("approved", "==", true)
        .where("status", "==", "active")

      // Apply plan filter if specified (sponsored, featured, or both)
      if (filter) {
        if (filter === "sponsored") {
          query = query.where("plan", "==", "sponsored")
        } else if (filter === "featured") {
          query = query.where("plan", "==", "featured")
        } else if (filter === "premium" || filter === "featured,sponsored" || filter === "sponsored,featured") {
          // Both featured and sponsored
          query = query.where("plan", "in", ["featured", "sponsored"])
        }
      }

      // Apply category filter if specified
      // Note: Firestore 'in' operator supports up to 10 values
      if (cats.length > 0) {
        // Create variations to match both singular/plural and different formats
        const categoryVariations = cats.flatMap(cat => {
          const variations = [cat]
          // Add singular version (remove 's' at end)
          if (cat.endsWith('s') && cat !== 'electronics') {
            variations.push(cat.slice(0, -1))
          }
          // Add plural version (add 's' at end)
          if (!cat.endsWith('s')) {
            variations.push(cat + 's')
          }
          // Handle special cases
          if (cat === 'homeservices') variations.push('home', 'services')
          if (cat === 'home') variations.push('homeservices')
          if (cat === 'furniture') variations.push('home_goods_store')
          if (cat === 'home_goods_store') variations.push('furniture')
          if (cat === 'sports') variations.push('gyms', 'gym')
          if (cat === 'gyms' || cat === 'gym') variations.push('sports')
          if (cat === 'healthcare') variations.push('pharmacy', 'health')
          if (cat === 'pharmacy') variations.push('healthcare')

          return [...new Set(variations)] // Remove duplicates
        })

        // Firestore 'in' operator has limit of 10 values
        const uniqueVariations = [...new Set(categoryVariations)].slice(0, 10)
        console.log(`[API - Search] Category filter: ${cats.join(',')} -> ${uniqueVariations.join(',')}`)

        query = query.where("categorySlug", "in", uniqueVariations)
      }

      // Apply sorting
      if (sort === "popular") {
        query = query.orderBy("views", "desc")
      } else if (sort === "recent") {
        query = query.orderBy("createdAt", "desc")
      } else {
        // Default: recent for browse mode
        query = query.orderBy("createdAt", "desc")
      }

      // Cap browse mode at 27 total listings max (or unlimited for filtered views)
      const maxBrowseLimit = filter ? 999 : 27 // No limit for plan-filtered views
      const remainingAllowed = maxBrowseLimit - offset
      const actualLimit = Math.min(limit, remainingAllowed)

      // First, get total count of available listings for this query
      let countQuery = db.collection("listings")
        .where("approved", "==", true)
        .where("status", "==", "active")

      // Apply same filters to count query
      if (filter) {
        if (filter === "sponsored") {
          countQuery = countQuery.where("plan", "==", "sponsored")
        } else if (filter === "featured") {
          countQuery = countQuery.where("plan", "==", "featured")
        } else if (filter === "premium" || filter === "featured,sponsored" || filter === "sponsored,featured") {
          countQuery = countQuery.where("plan", "in", ["featured", "sponsored"])
        }
      }
      if (cats.length > 0) {
        const categoryVariations = cats.flatMap(cat => {
          const variations = [cat]
          if (cat.endsWith('s') && cat !== 'electronics') {
            variations.push(cat.slice(0, -1))
          }
          if (!cat.endsWith('s')) {
            variations.push(cat + 's')
          }
          if (cat === 'homeservices') variations.push('home', 'services')
          if (cat === 'home') variations.push('homeservices')
          if (cat === 'furniture') variations.push('home_goods_store')
          if (cat === 'home_goods_store') variations.push('furniture')
          if (cat === 'sports') variations.push('gyms', 'gym')
          if (cat === 'gyms' || cat === 'gym') variations.push('sports')
          if (cat === 'healthcare') variations.push('pharmacy', 'health')
          if (cat === 'pharmacy') variations.push('healthcare')
          return [...new Set(variations)]
        })
        const uniqueVariations = [...new Set(categoryVariations)].slice(0, 10)
        countQuery = countQuery.where("categorySlug", "in", uniqueVariations)
      }

      // Get total count (expensive but necessary for accurate "Show More" logic)
      const countSnap = await countQuery.count().get()
      const totalAvailable = countSnap.data().count

      // Apply pagination
      if (actualLimit > 0) {
        query = query.offset(offset).limit(actualLimit)
      } else {
        // Already reached max, return empty
        return NextResponse.json({
          ok: true,
          data: [],
          browsing: true,
          offset,
          limit: 0,
          hasMore: false,
          maxReached: true
        })
      }

      const snap = await query.get()

      const data = snap.docs.map(doc => {
        const listing = doc.data()
        return {
          id: doc.id,
          name: listing.name || listing.businessName || '',
          cat: listing.category || '',
          category: listing.category || '',
          categorySlug: listing.categorySlug || '',
          description: listing.description || '',
          address: listing.address || '',
          city: listing.city || '',
          phone: listing.phone || '',
          email: listing.email || '',
          website: listing.website || '',
          location: listing.location || null,
          plan: listing.plan || 'free',
          planType: listing.plan || 'free',
          rating: listing.rating || 0,
          reviewCount: listing.reviewCount || listing.totalUserRatings || 0,
          imp: listing.views || 0,
          clk: listing.clicks || 0,
          createdAt: listing.createdAt || 0,
          updatedAt: listing.updatedAt || 0,
          photos: listing.photos || [],
          images: listing.images || [],
          thumbnail: listing.thumbnail || '',
          googlePhotos: listing.googlePhotos || []
        }
      })

      // Cache browse results for initial page only
      if (offset === 0) {
        const browseCacheKey = `browse:${cats.join(",")}:${sort}:${offset}:${limit}`
        setCachedSearch(browseCacheKey, data, cats, sort, filter)
      }

      // Check if there might be more results
      const hasMore = (offset + data.length) < totalAvailable && (offset + data.length) < maxBrowseLimit

      console.log(`[API - Browse] Total available: ${totalAvailable}, Fetched: ${data.length}, Offset: ${offset}, HasMore: ${hasMore}`)

      return NextResponse.json({
        ok: true,
        data,
        browsing: true,
        offset,
        limit: actualLimit,
        hasMore,
        maxReached: (offset + data.length) >= maxBrowseLimit || (offset + data.length) >= totalAvailable,
        totalAvailable // Send to client for accurate tracking
      })
    }

    // Check cache first (5-minute TTL configured in listingsCache.ts)
    const cached = getCachedSearch(q, cats, sort, filter)
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, cached: true })
    }

    // Use hybrid search (combines search shards + listings collection)
    const data = await hybridSearch(q, {
      limit,
      sort,
      categoryFilter: cats.length > 0 ? cats : undefined,
      planFilter: filter || undefined
    })

    // Store in cache for future requests
    setCachedSearch(q, data, cats, sort, filter)

    return NextResponse.json({ ok: true, data, cached: false })
  } catch (e: any) {
    console.error("[API /api/search] Error:", e)
    // Return empty results on error to prevent UI breakage
    return NextResponse.json({ ok: true, data: [], error: e?.message || "search_error" })
  }
}

