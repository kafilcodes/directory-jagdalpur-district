"use client"
import * as React from "react"
import Link from "next/link"
import { Search, PlusCircle, Info, FileText, Compass, Building2, UtensilsCrossed, ShoppingBag, Car, Stethoscope, GraduationCap, Wrench, Store, Star, TrendingUp, Mail } from "lucide-react"
import { Facebook as FacebookSvg, X as XSvg, Instagram as InstagramSvg } from "@/components/icons/SocialSvgr"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { CATEGORIES } from "@/lib/categories"

function LogoSmall() {
  const [ok, setOk] = React.useState(true)
  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center">
      {ok ? (
        <Image src="/logo.png" alt="Dial Dhamtari" width={32} height={32} className="h-8 w-8 object-contain" priority unoptimized onError={() => setOk(false)} />
      ) : (
        <span className="h-8 w-8 grid place-items-center rounded-full bg-red-100 text-red-600 text-xs font-bold" aria-label="Logo fallback">DD</span>
      )}
    </span>
  )
}

// Icon mapping for categories
const getCategoryIcon = (slug: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    hotels: <Building2 className="h-5 w-5" />,
    restaurants: <UtensilsCrossed className="h-5 w-5" />,
    stores: <ShoppingBag className="h-5 w-5" />,
    tourism: <Car className="h-5 w-5" />,
    healthcare: <Stethoscope className="h-5 w-5" />,
    education: <GraduationCap className="h-5 w-5" />,
    shopping: <ShoppingBag className="h-5 w-5" />,
    services: <Wrench className="h-5 w-5" />,
  }
  return iconMap[slug] || <Store className="h-5 w-5" />
}

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith("/user")) return null

  return (
    <footer className="border-t bg-gradient-to-b from-white to-gray-50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" aria-label="Dial Dhamtari" className="inline-flex items-center gap-3 group">
              <LogoSmall />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">Dial Dhamtari</span>
              </div>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your trusted local business directory. Discover, connect, and grow with Dhamtari's finest businesses.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <FacebookSvg />
              </a>
              <a
                href="#"
                aria-label="X"
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <XSvg />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <InstagramSvg />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Links</h3>
            <nav className="flex flex-col gap-3" aria-label="Footer quick links">
              <Link href="/search" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Link>
              <Link href="/browse" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Browse
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Info className="h-4 w-4" />
                About Us
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Link>
              <Link href="/policies" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Policies
              </Link>
            </nav>
          </div>

          {/* For Business */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">For Business</h3>
            <nav className="flex flex-col gap-3" aria-label="Footer business links">
              <Link href="/user/create-listing" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Listing
              </Link>
              <Link href="/user/dashboard" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/sponsored" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <Star className="h-4 w-4" />
                Sponsored Listings
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-red-500 transition-colors inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Advertise With Us
              </Link>
            </nav>
          </div>          {/* Browse by Category */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Browse by Category</h3>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  href={`/search?category=${category.slug}`}
                  className="group flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-all duration-200"
                  aria-label={`Browse ${category.label}`}
                >
                  <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                    {getCategoryIcon(category.slug)}
                  </span>
                  <span className="text-xs font-medium">{category.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              © 2025 Dial Dhamtari. All rights reserved to Dhamtari District Administration
            </p>
            <div className="flex items-center gap-3">
              <Link href="/policies" className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/policies" className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                Terms of Service
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={"/admin" as any} className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}