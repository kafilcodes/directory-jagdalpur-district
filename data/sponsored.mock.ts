export type SponsoredListing = {
  id: number
  name: string
  category: string
  rating: number
  reviews?: number
  address: string
  image: string
  price?: string
  badge?: string
  trending?: boolean
  phone?: string
  email?: string
}

export const SPONSORED_LISTINGS: SponsoredListing[] = [
  {
    id: 1,
    name: "Grand Palace Hotel",
    category: "Hotels",
    rating: 4.8,
    reviews: 456,
    address: "Central Avenue, Dhamtari",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop",
    price: "₹2,500",
    badge: "Premium",
    trending: true,
    phone: "+919876543210",
    email: "reservations@grandpalace.example"
  },
  {
    id: 2,
    name: "Elite Fitness Center",
    category: "Gym & Fitness",
    rating: 4.7,
    reviews: 234,
    address: "Sports Complex, Dhamtari",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop",
    price: "₹1,200/mo",
    badge: "Popular",
    phone: "+919111111111"
  },
  {
    id: 3,
    name: "Paradise Restaurant",
    category: "Restaurants",
    rating: 4.6,
    reviews: 789,
    address: "Food Court, Dhamtari",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop",
    price: "₹500 for 2",
    badge: "Top Rated",
    trending: true,
    email: "book@paradise.example"
  },
  {
    id: 4,
    name: "Tech Solutions Hub",
    category: "Services",
    rating: 4.9,
    reviews: 123,
    address: "Business Park, Dhamtari",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80&auto=format&fit=crop",
    badge: "Verified",
    email: "hello@techsolutions.example"
  },
  {
    id: 5,
    name: "Green Valley Spa",
    category: "Wellness",
    rating: 4.5,
    reviews: 567,
    address: "Lakeside Road, Dhamtari",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&auto=format&fit=crop",
    price: "₹1,500",
    badge: "Luxury",
    phone: "+919222222222"
  },
  {
    id: 6,
    name: "City Medical Center",
    category: "Healthcare",
    rating: 4.8,
    reviews: 890,
    address: "Medical District, Dhamtari",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80&auto=format&fit=crop",
    badge: "24/7 Service",
    phone: "+919333333333",
    email: "care@citymedical.example"
  },
]

