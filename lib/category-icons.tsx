import {
    Building2,
    UtensilsCrossed,
    Stethoscope,
    GraduationCap,
    Dumbbell,
    Tag,
    Home,
    ShoppingBag,
    Shirt,
    Car,
    Wrench,
    Scissors
} from "lucide-react"

/**
 * Get icon component for a category string
 * Returns appropriate Lucide icon based on category keywords
 */
export function getCategoryIcon(category: string = "", className: string = "h-4 w-4") {
    const cat = category.toLowerCase()

    // Hotels & Lodging
    if (cat.includes("hotel") || cat.includes("lodge") || cat.includes("resort") || cat.includes("accommodation")) {
        return <Building2 className={className} />
    }

    // Restaurants & Food
    if (cat.includes("restaurant") || cat.includes("food") || cat.includes("cafe") || cat.includes("dining") || cat.includes("eatery")) {
        return <UtensilsCrossed className={className} />
    }

    // Gyms & Fitness
    if (cat.includes("gym") || cat.includes("fitness") || cat.includes("yoga") || cat.includes("sports")) {
        return <Dumbbell className={className} />
    }

    // Healthcare & Medical
    if (cat.includes("health") || cat.includes("hospital") || cat.includes("clinic") || cat.includes("doctor") || cat.includes("medical") || cat.includes("pharmacy")) {
        return <Stethoscope className={className} />
    }

    // Education & Schools
    if (cat.includes("education") || cat.includes("school") || cat.includes("college") || cat.includes("institute") || cat.includes("academy") || cat.includes("tuition")) {
        return <GraduationCap className={className} />
    }

    // Home & Real Estate
    if (cat.includes("home") || cat.includes("real_estate") || cat.includes("property") || cat.includes("housing")) {
        return <Home className={className} />
    }

    // Shopping & Retail
    if (cat.includes("shop") || cat.includes("store") || cat.includes("retail") || cat.includes("market") || cat.includes("mall") || cat.includes("goods")) {
        return <ShoppingBag className={className} />
    }

    // Fashion & Clothing
    if (cat.includes("clothing") || cat.includes("fashion") || cat.includes("apparel") || cat.includes("boutique") || cat.includes("tailor")) {
        return <Shirt className={className} />
    }

    // Automotive
    if (cat.includes("car") || cat.includes("auto") || cat.includes("vehicle") || cat.includes("garage") || cat.includes("mechanic")) {
        return <Car className={className} />
    }

    // Services & Repair
    if (cat.includes("repair") || cat.includes("service") || cat.includes("maintenance") || cat.includes("plumber") || cat.includes("electrician")) {
        return <Wrench className={className} />
    }

    // Beauty & Salon
    if (cat.includes("salon") || cat.includes("beauty") || cat.includes("spa") || cat.includes("parlor") || cat.includes("barber")) {
        return <Scissors className={className} />
    }

    // Default fallback
    return <Tag className={className} />
}

/**
 * Get formatted category display name
 * Converts snake_case to Title Case
 */
export function formatCategoryName(category: string = ""): string {
    return category
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}
