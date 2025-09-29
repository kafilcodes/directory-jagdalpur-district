"use client"
import Link from "next/link"
import { Search, PlusCircle, Star } from "lucide-react"
import { Facebook as FacebookSvg, X as XSvg, Instagram as InstagramSvg } from "@/components/icons/SocialSvgr"
import { usePathname } from "next/navigation"

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith("/dashboard") || pathname === "/my-listings" || pathname === "/listing" || pathname === "/submit") return null
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Facebook" className="opacity-80 hover:opacity-100">
            <FacebookSvg />
          </a>
          <a href="#" aria-label="X" className="opacity-80 hover:opacity-100">
            <XSvg />
          </a>
          <a href="#" aria-label="Instagram" className="opacity-80 hover:opacity-100">
            <InstagramSvg />
          </a>
        </div>
        <p>© 2025 Dhamtari Directory. All rights reserved to Dhamtari District Administration</p>
        <nav className="flex items-center gap-4 text-gray-700">
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/browse">
            <Search className="h-4 w-4" /> <span className="hidden sm:inline">Browse</span>
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/submit">
            <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">Add Listing</span>
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/sponsored">
            <Star className="h-4 w-4" /> <span className="hidden sm:inline">Sponsored</span>
          </Link>
        </nav>
      </div>
    </footer>
  )
}