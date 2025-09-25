"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Search, MapPin, TrendingUp, Star, Users, Shield, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ModernSearch from "@/components/search/ModernSearch"
import SponsoredCarousel from "@/components/home/SponsoredCarousel"
import ModernListingDetail from "@/components/listings/ModernListingDetail"

// Stats data
const stats = [
  { label: "Active Listings", value: "2,500+", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Happy Customers", value: "10,000+", icon: <Users className="h-5 w-5" /> },
  { label: "Verified Businesses", value: "500+", icon: <Shield className="h-5 w-5" /> },
  { label: "5-Star Reviews", value: "1,200+", icon: <Star className="h-5 w-5" /> },
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
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q || q.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`)
        const j = await res.json()
        setResults(Array.isArray(j?.data) ? j.data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 1000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  const handleSelectListing = (listing: any) => {
    setSelectedListing(listing)
    setDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-gray-50 pt-16 pb-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-red-100 text-red-700 border-red-200">
              <MapPin className="h-3 w-3 mr-1" />
              Dhamtari's #1 Directory
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-10">
              Discover Local{" "}
              <span className="text-red-500 relative inline-block pb-1 md:pb-2">
                Businesses
                <svg className="pointer-events-none absolute bottom-0 left-0 w-full h-[0.35em] text-red-500" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" fill="none" strokeWidth="2" />
                </svg>
              </span>
              <br />
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with trusted local businesses, services, and professionals in Dhamtari.
              Your one-stop destination for everything local.
            </p>

            {/* Hero Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-2 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border-0 focus:ring-2 focus:ring-red-500 outline-none"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Button
                  size="lg"
                  className="h-12 px-8 bg-red-500 hover:bg-red-600 rounded-xl"
                  onClick={() => {
                    if (q.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(q.trim())}`
                    } else {
                      setShowSearch(true)
                    }
                  }}
                >
                  <Search className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>

                {/* Inline Debounced Results */}
                {q.trim().length >= 2 && (
                  <div className="mt-4 text-left max-w-2xl mx-auto">
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                          {loading ? "Searching..." : `${Math.min(results.length, 10)} result${results.length === 1 ? "" : "s"} for "${q}"`}
                        </p>
                        <a className="text-red-600 text-sm hover:underline" href={`/search?q=${encodeURIComponent(q)}`}>
                          View More
                        </a>
                      </div>
                      <ul className="divide-y">
                        {(results || []).slice(0, 10).map((item: any, idx: number) => (
                          <li key={(item.id || item.objectID || item.name || idx) as any} className="px-4 py-3 hover:bg-gray-50">
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => handleSelectListing(item)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-900 line-clamp-1">{item.name || item.listingName || "Unnamed"}</p>
                                  <p className="text-xs text-gray-500 line-clamp-1">{item.category || item.listingType || "General"} • {item.address || ""}</p>
                                </div>
                                {typeof item.rating === "number" && (
                                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    ★ {item.rating}
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                        {(!loading && results.length === 0) && (
                          <li className="px-4 py-6 text-center text-sm text-gray-500">No results found</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-sm text-gray-500">Popular:</span>
              {["Hotels", "Restaurants", "Hospitals", "Schools", "Gyms"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setShowSearch(true)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y">
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

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.name}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => setShowSearch(true)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${category.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} listings</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsored Carousel */}
      <SponsoredCarousel onSelectListing={handleSelectListing} />

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Dhamtari Directory?</h2>
            <p className="text-lg text-gray-600">Your trusted local business companion</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-500 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Verified Listings</h3>
                <p className="text-gray-600 leading-relaxed">All businesses are verified to ensure authenticity and reliability</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-500 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Community Reviews</h3>
                <p className="text-gray-600 leading-relaxed">Real reviews from real customers to help you make informed decisions</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-500 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Best Deals</h3>
                <p className="text-gray-600 leading-relaxed">Exclusive offers and discounts from premium local businesses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">List Your Business Today</h2>
          <p className="text-red-100 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
            Join thousands of successful businesses in Dhamtari. Get discovered by customers looking for services like yours.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="group gap-2 px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </section>

      {/* Search Modal/Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-x-4 top-20 bottom-4 sm:inset-x-8 sm:top-24 sm:bottom-8 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Search Directory</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ModernSearch onSelectListing={handleSelectListing} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing Detail Sheet */}
      <ModernListingDetail
        listing={selectedListing}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
