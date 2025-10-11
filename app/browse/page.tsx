export const dynamic = "force-static"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const categories = [
  { name: "Hotels", slug: "hotels", icon: "🏨", color: "bg-blue-100" },
  { name: "Restaurants", slug: "restaurants", icon: "🍽️", color: "bg-green-100" },
  { name: "Healthcare", slug: "healthcare", icon: "🏥", color: "bg-red-100" },
  { name: "Shopping", slug: "shopping", icon: "🛍️", color: "bg-purple-100" },
  { name: "Education", slug: "education", icon: "🎓", color: "bg-yellow-100" },
  { name: "Services", slug: "services", icon: "🔧", color: "bg-indigo-100" },
  { name: "Real Estate", slug: "realestate", icon: "🏠", color: "bg-pink-100" },
  { name: "Transport", slug: "transport", icon: "🚗", color: "bg-gray-100" },
]

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Categories</h1>
          <p className="text-gray-600 mt-1">Explore all categories and jump to filtered results</p>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/search?category=${category.slug}`}>
              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${category.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl" aria-hidden>{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

