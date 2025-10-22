/**
 * @deprecated Use /config/categories.ts instead
 * This file is kept for backwards compatibility
 */

export interface CategoryItem {
  label: string
  slug: string
}

// Re-export from unified categories for backwards compatibility
import {
  CATEGORIES as UNIFIED_CATS,
  normalizeCategoryToSlug as normalize,
  labelForSlug as getLabel
} from "@/config/categories"

export const CATEGORIES: CategoryItem[] = UNIFIED_CATS

export function normalizeCategoryToSlug(input: string): string | null {
  return normalize(input)
}

export function labelForSlug(slug: string): string | null {
  return getLabel(slug)
}

