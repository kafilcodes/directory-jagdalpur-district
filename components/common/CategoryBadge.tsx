import { Badge } from "@/components/ui/badge"
import { getCategoryIcon, formatCategoryName } from "@/lib/category-icons"
import { cn } from "@/lib/utils"

interface CategoryBadgeProps {
    category: string
    variant?: "default" | "secondary" | "outline" | "destructive"
    showText?: boolean
    showIcon?: boolean
    iconSize?: string
    className?: string
}

/**
 * Reusable CategoryBadge component
 * Can display icon-only, text-only, or both
 * Used across listings, carousels, cards, and detail sheets
 */
export function CategoryBadge({
    category,
    variant = "secondary",
    showText = true,
    showIcon = true,
    iconSize = "h-3.5 w-3.5",
    className = "bg-white/90 backdrop-blur text-gray-900",
}: CategoryBadgeProps) {
    if (!category) return null

    // Icon-only mode: circular badge
    if (showIcon && !showText) {
        return (
            <div className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 backdrop-blur text-gray-900 shadow-md",
                className
            )}>
                {getCategoryIcon(category, "h-4 w-4")}
            </div>
        )
    }

    // Text-only mode: standard badge
    if (showText && !showIcon) {
        return (
            <Badge variant={variant} className={className}>
                {formatCategoryName(category)}
            </Badge>
        )
    }

    // Both icon and text: badge with gap
    return (
        <Badge variant={variant} className={cn("inline-flex items-center gap-1.5", className)}>
            {getCategoryIcon(category, iconSize)}
            <span>{formatCategoryName(category)}</span>
        </Badge>
    )
}
