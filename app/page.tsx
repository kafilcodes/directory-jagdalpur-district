"use client"

import { useState, Suspense } from "react"
import { ArrowRight, MapPin, TrendingUp, Star, Users, Shield, Award, Building2, UtensilsCrossed, Stethoscope, GraduationCap, Dumbbell } from "lucide-react"
import DynamicSearchBar from "@/components/search/DynamicSearchBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SponsoredCarousel from "@/components/home/SponsoredCarousel"
import FeaturedCarousel from "@/components/home/FeaturedCarousel"
import ListingDetailSheet from "@/components/listings/ListingDetailSheet"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { normalizeCategoryToSlug } from "@/lib/categories"
import { HERO_MIN_H, SECTION_VSPACE } from "@/lib/ui-home"

// Stats data - Updated values per requirements
const stats = [
  { label: "Active Listings", value: "500+", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Verified Businesses", value: "500+", icon: <Shield className="h-5 w-5" /> },
  { label: "5-Star Reviews", value: "300+", icon: <Star className="h-5 w-5" /> },
  { label: "Happy Customers", value: "10,000+", icon: <Users className="h-5 w-5" /> },
]

// Categories data
const categories = [
  { name: "Hotels", icon: "🏨", count: 234, color: "bg-blue-100" },
  { name: "Restaurants", icon: "🍽️", count: 456, color: "bg-green-100" },
  { name: "Healthcare", icon: "🏥", count: 123, color: "bg-red-100" },
  { name: "Shopping", icon: "🛍️", count: 789, color: "bg-purple-100" },
  { name: "Education", icon: "🎓", count: 345, color: "bg-yellow-100" },
  { name: "Services", icon: "🔧", count: 567, color: "bg-indigo-100" },
  { name: "Real Estate", icon: "🏠", count: 234, color: "bg-pink-100" },
  { name: "Transport", icon: "🚗", count: 456, color: "bg-gray-100" },
]

export default function HomePage() {
  const router = useRouter()

  const handleSelectListing = (listing: any) => {
    // Open listing detail sheet by setting URL param
    if (listing?.id) {
      const url = new URL(window.location.href)
      url.searchParams.set("id", listing.id)
      router.push((url.pathname + url.search) as any, { scroll: false })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className={`relative isolate overflow-hidden pt-16 pb-24 ${HERO_MIN_H}`}>
        {/* Hero background image: always cover on all devices */}
        <div className="absolute inset-0 -z-10">
          <Image src="/bg.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-40" />
        </div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-red-100 text-red-700 border-red-200">
              <MapPin className="h-3 w-3 mr-1" />
              Dhamtari's #1 Directory
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-10">
              Discover Local{" "}
              <span className="text-red-500 relative inline-block pb-3 md:pb-4">
                Businesses
                <svg className="pointer-events-none absolute -bottom-1 left-0 w-full h-[0.35em] text-red-500 overflow-visible" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: -1 }}>
                  <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" fill="none" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
              <br />
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with trusted local businesses, services, and professionals in Dhamtari.
              Your one-stop destination for everything local.
            </p>

            {/* Hero Search Bar - Reduced default size */}
            <div className="bg-white rounded-2xl shadow-xl max-w-xl mx-auto">
              <div className="flex flex-col gap-2">
                <DynamicSearchBar placeholder="What are you looking for?" size="md" onSelect={handleSelectListing} />
                {/* JSON-LD for WebSite + potential searchAction */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "WebSite",
                      name: "Dhamtari Directory",
                      url: (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
                      potentialAction: {
                        "@type": "SearchAction",
                        target: (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com") + "/search?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                      }
                    })
                  }}
                />
              </div>
            </div>

            {/* Quick Search Tags */}
            <div className="mt-6">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 mr-2">
                  <TrendingUp className="h-4 w-4 text-red-500 animate-pulse" aria-hidden="true" />
                  Trending:
                </span>
              </div>
              <div className="mt-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
                <div className="flex items-center gap-2 px-1 sm:justify-center min-w-max">
                  {[
                    { label: "Hotels", Icon: Building2, slug: "hotels" },
                    { label: "Restaurants", Icon: UtensilsCrossed, slug: "restaurants" },
                    { label: "Hospitals", Icon: Stethoscope, slug: "healthcare" },
                    { label: "Schools", Icon: GraduationCap, slug: "education" },
                    { label: "Gyms", Icon: Dumbbell, slug: "services" },
                  ].map(({ label, Icon, slug }) => (
                    <Link key={label} aria-label={`Search ${label}`} href={`/search?cats=${slug}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm border-gray-300 hover:border-red-500  hover:text-red-600"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-200 rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10"></div>

        <section className="py-8 sm:py-12 bg-tranparent">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-tranparent text-[#EF4444] hover:text-red-100 rounded-full mb-2 sm:mb-3 outline outline-1 outline-red-200 shadow-sm hover:scale-110 transition-transform duration-300 cursor-pointer">
                    {stat.icon}
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


      </section>



      <section>
        {/* Featured carousel at hero bottom */}
        <div className="mt-8">
          <FeaturedCarousel onSelectListing={handleSelectListing} />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className=" mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse by Category</h2>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.name}
                role="link"
                aria-label={`Browse ${category.name}`}
                tabIndex={0}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-500/40 border-0"
                onClick={() => { const slug = normalizeCategoryToSlug(category.name) || category.name.toLowerCase().replace(/\s+/g, "-"); router.push(`/search?category=${encodeURIComponent(slug)}`) }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto inline-flex items-center justify-center w-20 h-20 ${category.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500">{category.count} listings</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>






      {/* Sponsored Carousel */}
      <SponsoredCarousel onSelectListing={handleSelectListing} />

      {/* Option B (commented): integrate stats into features section for a tighter merge */}
      {false && (
        <section className="py-12 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-500 rounded-full mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Dhamtari Directory?</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Your trusted local business companion</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-8 relative z-10">
                <div className="w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] mx-auto mb-6">
                  <Image
                    src="/verified_listing.svg"
                    alt="Verified Listings"
                    width={280}
                    height={210}
                    className="w-70 h-50 justify-center align-center  pl-3 pt-3"
                    priority
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Verified Listings</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">All businesses are verified to ensure authenticity and reliability</p>
              </CardContent>
            </Card>

            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-8 relative z-10">
                <div className="w-full max-w-[150px] sm:max-w-[240px] md:max-w-[280px] mx-auto mb-6">
                  <Image
                    src="/community_reviews.svg"
                    alt="Community Reviews"
                    width={280}
                    height={210}
                    className="w-70 h-50 justify-center align-center  pl-3 pt-3"
                    priority
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Community Reviews</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Real reviews from real customers to help you make informed decisions</p>
              </CardContent>
            </Card>

            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-8 relative z-10">
                <div className="w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] mx-auto mb-6">
                  <Image
                    src="/best_deals.svg"
                    alt="Best Deals"
                    width={280}
                    height={210}
                    className="w-70 h-50 justify-center align-center  pl-3 pt-3"
                    priority
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Best Deals</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Exclusive offers and discounts from premium local businesses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {(() => {
        const CTASection = require("@/components/home/CTASection").default
        return require("react").createElement(CTASection)
      })()}


      {/* Listing Detail Sheet - Uses URL params */}
      <Suspense fallback={null}>
        <ListingDetailSheet />
      </Suspense>
    </div>
  )
}
