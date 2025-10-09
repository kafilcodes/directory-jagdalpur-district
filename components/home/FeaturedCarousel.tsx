"use client"

import * as React from "react"
import Image from "next/image"
// server-backed data

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { CAROUSEL_TRANSITION, CAROUSEL_INTERVAL_MS } from "@/lib/ui-home"
import { Eye, MapPin, TrendingUp, Star, ExternalLink } from "lucide-react"
import { CategoryBadge } from "@/components/common/CategoryBadge"

export default function FeaturedCarousel({ onSelectListing }: { onSelectListing?: (listing: any) => void }) {
  const [api, setApi] = React.useState<CarouselApi | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [items, setItems] = React.useState<any[]>([])

  React.useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          const res = await fetch("/api/listings/featured", { cache: "no-store" })
          const json = await res.json()
          if (alive && json?.ok && Array.isArray(json.items)) setItems(json.items)
        } catch { }
        setLoading(false)
      })()
    return () => { alive = false }
  }, [])

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap() ?? 0)
    api.on("select", onSelect)
    onSelect()
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  React.useEffect(() => {
    if (!api) return
    const id = setInterval(() => api.scrollNext(), CAROUSEL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [api])

  return (
    <section className="w-full pt-6 pb-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-left sm:text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 inline-flex items-center gap-2"><TrendingUp className="h-5 w-5 text-red-500" />Featured This Week </h2>
          <p className="text-gray-600 mt-1">Hand-picked premium listings</p>
        </div>

        <Carousel
          className="w-full overflow-visible"
          setApi={setApi}
          opts={{ align: "center", loop: true }}
        >
          <CarouselContent className="items-center">
            {(loading ? Array.from({ length: 3 }) : items).map((item: any, idx: number) => {
              const total = items.length || 1
              const rawDiff = Math.abs(idx - selectedIndex)
              const circularDiff = Math.min(rawDiff, total - rawDiff)
              const opacityClass = loading ? "" : circularDiff === 0 ? "opacity-100" : circularDiff === 1 ? "opacity-80" : "opacity-50"

              return (
                <CarouselItem key={item?.id ?? idx} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card
                    onClick={() => !loading && onSelectListing?.(item)}
                    className={`group overflow-hidden bg-white rounded-2xl border-0 shadow-md hover:shadow-xl ${CAROUSEL_TRANSITION} transition-opacity duration-300 ${opacityClass} h-full cursor-pointer`}
                  >
                    {/* Image Cover with Content Overlay */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden">
                      {/* Background Image */}
                      {loading ? (
                        <div className="absolute inset-0 animate-pulse bg-gray-200" />
                      ) : (
                        <>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                          />
                          {/* Dark Gradient Overlay at Bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </>
                      )}

                      {/* Premium Icon Badge - Top Right */}
                      {!loading && (item.planType === 'featured' || item.plan === 'featured') && (
                        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white shadow-lg backdrop-blur-sm ring-2 ring-white/30">
                          <Star className="h-4 w-4 fill-white" />
                        </div>
                      )}
                      {!loading && (item.planType === 'sponsored' || item.plan === 'sponsored') && (
                        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white shadow-lg backdrop-blur-sm ring-2 ring-white/30">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                      )}

                      {/* Content Overlay at Bottom */}
                      {!loading && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                          {/* Category Icon Only - No Text Badge */}
                          <CategoryBadge
                            category={item.category}
                            showText={false}
                            showIcon={true}
                          />



                          {/* Title */}
                          <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
                            {item.name}
                          </h3>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-white/90 text-sm">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="line-clamp-1 text-xs">{item.address}</span>
                          </div>

                          {/* Full-Width Icon+Text CTA Button */}
                          <div className="pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectListing?.(item)
                              }}
                              className="w-full h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center gap-2 text-white font-medium shadow-xl hover:bg-white/30 hover:scale-[1.02] transition-all duration-300 group/btn"
                              aria-label="View listing details"
                            >
                              <ExternalLink className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Loading State */}
                      {loading && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                          <div className="h-6 w-20 bg-white/20 rounded animate-pulse" />
                          <div className="h-6 w-3/4 bg-white/20 rounded animate-pulse" />
                          <div className="h-4 w-1/2 bg-white/20 rounded animate-pulse" />
                          <div className="pt-2">
                            <div className="h-10 w-full bg-white/20 rounded-lg animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </CarouselItem>
              )
            })}
          </CarouselContent>

          <div className="hidden sm:block">
            <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 border-gray-200" />
            <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 border-gray-200" />
          </div>
        </Carousel>

        {/* Dots */}
        {!loading && items.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${i === selectedIndex ? "bg-red-500" : "bg-red-200"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

