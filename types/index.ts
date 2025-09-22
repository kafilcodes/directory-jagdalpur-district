export type Listing = {
  id: string
  name: string
  category: string
  address: string
  phone?: string
  email?: string
  website?: string
  photos?: string[]
  rating?: number
  createdAt: number
  updatedAt: number
  approved: boolean
}

export type AnalyticsEvent = {
  id?: string
  type: string
  listingId?: string
  path?: string
  referrer?: string
  userAgent?: string
  timestamp: number
  meta?: Record<string, unknown>
}

export type AdPlacement = {
  id: string
  slot: string
  provider: "adsense" | "admanager"
  options?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}
