export type Listing = {
  id: string
  name: string
  category: string
  categorySlug?: string
  address: string | { formattedAddress: string }
  phone?: string
  email?: string
  website?: string
  description?: string
  openingHours?: string
  photos?: string[]
  rating?: number
  status?: 'active' | 'pending' | 'rejected'
  plan?: 'free' | 'premium' | 'featured'
  views?: number
  clicks?: number
  createdAt: any
  updatedAt?: number
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
