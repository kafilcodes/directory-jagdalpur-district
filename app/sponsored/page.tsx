"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ModernListingDetail from "@/components/listings/ModernListingDetail"
import { Star, MapPin, ChevronRight } from "lucide-react"

const sponsoredListings = [
  {
    id: 1,
    name: "Grand Palace Hotel",
    category: "Hotels",
    rating: 4.8,
    reviews: 456,
    address: "Central Avenue, Dhamtari",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    price: "₹2,500",
    badge: "Premium",
    trending: true
  },
  {
    id: 2,
    name: "Elite Fitness Center",
    category: "Gym & Fitness",
    rating: 4.7,
    reviews: 234,
    address: "Sports Complex, Dhamtari",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
    price: "₹1,200/mo",
    badge: "Popular"
  },
  {
    id: 3,
    name: "Paradise Restaurant",
    category: "Restaurants",
    rating: 4.6,
    reviews: 789,
    address: "Food Court, Dhamtari",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    price: "₹500 for 2",
    badge: "Top Rated",
    trending: true
  },
  {
    id: 4,
    name: "Tech Solutions Hub",
    category: "Services",
    rating: 4.9,
    reviews: 123,
    address: "Business Park, Dhamtari",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600",
    badge: "Verified"
  }
]

export default function SponsoredPage() {
  const [selected, setSelected] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  const onSelect = (listing: any) => {
    setSelected(listing)
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link className="hover:text-gray-700" href="/">Home</Link>
            </li>
            <li>
              <span>/</span>
            </li>
            <li className="text-gray-900 font-medium">Sponsored</li>
          </ol>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Sponsored Listings</h1>
            <p className="text-gray-600 mt-1">Premium businesses and services featured on the platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsoredListings.map((listing) => (
            <Card key={listing.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => onSelect(listing)}>
              <div className="relative h-48 overflow-hidden">
                <img src={listing.image} alt={listing.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-red-500 text-white">Sponsored</Badge>
                  {listing.badge && (
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur">{listing.badge}</Badge>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <Badge variant="outline" className="text-white border-white/50 bg-white/10 backdrop-blur">{listing.category}</Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-red-500 transition-colors line-clamp-1">{listing.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium ml-1">{listing.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({listing.reviews} reviews)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">{listing.address}</span>
                </div>
                {listing.price && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Starting from</span>
                    <span className="font-semibold text-lg text-red-500">{listing.price}</span>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="ghost" className="gap-1 text-red-600">
                    View details <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right-side detail sheet */}
      <ModernListingDetail listing={selected} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

