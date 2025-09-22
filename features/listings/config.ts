export const categories = [
  "Restaurants",
  "Cafes",
  "Groceries",
  "Pharmacies",
  "Clinics",
  "Plumbers",
  "Electricians",
  "Carpenters",
  "Tutors",
  "Gyms",
] as const

export const sortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Rating", value: "rating_desc" },
  { label: "Newest", value: "created_desc" },
] as const
