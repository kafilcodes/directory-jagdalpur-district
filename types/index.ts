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

/**
 * Service Type for Gig Workers (Electrician, Plumber, etc.)
 * Separate from business listings - no auth required to submit
 */
export type ServiceStatus = 'pending' | 'live' | 'rejected'

export type Service = {
  id: string

  // Required Fields
  name: string                    // Service provider name
  service: string                 // Service type (e.g., "Electrician", "Plumber")
  serviceSlug: string             // URL-friendly slug
  address: string                 // Service area/address
  whatsappNumber: string          // WhatsApp contact
  contactNumber: string           // Phone contact
  workingHours: string            // e.g., "9 AM - 6 PM"
  chargesPerHour: number          // Hourly rate in INR
  isNegotiable: boolean           // Whether charges are negotiable
  qualityRating: number           // 1-5 star rating for quality/experience

  // Optional Fields
  profilePhoto?: string           // Profile photo URL
  blockOfCity?: string            // Area/block in city
  officeAddress?: string          // Office location if any
  experienceYears?: number        // Years of experience
  gender?: 'male' | 'female' | 'other'
  age?: number
  aadharNumber?: string           // Aadhar for verification (stored securely)
  email?: string
  website?: string
  tags?: string[]                 // e.g., ["24/7", "emergency", "residential"]

  // Metadata
  status: ServiceStatus           // pending, live, rejected
  views: number                   // View count
  clicks: number                  // Click count
  createdAt: any                  // Firestore timestamp
  updatedAt: any                  // Firestore timestamp

  // Admin fields
  adminNotes?: string             // Internal admin notes
  rejectionReason?: string        // Reason if rejected
}

/**
 * Service category configuration
 */
export type ServiceCategory = {
  slug: string
  label: string
  icon: string      // Emoji
  description: string
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
