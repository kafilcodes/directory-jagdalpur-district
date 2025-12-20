"use client"

import { useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { ArrowRight, MapPin, TrendingUp, Star, Users, Building2, UtensilsCrossed, Stethoscope, GraduationCap, Dumbbell, Wrench } from "lucide-react"
import DynamicSearchBar from "@/components/search/DynamicSearchBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { normalizeCategoryToSlug } from "@/lib/categories"
import { HERO_MIN_H, SECTION_VSPACE } from "@/lib/ui-home"

// Dynamic imports for heavy components - reduces initial JS bundle
const SponsoredCarousel = dynamic(() => import("@/components/home/SponsoredCarousel"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
})
const FeaturedCarousel = dynamic(() => import("@/components/home/FeaturedCarousel"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
})
const ListingDetailSheet = dynamic(() => import("@/components/listings/ListingDetailSheet"), {
  loading: () => null,
  ssr: false
})
const AddServiceDialog = dynamic(() => import("@/components/services/AddServiceDialog").then(mod => mod.AddServiceDialog), {
  loading: () => null,
  ssr: false
})
const LottieAnimation = dynamic(() => import("@/components/common/LottieAnimation"), {
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-full" />,
  ssr: false
})

// Dynamic configuration from environment variables
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";

// Stats data - Updated values per requirements
// size: Tailwind classes for individual Lottie sizing control
const stats = [
  { label: "Active Listings", value: "500+", lottie: "/lottie/active_listings.json", size: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28" },
  { label: "Verified Businesses", value: "500+", lottie: "/lottie/verified_business.json", size: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28" },
  { label: "5-Star Reviews", value: "300+", lottie: "/lottie/five_star_reviews.json", size: "w-16 h-16 sm:w-30 sm:h-30 md:w-24 md:h-24 lg:w-28 lg:h-28" },
  { label: "Happy Customers", value: "10,000+", lottie: "/lottie/happy_customers.json", size: "w-16 h-16 sm:w-30 sm:h-30 md:w-24 md:h-24 lg:w-28 lg:h-28" },
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
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)

  const handleSelectListing = (listing: any) => {
    // Open listing detail sheet by setting URL param
    if (listing?.id) {
      const url = new URL(window.location.href)
      url.searchParams.set("id", listing.id)
      router.push((url.pathname + url.search) as any, { scroll: false })
    }
  }

  // Keyboard navigation handler for category cards
  const handleCategoryKeyPress = (event: React.KeyboardEvent, categoryName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const slug = normalizeCategoryToSlug(categoryName) || categoryName.toLowerCase().replace(/\s+/g, "-")
      router.push(`/search?category=${encodeURIComponent(slug)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Skip to Main Content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Structured Data - WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: APP_NAME,
            url: process.env.NEXT_PUBLIC_SITE_URL || "",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/search?query={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {/* Hero Section */}
      <section id="main-content" role="main" className={`relative isolate overflow-hidden pt-12 pb-16 sm:pt-14 sm:pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28 ${HERO_MIN_H}`}>
        {/* Hero background image: always cover on all devices */}
        <div className="absolute inset-0 -z-10" role="img" aria-label={`${CITY_NAME} cityscape background`}>
          <Image
            src="/bg.png"
            alt={`${CITY_NAME} city landscape - local business directory background`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
        </div>
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="h-auto w-auto mb-2 sm:mb-3 md:mb-4 lg:mb-5 text-[10px] xs:text-xs sm:text-sm bg-red-500/10 text-red-500 border-red-500 px-2 py-0.5 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1.5" aria-label={`${CITY_NAME}'s number 1 business directory`}>
              <MapPin className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 mr-0.5 xs:mr-1 sm:mr-1.5" aria-hidden="true" />
              {CITY_NAME}'s #1 Directory
            </Badge>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-6xl font-bold leading-tight text-gray-900 mb-6 sm:mb-8 md:mb-10 px-2 sm:px-0">
              Discover Local{" "}
              <span className="text-red-500 relative inline-block pb-2 sm:pb-3 md:pb-4">
                Businesses
                <svg className="pointer-events-none absolute -bottom-1 left-0 w-full h-[0.35em] text-red-500 overflow-visible" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: -1 }}>
                  <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" fill="none" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
              <br />
            </h1>

            <p className="text-xs xs:text-sm sm:text-base md:text-base lg:text-lg text-gray-600 mb-6 sm:mb-7 md:mb-8 max-w-2xl mx-auto px-4 sm:px-6 md:px-0">
              Connect with trusted local businesses, services, and professionals in {CITY_NAME}.
              Your one-stop destination for everything local.
            </p>

            {/* Hero Search Bar - Reduced default size */}
            <div className="bg-transparent rounded-xl sm:rounded-2xl  sm:shadow-xl max-w-full sm:max-w-xl mx-auto px-2 sm:px-0" role="search" aria-label="Search local businesses">
              <div className="flex flex-col gap-2">
                <DynamicSearchBar placeholder="What are you looking for?" size="md" onSelect={handleSelectListing} />
                {/* JSON-LD for WebSite + potential searchAction - Removed duplicate, handled at top */}
              </div>
            </div>

            {/* Quick Search Tags */}
            <div className="mt-4 sm:mt-5 md:mt-6" role="navigation" aria-label="Quick search categories">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-500 mr-2">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 animate-bounce" aria-hidden="true" />
                  Trending:
                </span>
              </div>
              <div className="mt-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-1 sm:justify-center min-w-max">
                  {[
                    { label: "Hotels", Icon: Building2, slug: "hotels" },
                    { label: "Restaurants", Icon: UtensilsCrossed, slug: "restaurants" },
                    { label: "Hospitals", Icon: Stethoscope, slug: "healthcare" },
                    { label: "Schools", Icon: GraduationCap, slug: "education" },
                    { label: "Gyms", Icon: Dumbbell, slug: "services" },
                  ].map(({ label, Icon, slug }) => (
                    <Link key={label} aria-label={`Search ${label} in ${CITY_NAME}`} href={`/search?cats=${slug}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm border-gray-300 hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                        {label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements / Stats Section */}
        <div className="absolute top-10 sm:top-16 md:top-20 left-4 sm:left-8 md:left-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-200 rounded-full blur-2xl sm:blur-3xl opacity-30 -z-10"></div>
        <div className="absolute bottom-10 sm:bottom-16 md:bottom-20 right-4 sm:right-8 md:right-10 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-blue-200 rounded-full blur-2xl sm:blur-3xl opacity-30 -z-10"></div>

        <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-tranparent mt-8 sm:mt-10 md:mt-12 lg:mt-14" aria-label="Statistics">
          <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-1   md:gap-5 lg:gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" role="group" aria-label={`${stat.value} ${stat.label}`}>
                  <div className={`inline-flex items-center justify-center ${stat.size} rounded-full mb-2 sm:mb-2.5 md:mb-3 hover:scale-110 transition-transform duration-300 cursor-pointer`} aria-hidden="true">
                    <LottieAnimation
                      src={stat.lottie}
                      loop={true}
                      autoplay={true}
                      className="w-full h-full"
                      ariaLabel={stat.label}
                      lazyLoad={true}
                    />
                  </div>
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


      </section>



      <section>
        {/* Featured carousel at hero bottom */}
        <div className="mt-6 sm:mt-8 md:mt-10 px-3 sm:px-4 md:px-0">
          <FeaturedCarousel onSelectListing={handleSelectListing} />
        </div>
      </section>

      {/* Categories Grid - Smaller Container */}
      <section className="py-12 sm:py-14 md:py-16 lg:py-18 bg-gradient-to-r from-red-500 to-red-600 " aria-labelledby="categories-heading">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-7 md:mb-8">
            <h2 id="categories-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-50 mb-1.5 sm:mb-2">Browse by Category</h2>
            <p className="text-gray-100 text-xs sm:text-sm md:text-base">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4" role="list">
            {categories.map((category) => (
              <Card
                key={category.name}
                role="listitem"
                aria-label={`Browse ${category.count} ${category.name} listings`}
                tabIndex={0}
                className="group bg-red-500  border rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border-0"
                onClick={() => { const slug = normalizeCategoryToSlug(category.name) || category.name.toLowerCase().replace(/\s+/g, "-"); router.push(`/search?category=${encodeURIComponent(slug)}`) }}
                onKeyDown={(e) => handleCategoryKeyPress(e, category.name)}
              >
                <CardContent className="p-3 sm:p-4 md:p-5 text-center">
                  <div className={`mx-auto inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 ${category.color} rounded-xl sm:rounded-2xl mb-2 sm:mb-2.5 md:mb-3 group-hover:scale-110 transition-transform hover:bg-gray-300`} aria-hidden="true">
                    <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl ">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-100 mb-0.5 sm:mb-1">{category.name}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-300">{category.count} listings</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Providers Section - For Gig Workers */}
      <section className="py-10 sm:py-12 md:py-14 bg-gradient-to-r from-red-50 to-orange-50" aria-labelledby="services-heading">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center">
            {/* Lottie Animation - Bigger size for section graphic */}
            <div className="inline-flex items-center justify-center w-80 h-80 sm:w-25 sm:h-25 md:w-58 md:h-58 lg:w-106 lg:h-86 rounded-full mb-4 sm:mb-6" aria-hidden="true">
              <LottieAnimation
                src="/lottie/add_services_animation.json"
                loop={true}
                autoplay={true}
                className="w-full h-full"
                ariaLabel="Add your service illustration"
                lazyLoad={true}
              />
            </div>
            <h2 id="services-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Are You a Service Provider?
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-2xl mx-auto">
              Electrician, Plumber, Carpenter, Painter, Driver, Tutor, or any skilled worker?
              List your service for <span className="font-semibold text-red-600">FREE</span> and connect with customers in your area!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
              {['⚡ Electrician', '🔧 Plumber', '🪚 Carpenter', '🎨 Painter', '🚗 Driver', '📚 Tutor', '💇 Beautician', '📷 Photographer'].map((service) => (
                <Badge
                  key={service}
                  variant="secondary"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  {service}
                </Badge>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setIsAddServiceOpen(true)}
            >
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
              Add Your Service - It's Free!
            </Button>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
              No sign up required • Quick 2-minute form • Get discovered by local customers
            </p>
          </div>
        </div>
      </section>



      {/* Sponsored Carousel */}
      <SponsoredCarousel onSelectListing={handleSelectListing} />

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-18 lg:py-20 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 id="features-heading" className="text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">Why Choose {APP_NAME}?</h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 px-4">Your trusted local business companion</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 relative z-10">
                <div className="w-full max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px] mx-auto mb-4 sm:mb-5 md:mb-6">
                  <Image
                    src="/verified_listing.svg"
                    alt="Verified listings illustration - Badge with checkmark representing authenticated businesses"
                    width={280}
                    height={210}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg sm:text-lg md:text-xl font-semibold mb-3 sm:mb-3 md:mb-4 text-gray-900">Verified Listings</h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base px-2">All businesses are verified to ensure authenticity and reliability</p>
              </CardContent>
            </Card>

            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 relative z-10">
                <div className="w-full max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px] mx-auto mb-4 sm:mb-5 md:mb-6">
                  <Image
                    src="/community_reviews.svg"
                    alt="Community reviews illustration - People providing feedback and ratings for local businesses"
                    width={280}
                    height={210}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg sm:text-lg md:text-xl font-semibold mb-3 sm:mb-3 md:mb-4 text-gray-900">Community Reviews</h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base px-2">Real reviews from real customers to help you make informed decisions</p>
              </CardContent>
            </Card>

            <Card className="group text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-md bg-white overflow-hidden relative align-center">
              <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 relative z-10">
                <div className="w-full max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px] mx-auto mb-4 sm:mb-5 md:mb-6">
                  <Image
                    src="/best_deals.svg"
                    alt="Best deals illustration - Shopping bag with discount tag showing exclusive offers"
                    width={280}
                    height={210}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg sm:text-lg md:text-xl font-semibold mb-3 sm:mb-3 md:mb-4 text-gray-900">Best Deals</h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base px-2">Exclusive offers and discounts from premium local businesses</p>
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

      {/* AI Chatbot - Homepage Only */}
      {(() => {
        const { FloatingChatButton } = require("@/components/chatbot/FloatingChatButton")
        return require("react").createElement(FloatingChatButton)
      })()}

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
      />
    </div>
  )
}
