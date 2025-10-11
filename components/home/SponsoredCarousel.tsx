"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { ChevronRight, Star, MapPin, Clock, TrendingUp, Crown, Gem, Award, Eye, Phone, Mail, Globe, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { CategoryBadge } from "@/components/common/CategoryBadge"

// Server-backed sponsored listings (max 20)

interface SponsoredCarouselProps {
  onSelectListing?: (listing: any) => void
}

export default function SponsoredCarousel({ onSelectListing }: SponsoredCarouselProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          const res = await fetch("/api/listings/sponsored", { cache: "no-store" })
          const json = await res.json()
          if (alive && json?.ok && Array.isArray(json.items)) setItems(json.items)
        } catch { }
        setLoading(false)
      })()
    return () => { alive = false }
  }, [])

  return (
    <section className="w-full py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sponsored Listings</h2>
            <p className="text-gray-600 mt-1">Premium businesses and services in Dhamtari.</p>
          </div>
          <Link href="/search?filter=sponsored">
            <Button variant="outline" className="hidden sm:flex items-center gap-2">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Skeleton while loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-md overflow-hidden border bg-white">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Carousel */
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {items.map((listing) => (
                <CarouselItem key={listing.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card
                    className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full"
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

                      {/* Icon-only attribute badge; hidden when trending */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {listing.badge && !listing.trending && (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-gray-900 shadow-sm backdrop-blur" aria-label={String(listing.badge)}>
                            {(() => {
                              switch (String(listing.badge)) {
                                case "Luxury":
                                  return <Crown className="h-4 w-4" />
                                case "24/7":
                                  return <Clock className="h-4 w-4" />
                                case "Popular":
                                  return <Star className="h-4 w-4" />
                                case "Premium":
                                  return <Gem className="h-4 w-4" />
                                default:
                                  return <Award className="h-4 w-4" />
                              }
                            })()}
                          </div>
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
                        <CategoryBadge
                          category={listing.category}
                          variant="outline"
                          showText={true}
                          showIcon={true}
                          iconSize="h-3.5 w-3.5"
                          className="text-white border-white/50 bg-white/10 backdrop-blur"
                        />
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-3 space-y-2">
                      {/* Title and Rating */}
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-red-500 transition-colors line-clamp-1">
                          {listing.name}
                        </h3>
                        {/* Rating - only show if available */}
                        {listing.rating && typeof listing.rating === 'number' && listing.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">{listing.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{listing.address}</span>
                      </div>

                      {/* Action Icons Row - Below Address */}
                      <div className="pt-1  flex  gap-0.5">
                        {/* Call Icon */}
                        {listing.phone && (
                          <a
                            href={`tel:${listing.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-10 w-10 rounded-full  hover:text-red-400 flex items-center justify-center transition-all hover:scale-110 "
                            aria-label={`Call ${listing.name}`}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}

                        {/* Email Icon */}
                        {listing.email && (
                          <a
                            href={`mailto:${listing.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-10 w-10 rounded-full  hover:text-red-400 flex items-center justify-center transition-all hover:scale-110 "
                            aria-label={`Email ${listing.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}

                        {/* Website Icon */}
                        {listing.website && (
                          <a
                            href={listing.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="h-10 w-10 rounded-full  hover:text-red-400 flex items-center justify-center transition-all hover:scale-110 "
                            aria-label={`Visit ${listing.name} website`}
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {/* Full-Width View Details Button */}
                      <div className="pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectListing?.(listing)
                          }}
                          className="w-full h-9 rounded-lg hover:text-red-600 flex items-center justify-center gap-2 font-medium transition-all hover:scale-[1.02] shadow-xs "
                          aria-label={`View ${listing.name} details`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
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
        )}

        {/* Mobile View All Button */}
        <div className="mt-6 sm:hidden">
          <Link href={{ pathname: "/search", query: { filter: "sponsored" } }}>
            <Button variant="outline" className="w-full">
              View All Sponsored Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}