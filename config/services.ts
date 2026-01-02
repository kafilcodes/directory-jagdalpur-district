/**
 * Service Categories Configuration
 * 
 * Defines all gig work/service categories for the platform.
 * Services are different from business listings - they represent
 * individual workers offering specific services.
 */

import {
    Wrench,
    Plug,
    Pipette,
    Paintbrush,
    Hammer,
    Car,
    Truck,
    Laptop,
    Camera,
    Scissors,
    UtensilsCrossed,
    Baby,
    Dog,
    Flower2,
    Shirt,
    Sparkles,
    Shield,
    Heart,
    GraduationCap,
    Music,
    Dumbbell,
    Stethoscope,
    Scale,
    FileText,
    Phone,
    // New icons for additional categories
    Palette,
    Droplets,
    BrickWall,
    ScrollText,
    Wheat,
    Keyboard,
    Construction,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface ServiceCategoryConfig {
    slug: string
    label: string
    icon: string        // Emoji for visual display
    lucideIcon: LucideIcon
    color: string       // Tailwind background color
    description: string
    keywords: string[]  // For search matching
}

/**
 * All service categories for gig workers
 */
export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
    {
        slug: "electrician",
        label: "Electrician",
        icon: "⚡",
        lucideIcon: Plug,
        color: "bg-yellow-100",
        description: "Electrical repairs, wiring, installations",
        keywords: ["electric", "wiring", "voltage", "power", "switch", "fan", "light"]
    },
    {
        slug: "plumber",
        label: "Plumber",
        icon: "🔧",
        lucideIcon: Pipette,
        color: "bg-blue-100",
        description: "Pipe repairs, water systems, bathroom fixtures",
        keywords: ["pipe", "water", "tap", "bathroom", "toilet", "leak", "drainage"]
    },
    {
        slug: "carpenter",
        label: "Carpenter",
        icon: "🪚",
        lucideIcon: Hammer,
        color: "bg-amber-100",
        description: "Furniture repair, woodwork, installations",
        keywords: ["wood", "furniture", "door", "window", "cabinet", "repair"]
    },
    {
        slug: "painter",
        label: "Painter",
        icon: "🎨",
        lucideIcon: Paintbrush,
        color: "bg-pink-100",
        description: "House painting, wall treatments, polishing",
        keywords: ["paint", "wall", "color", "polish", "texture", "whitewash"]
    },
    {
        slug: "ac-technician",
        label: "AC Technician",
        icon: "❄️",
        lucideIcon: Wrench,
        color: "bg-cyan-100",
        description: "AC repair, installation, servicing",
        keywords: ["ac", "air conditioner", "cooling", "refrigerator", "fridge", "cooler"]
    },
    {
        slug: "mechanic",
        label: "Mechanic",
        icon: "🔩",
        lucideIcon: Car,
        color: "bg-gray-100",
        description: "Vehicle repair, servicing, maintenance",
        keywords: ["car", "bike", "vehicle", "engine", "motor", "service", "repair"]
    },
    {
        slug: "driver",
        label: "Driver",
        icon: "🚗",
        lucideIcon: Truck,
        color: "bg-indigo-100",
        description: "Personal driver, delivery, transport",
        keywords: ["drive", "transport", "taxi", "delivery", "pickup", "drop"]
    },
    {
        slug: "computer-technician",
        label: "Computer Technician",
        icon: "💻",
        lucideIcon: Laptop,
        color: "bg-purple-100",
        description: "Computer repair, software, networking",
        keywords: ["computer", "laptop", "software", "hardware", "network", "printer", "internet"]
    },
    {
        slug: "mobile-repair",
        label: "Mobile Repair",
        icon: "📱",
        lucideIcon: Phone,
        color: "bg-green-100",
        description: "Mobile phone repair, screen replacement",
        keywords: ["mobile", "phone", "screen", "battery", "smartphone", "android", "iphone"]
    },
    {
        slug: "photographer",
        label: "Photographer",
        icon: "📷",
        lucideIcon: Camera,
        color: "bg-violet-100",
        description: "Photography, videography, events",
        keywords: ["photo", "video", "camera", "wedding", "event", "shoot"]
    },
    {
        slug: "beautician",
        label: "Beautician",
        icon: "💇",
        lucideIcon: Scissors,
        color: "bg-rose-100",
        description: "Haircut, makeup, beauty services",
        keywords: ["hair", "makeup", "facial", "beauty", "parlor", "salon", "bridal"]
    },
    {
        slug: "cook",
        label: "Cook / Chef",
        icon: "👨‍🍳",
        lucideIcon: UtensilsCrossed,
        color: "bg-orange-100",
        description: "Home cooking, catering, party orders",
        keywords: ["cook", "chef", "food", "catering", "party", "tiffin", "meal"]
    },
    {
        slug: "babysitter",
        label: "Babysitter",
        icon: "👶",
        lucideIcon: Baby,
        color: "bg-sky-100",
        description: "Child care, nanny services",
        keywords: ["baby", "child", "nanny", "care", "daycare", "sitter"]
    },
    {
        slug: "pet-care",
        label: "Pet Care",
        icon: "🐕",
        lucideIcon: Dog,
        color: "bg-lime-100",
        description: "Pet sitting, grooming, walking",
        keywords: ["pet", "dog", "cat", "grooming", "walking", "sitting", "veterinary"]
    },
    {
        slug: "gardener",
        label: "Gardener",
        icon: "🌱",
        lucideIcon: Flower2,
        color: "bg-emerald-100",
        description: "Garden maintenance, landscaping, plant care",
        keywords: ["garden", "plant", "lawn", "landscape", "tree", "flower", "grass"]
    },
    {
        slug: "tailor",
        label: "Tailor",
        icon: "🧵",
        lucideIcon: Shirt,
        color: "bg-fuchsia-100",
        description: "Stitching, alterations, dress making",
        keywords: ["stitch", "tailor", "cloth", "dress", "alteration", "fitting", "blouse"]
    },
    {
        slug: "cleaner",
        label: "House Cleaner",
        icon: "🧹",
        lucideIcon: Sparkles,
        color: "bg-teal-100",
        description: "House cleaning, deep cleaning, office cleaning",
        keywords: ["clean", "maid", "housekeeping", "sweep", "mop", "wash", "domestic"]
    },
    {
        slug: "security",
        label: "Security Guard",
        icon: "🛡️",
        lucideIcon: Shield,
        color: "bg-slate-100",
        description: "Security services, watchman, guard",
        keywords: ["security", "guard", "watchman", "protection", "safety", "patrol"]
    },
    {
        slug: "caregiver",
        label: "Caregiver",
        icon: "🏥",
        lucideIcon: Heart,
        color: "bg-red-100",
        description: "Elder care, patient care, nursing",
        keywords: ["care", "elderly", "patient", "nurse", "health", "medical", "home care"]
    },
    {
        slug: "tutor",
        label: "Tutor",
        icon: "📚",
        lucideIcon: GraduationCap,
        color: "bg-yellow-100",
        description: "Home tuition, coaching, teaching",
        keywords: ["tuition", "teach", "coaching", "study", "exam", "class", "home tutor"]
    },
    {
        slug: "musician",
        label: "Musician / DJ",
        icon: "🎵",
        lucideIcon: Music,
        color: "bg-purple-100",
        description: "Music, DJ, event entertainment",
        keywords: ["music", "dj", "band", "singer", "wedding", "party", "event"]
    },
    {
        slug: "fitness-trainer",
        label: "Fitness Trainer",
        icon: "💪",
        lucideIcon: Dumbbell,
        color: "bg-green-100",
        description: "Personal training, yoga, fitness coaching",
        keywords: ["gym", "fitness", "trainer", "yoga", "exercise", "workout", "personal trainer"]
    },
    {
        slug: "nurse",
        label: "Nurse",
        icon: "👩‍⚕️",
        lucideIcon: Stethoscope,
        color: "bg-cyan-100",
        description: "Home nursing, medical assistance",
        keywords: ["nurse", "medical", "injection", "dressing", "patient", "healthcare"]
    },
    {
        slug: "lawyer",
        label: "Lawyer / Advocate",
        icon: "⚖️",
        lucideIcon: Scale,
        color: "bg-amber-100",
        description: "Legal services, consultation, documentation",
        keywords: ["lawyer", "advocate", "legal", "court", "case", "documentation"]
    },
    {
        slug: "accountant",
        label: "Accountant / CA",
        icon: "📊",
        lucideIcon: FileText,
        color: "bg-blue-100",
        description: "Accounting, tax filing, financial services",
        keywords: ["account", "tax", "gst", "itr", "ca", "finance", "audit", "bookkeeping"]
    },
    // ==================== NEW CATEGORIES ====================
    {
        slug: "potter",
        label: "Potter",
        icon: "🏺",
        lucideIcon: Palette,
        color: "bg-orange-100",
        description: "Pottery, clay work, traditional crafts",
        keywords: ["potter", "pottery", "clay", "mitti", "matka", "pot", "earthenware", "ceramic", "kulhad", "craftsman"]
    },
    {
        slug: "barber",
        label: "Barber",
        icon: "💈",
        lucideIcon: Scissors,
        color: "bg-red-100",
        description: "Haircut, shaving, grooming services",
        keywords: ["barber", "haircut", "shave", "shaving", "grooming", "nai", "salon", "hair", "beard", "trim"]
    },
    {
        slug: "basket-maker",
        label: "Basket Maker",
        icon: "🧺",
        lucideIcon: Wheat,
        color: "bg-amber-100",
        description: "Traditional basket weaving, bamboo crafts",
        keywords: ["basket", "bamboo", "weaving", "tokri", "dalia", "handicraft", "traditional", "craftsman", "cane"]
    },
    {
        slug: "mason",
        label: "Mason",
        icon: "🧱",
        lucideIcon: BrickWall,
        color: "bg-stone-100",
        description: "Bricklaying, construction, cement work",
        keywords: ["mason", "rajmistri", "mistri", "brick", "cement", "construction", "building", "wall", "plastering", "tiles"]
    },
    {
        slug: "water-supply",
        label: "Jal Vitaran Sanchaalak",
        icon: "💧",
        lucideIcon: Droplets,
        color: "bg-sky-100",
        description: "Water supply management, tanker services",
        keywords: ["water", "jal", "vitaran", "sanchaalak", "tanker", "supply", "paani", "pipeline", "pump", "boring"]
    },
    {
        slug: "data-entry",
        label: "Data Entry Operator",
        icon: "⌨️",
        lucideIcon: Keyboard,
        color: "bg-indigo-100",
        description: "Data entry, typing, document digitization",
        keywords: ["data", "entry", "typing", "computer", "operator", "digitization", "document", "excel", "form", "domestic"]
    },
    {
        slug: "welder",
        label: "Welder",
        icon: "🔥",
        lucideIcon: Wrench,
        color: "bg-gray-100",
        description: "Welding, metal fabrication, iron work",
        keywords: ["welder", "welding", "metal", "iron", "gate", "grill", "fabrication", "steel", "lohar"]
    },
    {
        slug: "rickshaw-driver",
        label: "Rickshaw / Auto Driver",
        icon: "🛺",
        lucideIcon: Truck,
        color: "bg-yellow-100",
        description: "Auto rickshaw, local transport services",
        keywords: ["rickshaw", "auto", "transport", "driver", "local", "tempo", "e-rickshaw", "toto"]
    },
    {
        slug: "milkman",
        label: "Milkman / Dairy",
        icon: "🥛",
        lucideIcon: Droplets,
        color: "bg-white",
        description: "Milk delivery, dairy products supply",
        keywords: ["milk", "milkman", "dairy", "doodh", "gwala", "paneer", "curd", "delivery"]
    },
    {
        slug: "priest",
        label: "Priest / Pandit",
        icon: "🙏",
        lucideIcon: ScrollText,
        color: "bg-orange-100",
        description: "Religious ceremonies, puja services",
        keywords: ["priest", "pandit", "pujari", "puja", "ceremony", "wedding", "religious", "brahmin", "pooja", "astrology"]
    }
]

