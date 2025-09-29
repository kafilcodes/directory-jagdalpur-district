"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"

import { ChevronLeft, ChevronRight, Star, MapPin, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

// Dummy sponsored listings
const sponsoredListings = [
  {
    id: 1,
    name: "Grand Palace Hotel",
    category: "Hotels",
    rating: 4.8,
    reviews: 456,
    address: "Central Avenue, Dhamtari",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
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
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
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
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
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
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400",
    badge: "Verified"
  },
  {
    id: 5,
    name: "Green Valley Spa",
    category: "Wellness",
    rating: 4.5,
    reviews: 567,
    address: "Lakeside Road, Dhamtari",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400",
    price: "₹1,500",
    badge: "Luxury"
  },
  {
    id: 6,
    name: "City Medical Center",
    category: "Healthcare",
    rating: 4.8,
    reviews: 890,
    address: "Medical District, Dhamtari",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
    badge: "24/7 Service"
  }
]

interface SponsoredCarouselProps {
  onSelectListing?: (listing: any) => void
}

export default function SponsoredCarousel({ onSelectListing }: SponsoredCarouselProps) {
  return (
    <section className="w-full py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sponsored Listings</h2>
            <p className="text-gray-600 mt-1">Premium businesses and services in Dhamtari</p>
          </div>
          <Link href="/sponsored">
            <Button variant="outline" className="hidden sm:flex items-center gap-2">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {sponsoredListings.map((listing) => (
              <CarouselItem key={listing.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden h-full"
                  onClick={() => onSelectListing?.(listing)}
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={listing.image}
                      alt={listing.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className="bg-red-500 text-white">Sponsored</Badge>
                      {listing.badge && (
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                          {listing.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Trending Indicator */}
                    {listing.trending && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-400 text-black p-2 rounded-full">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Category Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <Badge variant="outline" className="text-white border-white/50 bg-white/10 backdrop-blur">
                        {listing.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Section */}
                  <CardContent className="p-4 space-y-3">
                    {/* Title and Rating */}
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-red-500 transition-colors line-clamp-1">
                        {listing.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium ml-1">{listing.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({listing.reviews} reviews)</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{listing.address}</span>
                    </div>

                    {/* Price or Additional Info */}
                    {listing.price && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-500">Starting from</span>
                        <span className="font-semibold text-lg text-red-500">{listing.price}</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle quick view
                        }}
                      >
                        Quick View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-9 bg-red-500 hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle contact
                        }}
                      >
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom Navigation Buttons */}
          <div className="hidden sm:block">
            <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 border-gray-200" />
            <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 border-gray-200" />
          </div>
        </Carousel>

        {/* Mobile View All Button */}
        <div className="mt-6 sm:hidden">
          <Link href="/sponsored">
            <Button variant="outline" className="w-full">
              View All Sponsored Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}