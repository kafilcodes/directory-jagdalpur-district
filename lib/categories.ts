export interface CategoryItem {
  label: string
  slug: string
}

// Centralized category vocab to keep URL slugs consistent across Header/Search
export const CATEGORIES: CategoryItem[] = [
  { label: "Hotels", slug: "hotels" },
  { label: "Restaurants", slug: "restaurants" },
  { label: "Healthcare", slug: "healthcare" },
  { label: "Education", slug: "education" },
  { label: "Shopping", slug: "shopping" },
  { label: "Services", slug: "services" },
]

const labelToSlug = new Map(CATEGORIES.map(c => [c.label.toLowerCase(), c.slug]))
const slugToLabel = new Map(CATEGORIES.map(c => [c.slug, c.label]))

export function normalizeCategoryToSlug(input: string): string | null {
  if (!input) return null
  const lower = input.toLowerCase()
  return labelToSlug.get(lower) || (slugToLabel.has(lower) ? lower : null)
}

export function labelForSlug(slug: string): string | null {
  return slugToLabel.get(slug) || null
}

