/**
 * Unified Category Configuration
 * Single source of truth for all categories across the application
 * Maps business categories to Google Places API types for consistency
 */

import {
    Building2,
    UtensilsCrossed,
    Stethoscope,
    ShoppingBag,
    GraduationCap,
    Wrench,
    Home,
    Car,
    Film,
    Dumbbell,
    Sparkles,
    ShoppingCart,
    Settings,
    Scale,
    Wallet,
    Laptop,
    Home as HomeIcon,
    PawPrint,
    PartyPopper,
    Camera,
    Plane,
    Shirt,
    Diamond,
    Smartphone,
    Armchair,
    Trees,
    Palette,
    Music,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CategoryConfig {
    slug: string
    label: string
    name: string // Display name (can be same as label)
    icon: string // Emoji for visual consistency
    lucideIcon: LucideIcon // Lucide icon for UI components
    color: string // Tailwind background color class
    description?: string
    googlePlacesTypes: string[] // Map to Google Places API types
}

/**
 * All 28 categories used across the application
 * Consistent with browse page and search functionality
 */
export const UNIFIED_CATEGORIES: CategoryConfig[] = [
    {
        slug: "hotels",
        label: "Hotels",
        name: "Hotels",
        icon: "🏨",
        lucideIcon: Building2,
        color: "bg-blue-100",
        description: "Accommodations and lodging services",
        googlePlacesTypes: ["lodging", "hotel", "motel", "guest_house"],
    },
    {
        slug: "restaurants",
        label: "Restaurants",
        name: "Restaurants",
        icon: "🍽️",
        lucideIcon: UtensilsCrossed,
        color: "bg-green-100",
        description: "Dining, cafes, and food services",
        googlePlacesTypes: ["restaurant", "food", "cafe", "bar", "meal_takeaway", "meal_delivery"],
    },
    {
        slug: "healthcare",
        label: "Healthcare",
        name: "Healthcare",
        icon: "🏥",
        lucideIcon: Stethoscope,
        color: "bg-red-100",
        description: "Medical facilities and health services",
        googlePlacesTypes: ["hospital", "doctor", "dentist", "pharmacy", "physiotherapist", "health"],
    },
    {
        slug: "shopping",
        label: "Shopping",
        name: "Shopping",
        icon: "🛍️",
        lucideIcon: ShoppingBag,
        color: "bg-purple-100",
        description: "Retail stores and shopping centers",
        googlePlacesTypes: ["shopping_mall", "department_store", "clothing_store", "store"],
    },
    {
        slug: "education",
        label: "Education",
        name: "Education",
        icon: "🎓",
        lucideIcon: GraduationCap,
        color: "bg-yellow-100",
        description: "Schools, colleges, and training centers",
        googlePlacesTypes: ["school", "university", "secondary_school", "primary_school", "library"],
    },
    {
        slug: "services",
        label: "Services",
        name: "Services",
        icon: "🔧",
        lucideIcon: Wrench,
        color: "bg-indigo-100",
        description: "Professional and local services",
        googlePlacesTypes: ["plumber", "electrician", "roofing_contractor", "general_contractor", "locksmith"],
    },
    {
        slug: "realestate",
        label: "Real Estate",
        name: "Real Estate",
        icon: "🏠",
        lucideIcon: Home,
        color: "bg-pink-100",
        description: "Property and real estate services",
        googlePlacesTypes: ["real_estate_agency", "moving_company"],
    },
    {
        slug: "transport",
        label: "Transport",
        name: "Transport",
        icon: "🚗",
        lucideIcon: Car,
        color: "bg-gray-100",
        description: "Transportation and vehicle services",
        googlePlacesTypes: ["taxi_stand", "bus_station", "transit_station", "car_rental", "car_repair", "car_dealer"],
    },
    {
        slug: "entertainment",
        label: "Entertainment",
        name: "Entertainment",
        icon: "🎭",
        lucideIcon: Film,
        color: "bg-violet-100",
        description: "Entertainment venues and activities",
        googlePlacesTypes: ["movie_theater", "night_club", "amusement_park", "bowling_alley", "casino"],
    },
    {
        slug: "sports",
        label: "Sports & Fitness",
        name: "Sports & Fitness",
        icon: "⚽",
        lucideIcon: Dumbbell,
        color: "bg-orange-100",
        description: "Sports facilities and fitness centers",
        googlePlacesTypes: ["gym", "stadium", "spa"],
    },
    {
        slug: "beauty",
        label: "Beauty & Spa",
        name: "Beauty & Spa",
        icon: "💅",
        lucideIcon: Sparkles,
        color: "bg-rose-100",
        description: "Beauty salons and spa services",
        googlePlacesTypes: ["beauty_salon", "hair_care", "spa"],
    },
    {
        slug: "grocery",
        label: "Food & Grocery",
        name: "Food & Grocery",
        icon: "🛒",
        lucideIcon: ShoppingCart,
        color: "bg-lime-100",
        description: "Grocery stores and supermarkets",
        googlePlacesTypes: ["supermarket", "grocery_or_supermarket", "convenience_store"],
    },
    {
        slug: "automotive",
        label: "Automotive",
        name: "Automotive",
        icon: "🔧",
        lucideIcon: Settings,
        color: "bg-slate-100",
        description: "Auto repair and vehicle services",
        googlePlacesTypes: ["car_repair", "car_wash", "car_dealer", "gas_station"],
    },
    {
        slug: "legal",
        label: "Legal Services",
        name: "Legal Services",
        icon: "⚖️",
        lucideIcon: Scale,
        color: "bg-amber-100",
        description: "Legal and law services",
        googlePlacesTypes: ["lawyer", "courthouse"],
    },
    {
        slug: "finance",
        label: "Finance & Banking",
        name: "Finance & Banking",
        icon: "💰",
        lucideIcon: Wallet,
        color: "bg-emerald-100",
        description: "Banks and financial services",
        googlePlacesTypes: ["bank", "atm", "accounting", "finance"],
    },
    {
        slug: "technology",
        label: "Technology",
        name: "Technology",
        icon: "💻",
        lucideIcon: Laptop,
        color: "bg-cyan-100",
        description: "Tech shops and IT services",
        googlePlacesTypes: ["electronics_store", "computer_store"],
    },
    {
        slug: "homeservices",
        label: "Home Services",
        name: "Home Services",
        icon: "🏡",
        lucideIcon: HomeIcon,
        color: "bg-teal-100",
        description: "Home maintenance and improvement",
        googlePlacesTypes: ["painter", "plumber", "electrician", "roofing_contractor"],
    },
    {
        slug: "petcare",
        label: "Pet Care",
        name: "Pet Care",
        icon: "🐾",
        lucideIcon: PawPrint,
        color: "bg-fuchsia-100",
        description: "Pet stores and veterinary services",
        googlePlacesTypes: ["pet_store", "veterinary_care"],
    },
    {
        slug: "events",
        label: "Event Planning",
        name: "Event Planning",
        icon: "🎉",
        lucideIcon: PartyPopper,
        color: "bg-sky-100",
        description: "Event management and planning",
        googlePlacesTypes: ["event_venue"],
    },
    {
        slug: "photography",
        label: "Photography",
        name: "Photography",
        icon: "📸",
        lucideIcon: Camera,
        color: "bg-stone-100",
        description: "Photography services and studios",
        googlePlacesTypes: ["photographer"],
    },
    {
        slug: "travel",
        label: "Travel & Tourism",
        name: "Travel & Tourism",
        icon: "✈️",
        lucideIcon: Plane,
        color: "bg-blue-200",
        description: "Travel agencies and tourism services",
        googlePlacesTypes: ["travel_agency", "tourist_attraction"],
    },
    {
        slug: "fashion",
        label: "Fashion",
        name: "Fashion",
        icon: "👗",
        lucideIcon: Shirt,
        color: "bg-pink-200",
        description: "Fashion boutiques and clothing",
        googlePlacesTypes: ["clothing_store"],
    },
    {
        slug: "jewelry",
        label: "Jewelry",
        name: "Jewelry",
        icon: "💎",
        lucideIcon: Diamond,
        color: "bg-purple-200",
        description: "Jewelry stores and accessories",
        googlePlacesTypes: ["jewelry_store"],
    },
    {
        slug: "electronics",
        label: "Electronics",
        name: "Electronics",
        icon: "📱",
        lucideIcon: Smartphone,
        color: "bg-indigo-200",
        description: "Electronics and gadget stores",
        googlePlacesTypes: ["electronics_store"],
    },
    {
        slug: "furniture",
        label: "Furniture",
        name: "Furniture",
        icon: "🛋️",
        lucideIcon: Armchair,
        color: "bg-yellow-200",
        description: "Furniture stores and home decor",
        googlePlacesTypes: ["furniture_store", "home_goods_store"],
    },
    {
        slug: "garden",
        label: "Garden & Outdoor",
        name: "Garden & Outdoor",
        icon: "🌳",
        lucideIcon: Trees,
        color: "bg-green-200",
        description: "Garden supplies and outdoor equipment",
        googlePlacesTypes: ["hardware_store"],
    },
    {
        slug: "arts",
        label: "Arts & Crafts",
        name: "Arts & Crafts",
        icon: "🎨",
        lucideIcon: Palette,
        color: "bg-red-200",
        description: "Art supplies and craft stores",
        googlePlacesTypes: ["art_gallery", "museum"],
    },
    {
        slug: "music",
        label: "Music & Instruments",
        name: "Music & Instruments",
        icon: "🎵",
        lucideIcon: Music,
        color: "bg-violet-200",
        description: "Music stores and instrument shops",
        googlePlacesTypes: ["music_store"],
    },
]

/**
 * Helper functions for category operations
 */

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
    return UNIFIED_CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryLabel(slug: string): string {
    return getCategoryBySlug(slug)?.label || slug
}

export function getCategoryIcon(slug: string): string {
    return getCategoryBySlug(slug)?.icon || "📍"
}

export function getCategoryColor(slug: string): string {
    return getCategoryBySlug(slug)?.color || "bg-gray-100"
}

export function getAllCategorySlugs(): string[] {
    return UNIFIED_CATEGORIES.map((c) => c.slug)
}

export function getCategoriesByGoogleType(googleType: string): CategoryConfig[] {
    return UNIFIED_CATEGORIES.filter((c) => c.googlePlacesTypes.includes(googleType))
}

/**
 * Normalize category input to slug
 * Handles both label and slug inputs for backwards compatibility
 */
export function normalizeCategoryToSlug(input: string): string | null {
    if (!input) return null
    const lower = input.toLowerCase().trim()

    // Check if it's already a valid slug
    const bySlug = UNIFIED_CATEGORIES.find(c => c.slug === lower)
    if (bySlug) return bySlug.slug

    // Check if it matches a label
    const byLabel = UNIFIED_CATEGORIES.find(c => c.label.toLowerCase() === lower)
    if (byLabel) return byLabel.slug

    // Check if it matches a name
    const byName = UNIFIED_CATEGORIES.find(c => c.name.toLowerCase() === lower)
    if (byName) return byName.slug

    return null
}

/**
 * Get label for a slug (backwards compatible)
 */
export function labelForSlug(slug: string): string | null {
    return getCategoryLabel(slug)
}

/**
 * Legacy compatibility exports
 * Maintains compatibility with existing code using old category files
 */
export interface CategoryItem {
    label: string
    slug: string
}

export const CATEGORIES: CategoryItem[] = UNIFIED_CATEGORIES.map(c => ({
    label: c.label,
    slug: c.slug
}))

/**
 * Export for use in components that need full category data
 */
export default UNIFIED_CATEGORIES
