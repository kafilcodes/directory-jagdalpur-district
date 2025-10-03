"use client"
import * as React from "react"
import Link from "next/link"
import { Search, PlusCircle, Star, Info } from "lucide-react"
import { Facebook as FacebookSvg, X as XSvg, Instagram as InstagramSvg } from "@/components/icons/SocialSvgr"
import Image from "next/image"
import { usePathname } from "next/navigation"

function LogoSmall() {
  const [ok, setOk] = React.useState(true)
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center">
      {ok ? (
        <Image src="/logo.png" alt="Dhamtari Directory" width={24} height={24} className="h-6 w-6 object-contain" priority unoptimized onError={() => setOk(false)} />
      ) : (
        <span className="h-6 w-6 grid place-items-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold" aria-label="Logo fallback">DD</span>
      )}
    </span>
  )
}

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith("/user")) return null
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Dhamtari Directory" className="inline-flex items-center gap-2">
            <LogoSmall />
            <span className="hidden lg:inline font-semibold text-gray-900">Dhamtari Directory</span>
          </Link>
          <div className="flex items-center gap-3 text-gray-600">
            <a href="#" aria-label="Facebook" className="opacity-80 hover:opacity-100 hover:text-red-500 transition-colors">
              <FacebookSvg />
            </a>
            <a href="#" aria-label="X" className="opacity-80 hover:opacity-100 hover:text-red-500 transition-colors">
              <XSvg />
            </a>
            <a href="#" aria-label="Instagram" className="opacity-80 hover:opacity-100 hover:text-red-500 transition-colors">
              <InstagramSvg />
            </a>
          </div>
        </div>
        <p className="text-center text-xs sm:text-[13px] text-gray-500">© 2025 Dhamtari Directory. All rights reserved to Dhamtari District Administration</p>
        <nav className="flex items-center gap-4 text-gray-700">
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/browse">
            <Search className="h-4 w-4" /> <span className="hidden lg:inline">Browse</span>
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/sponsored">
            <Star className="h-4 w-4" /> <span className="hidden lg:inline">Sponsored</span>
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/about">
            <Info className="h-4 w-4" /> <span className="hidden lg:inline">About</span>
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/user/create-listing">
            <PlusCircle className="h-4 w-4" /> <span className="hidden lg:inline">Add Listing</span>
          </Link>
        </nav>
      </div>
    </footer>
  )
}