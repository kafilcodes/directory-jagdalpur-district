export type PlanId = "free" | "featured"

export const PLANS = {
  free: {
    id: "free" as const,
    label: "Free",
    pricePaise: 0,
    currency: "INR",
    display: "₹0",
    features: [] as string[],
  },
  featured: {
    id: "featured" as const,
    label: "Featured",
    pricePaise: 49900, // ₹499
    currency: "INR",
    display: "₹499",
    features: ["Homepage highlight", "Priority placement"] as string[],
  },
} as const

export function getPlan(id: PlanId) {
  return PLANS[id]
}

