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
 * @deprecated Use /config/categories.ts (UNIFIED_CATEGORIES) instead
 * Kept for backwards compatibility
 */
import { UNIFIED_CATEGORIES } from "./categories"

export const CATEGORIES: Category[] = UNIFIED_CATEGORIES.map(cat => ({
    slug: cat.slug,
    label: cat.label,
    icon: cat.icon,
    description: cat.description,
}))

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
        durationWeeks: 1, // 1 week
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
 * @deprecated Use functions from /config/categories.ts instead
 */
import {
    getCategoryBySlug as getBySlug,
    getCategoryLabel as getLabel,
    getAllCategorySlugs as getAllSlugs
} from "./categories"

export function getCategoryBySlug(slug: string): Category | undefined {
    const unified = getBySlug(slug)
    if (!unified) return undefined
    return {
        slug: unified.slug,
        label: unified.label,
        icon: unified.icon,
        description: unified.description,
    }
}

export function getCategoryLabel(slug: string): string {
    return getLabel(slug)
}

export function getAllCategorySlugs(): string[] {
    return getAllSlugs()
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
