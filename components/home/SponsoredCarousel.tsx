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

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";

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
    <section className="w-full py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - Enhanced */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Sponsored Listings</h2>
            <p className="text-gray-600 mt-2 text-base">Premium businesses and services in {CITY_NAME}.</p>
          </div>
          <Link href="/search?filter=sponsored">
            <Button variant="outline" className="hidden sm:flex items-center gap-2 h-11 px-6">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Skeleton while loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden border bg-white">
                <div className="h-64 bg-gray-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
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
            <CarouselContent className="-ml-6 my-10">
              {items.map((listing) => (
                <CarouselItem key={listing.id} className="pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card
                    className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl   transition-all duration-300 overflow-hidden h-full "
                    onClick={() => onSelectListing?.(listing)}
                  >
                    {/* Image Section - Bigger */}
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={listing.image}
                        alt={listing.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Icon-only attribute badge; hidden when trending */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {listing.badge && !listing.trending && (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-gray-900 shadow-lg backdrop-blur" aria-label={String(listing.badge)}>
                            {(() => {
                              switch (String(listing.badge)) {
                                case "Luxury":
                                  return <Crown className="h-5 w-5" />
                                case "24/7":
                                  return <Clock className="h-5 w-5" />
                                case "Popular":
                                  return <Star className="h-5 w-5" />
                                case "Premium":
                                  return <Gem className="h-5 w-5" />
                                default:
                                  return <Award className="h-5 w-5" />
                              }
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Trending Indicator */}
                      {listing.trending && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-yellow-400 text-black p-2.5 rounded-full shadow-lg">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                        </div>
                      )}

                      {/* Category Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                        <CategoryBadge
                          category={listing.category}
                          variant="outline"
                          showText={true}
                          showIcon={true}
                          iconSize="h-4 w-4"
                          className="text-white border-white/60 bg-white/20 backdrop-blur-sm text-sm"
                        />
                      </div>
                    </div>

                    {/* Content Section - Enhanced */}
                    <CardContent className="p-5 space-y-3">
                      {/* Title and Rating */}
                      <div>
                        <h3 className="font-bold text-xl group-hover:text-red-600 transition-colors line-clamp-1 mb-2">
                          {listing.name}
                        </h3>
                        {/* Rating - only show if available */}
                        {listing.rating && typeof listing.rating === 'number' && listing.rating > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-base font-semibold text-gray-900">{listing.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-red-600" />
                        <span className="line-clamp-1">{listing.address}</span>
                      </div>

                      {/* Action Icons Row - Below Address */}
                      <div className="pt-2 flex gap-1">
                        {/* Call Icon */}
                        {listing.phone && (
                          <a
                            href={`tel:${listing.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-11 w-11 rounded-full  hover:text-red-600 flex items-center justify-center transition-all hover:scale-110"
                            aria-label={`Call ${listing.name}`}
                          >
                            <Phone className="h-5 w-5" />
                          </a>
                        )}

                        {/* Email Icon */}
                        {listing.email && (
                          <a
                            href={`mailto:${listing.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-11 w-11 rounded-full  hover:text-red-600 flex items-center justify-center transition-all hover:scale-110"
                            aria-label={`Email ${listing.name}`}
                          >
                            <Mail className="h-5 w-5" />
                          </a>
                        )}

                        {/* Website Icon */}
                        {listing.website && (
                          <a
                            href={listing.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="h-11 w-11 rounded-full  hover:text-red-600 flex items-center justify-center transition-all hover:scale-110"
                            aria-label={`Visit ${listing.name} website`}
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                      </div>

                      {/* Full-Width View Details Button - Enhanced */}
                      <div className="pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectListing?.(listing)
                          }}
                          className="w-full h-11 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-900 flex items-center justify-center gap-2 font-semibold transition-all hover:scale-[1.02] shadow-sm"
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
              <CarouselPrevious className="absolute -left-16 top-1/2 -translate-y-1/2 bg-white shadow-xl hover:bg-gray-50 border-gray-200 h-12 w-12" />
              <CarouselNext className="absolute -right-16 top-1/2 -translate-y-1/2 bg-white shadow-xl hover:bg-gray-50 border-gray-200 h-12 w-12" />
            </div>
          </Carousel>
        )}

        {/* Mobile View All Button */}
        <div className="mt-8 sm:hidden">
          <Link href={{ pathname: "/search", query: { filter: "sponsored" } }}>
            <Button variant="outline" className="w-full h-12 text-base ">
              View All Sponsored Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}