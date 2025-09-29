"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, MapPin, Star, Clock, Filter, ChevronRight } from "lucide-react"
import Image from "next/image"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Dummy data for search results
const dummyListings = [
  {
    id: 1,
    name: "Taj Hotel & Restaurant",
    category: "Hotels",
    rating: 4.5,
    reviews: 234,
    address: "Main Road, Dhamtari",
    phone: "+91 98765 43210",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    featured: true,
    hours: "Open 24 hours",
    tags: ["Restaurant", "Bar", "Wifi", "Parking"],
    description: "Luxury hotel with modern amenities and fine dining restaurant"
  },
  {
    id: 2,
    name: "City Medical Store",
    category: "Healthcare",
    rating: 4.2,
    reviews: 156,
    address: "Market Area, Dhamtari",
    phone: "+91 98765 43211",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
    featured: false,
    hours: "9:00 AM - 9:00 PM",
    tags: ["Pharmacy", "Medicine", "Healthcare"],
    description: "24/7 pharmacy with home delivery service"
  },
  {
    id: 3,
    name: "Royal Electronics",
    category: "Shopping",
    rating: 4.8,
    reviews: 412,
    address: "Gandhi Chowk, Dhamtari",
    phone: "+91 98765 43212",
    image: "https://images.unsplash.com/photo-1556740714-a8395b3bf30f?w=400",
    featured: true,
    hours: "10:00 AM - 8:00 PM",
    tags: ["Electronics", "Mobiles", "Appliances", "Service"],
    description: "Authorized dealer for all major electronics brands"
  },
  {
    id: 4,
    name: "Green Valley School",
    category: "Education",
    rating: 4.7,
    reviews: 189,
    address: "Education City, Dhamtari",
    phone: "+91 98765 43213",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400",
    featured: false,
    hours: "8:00 AM - 2:00 PM",
    tags: ["School", "CBSE", "Sports", "Labs"],
    description: "Leading CBSE school with modern infrastructure"
  },
  {
    id: 5,
    name: "Spice Garden Restaurant",
    category: "Restaurants",
    rating: 4.3,
    reviews: 567,
    address: "Food Street, Dhamtari",
    phone: "+91 98765 43214",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    featured: true,
    hours: "11:00 AM - 11:00 PM",
    tags: ["Vegetarian", "Family", "AC", "Delivery"],
    description: "Authentic Indian cuisine with home delivery"
  },
  {
    id: 6,
    name: "Fitness First Gym",
    category: "Services",
    rating: 4.6,
    reviews: 234,
    address: "Sports Complex, Dhamtari",
    phone: "+91 98765 43215",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    featured: false,
    hours: "5:00 AM - 10:00 PM",
    tags: ["Gym", "Fitness", "Personal Training", "Yoga"],
    description: "Modern gym with certified trainers"
  }
]

const categories = ["All", "Hotels", "Restaurants", "Healthcare", "Shopping", "Education", "Services"]
const sortOptions = ["Relevance", "Rating", "Distance", "Popular"]

interface SearchResultProps {
  onSelectListing: (listing: any) => void
}

export default function ModernSearch({ onSelectListing }: SearchResultProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSort, setSelectedSort] = useState("Relevance")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [filteredResults, setFilteredResults] = useState(dummyListings)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Filter results based on search query and category
    let results = dummyListings

    if (searchQuery) {
      results = results.filter(
        item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedCategory !== "All") {
      results = results.filter(item => item.category === selectedCategory)
    }

    // Sort results
    if (selectedSort === "Rating") {
      results = [...results].sort((a, b) => b.rating - a.rating)
    } else if (selectedSort === "Popular") {
      results = [...results].sort((a, b) => b.reviews - a.reviews)
    }

    setFilteredResults(results)
  }, [searchQuery, selectedCategory, selectedSort])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="w-full space-y-6">
      {/* Search Bar Section */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search businesses, services, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="h-14 pl-12 pr-12 text-base border-2 focus:border-red-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Quick Search Suggestions */}
        {isSearchFocused && searchQuery === "" && (
          <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {["Hotels near me", "Best restaurants", "24/7 pharmacy", "Schools", "Gym"].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setSearchQuery(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "transition-all",
                selectedCategory === category && "bg-red-500 hover:bg-red-600"
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-2">
              <Filter className="h-4 w-4" />
              Sort: {selectedSort}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedSort(option)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100",
                  selectedSort === option && "bg-gray-100 font-medium"
                )}
              >
                {option}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold">{filteredResults.length}</span> results
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Search Results Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResults.map((listing) => (
          <Card
            key={listing.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
            onClick={() => onSelectListing(listing)}
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={listing.image}
                alt={listing.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {listing.featured && (
                <Badge className="absolute top-3 left-3 bg-red-500">Featured</Badge>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                  {listing.category}
                </Badge>
                <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                  <Clock className="h-3 w-3 mr-1" />
                  {listing.hours}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-red-500 transition-colors">
                    {listing.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium ml-1">{listing.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({listing.reviews} reviews)</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{listing.address}</span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {listing.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {listing.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{listing.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredResults.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  )
}