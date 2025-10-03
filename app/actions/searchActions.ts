"use server"

import type {
  DocumentData,
  DocumentSnapshot,
  Firestore,
  Transaction,
  WriteBatch,
} from "firebase-admin/firestore"

import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import type { Listing, SearchShardDoc, SearchEntry } from "@/lib/types"

const POPULARITY_BOOST = 0.001 // weight per impression
const ENGAGEMENT_BOOST = 0.05  // weight per click

function toWords(q: string): string[] {
  return Array.from(new Set(q.toLowerCase().trim().split(/[^a-z0-9]+/).filter(Boolean)))
}

function shardIdFor(term: string): string {
  const c = term[0]
  return (c >= 'a' && c <= 'z') ? `index_${c}` : "index_other"
}

function calcFinalScore(entry: SearchEntry): number {
  return Number(entry.score || 0) + Number(entry.imp || 0) * POPULARITY_BOOST + Number(entry.clk || 0) * ENGAGEMENT_BOOST
}

export async function searchListings(searchTerm: string, limit = 15, options?: { sort?: "relevance" | "popular" | "recent" }) {
  const terms = toWords(searchTerm)
  if (!terms.length) return []

  try {
    const db = getAdminDb() as Firestore
    // Read shards in parallel with error handling
    const shardIds = Array.from(new Set(terms.map(shardIdFor)))
    const shardSnaps = await Promise.allSettled(
      shardIds.map((id) => db.collection("search").doc(id).get())
    )

    // Aggregate results in-memory, handling missing/failed shards
    const combined: Record<string, SearchEntry & { finalScore: number }> = {}
    for (const term of terms) {
      const shardId = shardIdFor(term)
      const snapIdx = shardIds.indexOf(shardId)
      const snapResult = shardSnaps[snapIdx]

      // Skip if shard fetch failed
      if (snapResult.status === 'rejected') {
        console.warn(`Failed to fetch shard ${shardId}:`, snapResult.reason)
        continue
      }

      const doc = snapResult.value
      const data = (doc.exists ? (doc.data() as SearchShardDoc) : null)
      const bucket = (data?.index?.[term] ?? {}) as Record<string, SearchEntry>

      for (const [listingId, entry] of Object.entries(bucket)) {
        const finalScore = calcFinalScore(entry)
        if (!combined[listingId] || finalScore > combined[listingId].finalScore) {
          combined[listingId] = { ...entry, finalScore }
        }
      }
    }

    let results = Object.entries(combined).map(([id, entry]) => ({ id, ...entry }))

    const sort = options?.sort || "relevance"
    if (sort === "popular") {
      results.sort((a, b) => (Number(b.clk || 0) - Number(a.clk || 0)) || (Number(b.imp || 0) - Number(a.imp || 0)) || (Number(b.score || 0) - Number(a.score || 0)))
    } else if (sort === "recent") {
      results.sort((a, b) => (Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)) || (b.finalScore - a.finalScore))
    } else {
      results.sort((a, b) => b.finalScore - a.finalScore)
    }

    results = results.slice(0, limit)

    // Premium-first reordering based on listing.activePlan (read-time TTL)
    try {
      const ids = results.map((r) => r.id)
      const snaps = (await Promise.all(ids.map((id) => db.collection("listings").doc(id).get()))) as DocumentSnapshot<DocumentData>[]
      const now = Date.now()
      const byId: Record<string, any> = {}
      snaps.forEach((snapshot) => {
        if (snapshot.exists) byId[snapshot.id] = snapshot.data()
      })

      const featured: any[] = []
      const sponsored: any[] = []
      const organic: any[] = []
      for (const r of results) {
        const d = byId[r.id]
        const endAt = Number(d?.activePlan?.endAt || 0)
        const type = String(d?.activePlan?.type || "")
        if (endAt > now && type === "featured") { (r as any).planType = "featured"; featured.push(r) }
        else if (endAt > now && type === "sponsored") { (r as any).planType = "sponsored"; sponsored.push(r) }
        else organic.push(r)
      }
      results = [...featured, ...sponsored, ...organic]
    } catch { }

    // Fire-and-forget: increment impressions for returned items for each relevant term
    ; (async () => {
      try {
        const batchesByShard: Record<string, WriteBatch> = {}
        for (const term of terms) {
          const shardId = shardIdFor(term)
          const batch = batchesByShard[shardId] || (batchesByShard[shardId] = db.batch())
          const ref = db.collection("search").doc(shardId)
          for (const r of results) {
            batch.set(ref, { index: { [term]: { [r.id]: { imp: FieldValue.increment(1) } } } }, { merge: true })
          }
        }
        await Promise.all(Object.values(batchesByShard).map((b) => b.commit()))
      } catch { }
    })()

    return results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export async function trackClick(listingId: string, searchTerm: string) {
  const terms = toWords(searchTerm)
  if (!terms.length) return { ok: false, error: "empty_term" }
  const db = getAdminDb() as Firestore
  const batchesByShard: Record<string, WriteBatch> = {}
  for (const term of terms) {
    const shardId = shardIdFor(term)
    const batch = batchesByShard[shardId] || (batchesByShard[shardId] = db.batch())
    const ref = db.collection("search").doc(shardId)
    batch.set(ref, { index: { [term]: { [listingId]: { clk: FieldValue.increment(1) } } } }, { merge: true })
  }
  await Promise.all(Object.values(batchesByShard).map((b) => b.commit()))
  return { ok: true }
}

// Optional: submitListing that writes listing + updates shards transactionally
export interface SubmitListingInput {
  ownerUid: string
  businessName: string
  categorySlug: string
  isPublic: boolean
  address?: Listing["address"]
  googleData?: Record<string, any>
  monetization?: Record<string, any>
  photos?: string[]
}

export async function submitListing(input: SubmitListingInput & { id: string }) {
  const db = getAdminDb() as Firestore
  const now = Date.now()
  const { id, ...rest } = input
  await db.collection("listings").doc(id).set({
    id,
    ...rest,
    createdAt: now,
    updatedAt: now,
  })

  // Generate keywords: business name words + category slug
  const terms = Array.from(new Set([
    ...toWords(rest.businessName || ""),
    ...toWords(rest.categorySlug || ""),
  ]))
  const scoreBase = 10

  // Transaction per shard to merge entries
  await Promise.all(
    Array.from(new Set(terms.map(shardIdFor))).map(async (shardId) => {
      await db.runTransaction(async (tx: Transaction) => {
        const ref = db.collection("search").doc(shardId)
        const snap = (await tx.get(ref)) as DocumentSnapshot<SearchShardDoc>
        const data: SearchShardDoc = snap.exists ? (snap.data() as SearchShardDoc) : { index: {} }
        for (const term of terms.filter((t) => shardIdFor(t) === shardId)) {
          const listingMap = (data.index[term] = data.index[term] || {})
          const existing = listingMap[id]
          listingMap[id] = {
            score: existing?.score ?? scoreBase,
            name: rest.businessName,
            cat: rest.categorySlug,
            imp: existing?.imp ?? 0,
            clk: existing?.clk ?? 0,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          }
        }
        tx.set(ref, data, { merge: true })
      })
    })
  )

  return { ok: true, id }
}

