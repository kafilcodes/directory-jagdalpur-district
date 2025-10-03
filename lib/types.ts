// Version 9.0 Types derived from context/Database Modeling.md

import type { Timestamp } from "firebase-admin/firestore"

type FirestoreTimestamp = Timestamp

export interface ListingAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  lat?: number
  lng?: number
}

export interface Listing {
  id: string
  ownerUid: string
  businessName: string
  categorySlug: string
  isPublic: boolean
  address?: ListingAddress
  googleData?: Record<string, any>
  monetization?: Record<string, any>
  createdAt: number | FirestoreTimestamp
  updatedAt?: number | FirestoreTimestamp
  // Optional UI fields that may exist in current project
  rating?: number
  photos?: string[]
}

export interface SearchEntry {
  score: number
  name: string
  cat: string
  imp: number
  clk: number
  createdAt?: number | FirestoreTimestamp
  updatedAt?: number | FirestoreTimestamp
}

export interface SearchShardDoc {
  index: Record<string, Record<string, SearchEntry>>
  lastUpdatedAt?: number | FirestoreTimestamp
}

export interface ListingStatsKeyword {
  term: string
  imp: number
  clk: number
}

export interface ListingStatsDoc {
  totalImpressions: number
  totalClicks: number
  topKeywords: ListingStatsKeyword[]
  lastAggregated: number | FirestoreTimestamp
}

export interface UserDoc {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
  planId?: string
  createdAt: number | FirestoreTimestamp
}

export interface PlanDoc {
  id: string
  name: string
  priceMonthly: number
  features: string[]
}

export interface CategoryDoc {
  id: string
  name: string
  slug: string
}

