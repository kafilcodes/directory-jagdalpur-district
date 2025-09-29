"use client"

import * as React from "react"
import Image from "next/image"
import { SPONSORED_LISTINGS } from "@/data/sponsored.mock"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { CAROUSEL_TRANSITION, CAROUSEL_INTERVAL_MS } from "@/lib/ui-home"
import { Star, Eye, MapPin, Building2, UtensilsCrossed, Stethoscope, GraduationCap, Dumbbell, Tag, TrendingUp } from "lucide-react"

export default function FeaturedCarousel({ onSelectListing }: { onSelectListing?: (listing: any) => void }) {
  const [api, setApi] = React.useState<CarouselApi | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate small loading to show skeleton briefly; safe to remove later
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
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
    <section className="w-full pt-6 pb-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-left sm:text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 inline-flex items-center gap-2">Featured This Week <TrendingUp className="h-5 w-5 text-red-500" /></h2>
          <p className="text-gray-600 mt-1">Hand-picked premium listings</p>
        </div>

        <Carousel
          className="w-full overflow-visible"
          setApi={setApi}
          opts={{ align: "center", loop: true }}
        >
          <CarouselContent className="items-center">
            {(loading ? Array.from({ length: 3 }) : SPONSORED_LISTINGS).map((item: any, idx: number) => {
              const total = SPONSORED_LISTINGS.length
              const rawDiff = Math.abs(idx - selectedIndex)
              const circularDiff = Math.min(rawDiff, total - rawDiff)
              const opacityClass = loading ? "" : circularDiff === 0 ? "opacity-100" : circularDiff === 1 ? "opacity-80" : "opacity-50"

              return (
                <CarouselItem key={item?.id ?? idx} className="basis-[65%] sm:basis-1/3 lg:basis-1/4">
                  <Card onClick={() => !loading && onSelectListing?.(item)} className={`group overflow-hidden bg-white rounded-2xl border hover:shadow-lg ${CAROUSEL_TRANSITION} transition-opacity duration-300 ${opacityClass} h-full`} >
                    <div className="relative w-full aspect-[4/3]">
                      {/* Skeleton */}
                      {loading ? (
                        <div className="absolute inset-0 animate-pulse bg-gray-200" />
                      ) : (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 70vw, (max-width: 1024px) 40vw, 25vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <CardContent className="p-3 space-y-3 min-h-[170px] sm:min-h-[180px]">
                      {loading ? (
                        <>
                          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2 min-h-6">
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{item.name}</h3>
                            {typeof item.rating === "number" && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-700"><Star className="h-4 w-4 text-yellow-500" />{item.rating.toFixed(1)}</span>
                            )}
                          </div>
                          {/* Category badge (same logic as Sponsored) */}
                          <div className="-mt-1 min-h-6">
                            <Badge variant="outline" className="inline-flex items-center gap-1.5 border-red-500 text-gray-800">
                              {(() => {
                                const c = (item.category || "").toLowerCase()
                                return c.includes("hotel") ? <Building2 className="h-3.5 w-3.5 text-red-500" /> :
                                  c.includes("restaurant") ? <UtensilsCrossed className="h-3.5 w-3.5 text-red-500" /> :
                                    c.includes("gym") ? <Dumbbell className="h-3.5 w-3.5 text-red-500" /> :
                                      c.includes("health") ? <Stethoscope className="h-3.5 w-3.5 text-red-500" /> :
                                        (c.includes("education") || c.includes("school")) ? <GraduationCap className="h-3.5 w-3.5 text-red-500" /> :
                                          <Tag className="h-3.5 w-3.5 text-red-500" />
                              })()}
                              {item.category}
                            </Badge>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 min-h-6">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-red-500" />
                            <span className="line-clamp-1">{item.address}</span>
                          </div>

                          <div className="text-sm text-gray-600 min-h-6">
                            {item.price ? (
                              <>Starting from <span className="font-semibold text-gray-900">{item.price}</span></>
                            ) : (
                              <span className="invisible">placeholder</span>
                            )}
                          </div>
                          <div className="pt-1">
                            <Button size="sm" variant="outline" className="h-8 w-full text-sm hover:bg-red-500 hover:text-white inline-flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onSelectListing?.(item) }}>
                              <Eye className="h-4 w-4" />
                              View details
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
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
        {!loading && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {SPONSORED_LISTINGS.map((_, i) => (
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

