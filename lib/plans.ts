export type PlanId = "free" | "sponsored" | "featured"

export const PLANS = {
  free: {
    id: "free" as const,
    label: "Free",
    pricePaise: 0,
    priceRupees: 0,
    currency: "INR",
    display: "Free",
    duration: "Permanent",
    durationDays: null,
    features: [
      "Basic listing",
      "Standard visibility",
      "Up to 5 photos",
      "Contact information",
      "Permanent listing",
    ] as string[],
    popular: false,
  },
  sponsored: {
    id: "sponsored" as const,
    label: "Sponsored",
    pricePaise: 30000, // ₹300
    priceRupees: 300,
    currency: "INR",
    display: "₹300/week",
    duration: "7 days",
    durationDays: 7,
    features: [
      "Enhanced visibility",
      "Up to 10 photos",
      "Sponsored badge",
      "Priority in search results",
      "Business hours display",
      "Social media links",
      "7 days active listing",
    ] as string[],
    popular: true,
  },
  featured: {
    id: "featured" as const,
    label: "Featured",
    pricePaise: 50000, // ₹500
    priceRupees: 500,
    currency: "INR",
    display: "₹500/week",
    duration: "7 days",
    durationDays: 7,
    features: [
      "Top priority placement",
      "Unlimited photos",
      "Featured badge",
      "Homepage highlight",
      "Top of search results",
      "Social media integration",
      "Business hours display",
      "7 days premium listing",
    ] as string[],
    popular: false,
  },
} as const

export function getPlan(id: PlanId) {
  return PLANS[id]
}