/**
 * Get service category by slug
 */
export function getServiceCategoryBySlug(slug: string): ServiceCategoryConfig | undefined {
    return SERVICE_CATEGORIES.find(cat => cat.slug === slug)
}

/**
 * Get service category by label (case insensitive)
 */
export function getServiceCategoryByLabel(label: string): ServiceCategoryConfig | undefined {
    return SERVICE_CATEGORIES.find(cat =>
        cat.label.toLowerCase() === label.toLowerCase()
    )
}

/**
 * Search service categories by keyword
 */
export function searchServiceCategories(query: string): ServiceCategoryConfig[] {
    const queryLower = query.toLowerCase()
    return SERVICE_CATEGORIES.filter(cat =>
        cat.label.toLowerCase().includes(queryLower) ||
        cat.slug.includes(queryLower) ||
        cat.keywords.some(kw => kw.includes(queryLower))
    )
}

/**
 * Get emoji for a service type
 */
export function getServiceEmoji(serviceSlug: string): string {
    const category = getServiceCategoryBySlug(serviceSlug)
    return category?.icon || "🔧"
}

/**
 * Get color class for a service type
 */
export function getServiceColor(serviceSlug: string): string {
    const category = getServiceCategoryBySlug(serviceSlug)
    return category?.color || "bg-gray-100"
}

/**
 * Get icon for a service type (returns emoji or Lucide icon)
 */
export function getServiceIcon(serviceSlug: string): string {
    const category = getServiceCategoryBySlug(serviceSlug)
    return category?.icon || "🔧"
}

/**
 * Quality levels for service providers
 */
export interface QualityLevel {
    value: number
    label: string
    description: string
}

export const SERVICE_QUALITY_LEVELS: QualityLevel[] = [
    { value: 1, label: "Beginner", description: "New to the field" },
    { value: 2, label: "Basic", description: "Some experience" },
    { value: 3, label: "Intermediate", description: "Good experience" },
    { value: 4, label: "Experienced", description: "Very experienced" },
    { value: 5, label: "Expert", description: "Industry expert" }
]

/**
 * Experience levels for service providers
 */
export interface ExperienceLevel {
    min: number
    max: number
    label: string
}

export const SERVICE_EXPERIENCE_LEVELS: ExperienceLevel[] = [
    { min: 0, max: 1, label: "Less than 1 year" },
    { min: 1, max: 3, label: "1-3 years" },
    { min: 3, max: 5, label: "3-5 years" },
    { min: 5, max: 10, label: "5-10 years" },
    { min: 10, max: 100, label: "10+ years" }
]
