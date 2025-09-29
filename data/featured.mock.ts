export type FeaturedItem = {
  id: number
  title: string
  image: string
  price?: string
  tag: "featured" | "sponsored"
  rating?: number
}

export const FEATURED_ITEMS: FeaturedItem[] = [
  { id: 1, title: "Skyline Hotel & Suites", image: "https://placehold.co/600x400/png", price: "₹3,499", tag: "featured", rating: 4.8 },
  { id: 2, title: "Urban Fitness Club", image: "https://placehold.co/600x400/png", price: "₹999/mo", tag: "sponsored", rating: 4.5 },
  { id: 3, title: "Royal Spice Diner", image: "https://placehold.co/600x400/png", price: "₹700 for 2", tag: "featured", rating: 4.7 },
  { id: 4, title: "CarePlus Hospital", image: "https://placehold.co/600x400/png", tag: "sponsored", rating: 4.6 },
  { id: 5, title: "EduCore Academy", image: "https://placehold.co/600x400/png", tag: "featured", rating: 4.3 },
  { id: 6, title: "TechNest Services", image: "https://placehold.co/600x400/png", tag: "sponsored", rating: 4.9 },
]

