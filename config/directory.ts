/**
 * Static Directory Configuration
 * Per Database Modeling.md - Categories and Monetization Plans are NOT stored in Firestore
 * This eliminates unnecessary DB reads and maximizes performance
 */

export interface Category {
    slug: string
    label: string
    icon?: string
    description?: string
}

export interface MonetizationPlan {
    id: string
    name: string
    durationWeeks: number
    priceINR: number
    pricePaise: number
    features: string[]
    popular?: boolean
    badge?: string
}

/**
 * Available provider categories
 * Used across search, listing creation, and browse pages
 */
export const CATEGORIES: Category[] = [
    {
        slug: "hotels",
        label: "Hotels",
        icon: "🏨",
        description: "Accommodations and lodging services",
    },
    {
        slug: "restaurants",
        label: "Restaurants",
        icon: "🍽️",
        description: "Dining, cafes, and food services",
    },
    {
        slug: "healthcare",
        label: "Healthcare",
        icon: "🏥",
        description: "Medical facilities and health services",
    },
    {
        slug: "education",
        label: "Education",
        icon: "📚",
        description: "Schools, colleges, and training centers",
    },
    {
        slug: "shopping",
        label: "Shopping",
        icon: "🛍️",
        description: "Retail stores and shopping centers",
    },
    {
        slug: "services",
        label: "Services",
        icon: "🔧",
        description: "Professional and local services",
    },
]

/**
 * Monetization plans for featured/sponsored listings
 * Used in create-listing flow and payment pages
 */
export const MONETIZATION_PLANS: MonetizationPlan[] = [
    {
        id: "free",
        name: "Free Listing",
        durationWeeks: 0, // Permanent
        priceINR: 0,
        pricePaise: 0,
        features: [
            "Basic listing in directory",
            "Contact information display",
            "Standard search visibility",
        ],
    },
    {
        id: "featured",
        name: "Featured Listing",
        durationWeeks: 4, // 1 month
        priceINR: 499,
        pricePaise: 49900,
        popular: true,
        badge: "Popular",
        features: [
            "Everything in Free",
            "Homepage featured section",
            "Priority in search results",
            "Featured badge on listing",
            "4 weeks visibility",
        ],
    },
    {
        id: "sponsored",
        name: "Sponsored Listing",
        durationWeeks: 1,
        priceINR: 299,
        pricePaise: 29900,
        features: [
            "Everything in Featured",
            "Top of category pages",
            "Sponsored badge",
            "1 week visibility",
        ],
    },
]

/**
 * Helper functions for category operations
 */
export function getCategoryBySlug(slug: string): Category | undefined {
    return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryLabel(slug: string): string {
    return getCategoryBySlug(slug)?.label || slug
}

export function getAllCategorySlugs(): string[] {
    return CATEGORIES.map((c) => c.slug)
}

/**
 * Helper functions for plan operations
 */
export function getPlanById(id: string): MonetizationPlan | undefined {
    return MONETIZATION_PLANS.find((p) => p.id === id)
}

export function getFreePlan(): MonetizationPlan {
    return MONETIZATION_PLANS[0]
}

export function getPaidPlans(): MonetizationPlan[] {
    return MONETIZATION_PLANS.filter((p) => p.priceINR > 0)
}

/**
 * Format price for display
 */
export function formatPrice(priceINR: number): string {
    if (priceINR === 0) return "Free"
    return `₹${priceINR.toLocaleString("en-IN")}`
}
