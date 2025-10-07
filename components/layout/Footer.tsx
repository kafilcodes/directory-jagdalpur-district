"use client"
import * as React from "react"
import Link from "next/link"
import { Search, PlusCircle, Star, Info, FileText, Compass } from "lucide-react"
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
    <footer className="border-t bg-white mt-auto py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Dhamtari Directory" className="inline-flex items-center gap-2">
            <LogoSmall />
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-xl font-bold text-gray-900">Dhamtari</span>
              <span className="text-xs text-gray-500 -mt-1">Directory</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-gray-600 ">
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
        <nav className="flex items-center gap-4 text-gray-700" aria-label="Footer navigation">
          <Link className="hover:text-red-500 p-2" href="/search" aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
          <Link className="hover:text-red-500 p-2" href="/browse" aria-label="Browse listings">
            <Compass className="h-4 w-4" />
          </Link>
          <Link className="hover:text-red-500 p-2" href="/about" aria-label="About us">
            <Info className="h-4 w-4" />
          </Link>
          <Link className="hover:text-red-500 p-2" href="/policies" aria-label="Policies">
            <FileText className="h-4 w-4" />
          </Link>
          <Link className="hover:text-red-500 p-2" href="/user/create-listing" aria-label="Add listing">
            <PlusCircle className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </footer>
  )
}