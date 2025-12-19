export const dynamic = "force-static"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UNIFIED_CATEGORIES } from "@/config/categories"
import { SERVICE_CATEGORIES } from "@/config/services"

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Categories Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Business Categories</h1>
          <p className="text-gray-600 mt-1">Explore all business categories and jump to filtered results</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {UNIFIED_CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/search?cats=${category.slug}`}>
              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                <CardContent className="p-6 text-center transition-colors">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${category.color} group-hover:bg-red-100 rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                    <span className="text-2xl" aria-hidden>{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600 text-base sm:text-lg mb-1 transition-colors">{category.label}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Service Providers Section */}
        <div className="mt-16 mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Find Service Providers</h2>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent" />
          </div>
          <p className="text-gray-600 mt-1">Browse skilled workers and professionals for your needs</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
          {SERVICE_CATEGORIES.map((service) => (
            <Link key={service.slug} href={`/search?type=service&serviceType=${service.slug}`}>
              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-orange-50/30">
                <CardContent className="p-5 text-center transition-colors">
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${service.color} group-hover:bg-orange-100 rounded-xl mb-3 group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                    <span className="text-xl" aria-hidden>{service.icon}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-orange-600 text-sm sm:text-base transition-colors">{service.label}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

