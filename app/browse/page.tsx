export const dynamic = "force-static"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UNIFIED_CATEGORIES } from "@/config/categories"

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
          {UNIFIED_CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/search?cats=${category.slug}`}>
              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center  transition-colors">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${category.color} hover:bg-red-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl" aria-hidden>{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 hover:text-red-600  text-xl mb-1">{category.label}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

