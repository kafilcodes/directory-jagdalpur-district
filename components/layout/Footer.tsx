import Link from "next/link"
import { Search, PlusCircle, Star } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2025 Dhamtari Directory. All rights reserved to Dhamtari District Administration</p>
        <nav className="flex items-center gap-4 text-gray-700">
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/browse">
            <Search className="h-4 w-4" /> Browse
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/submit">
            <PlusCircle className="h-4 w-4" /> Add Listing
          </Link>
          <Link className="hover:text-gray-900 inline-flex items-center gap-1" href="/sponsored">
            <Star className="h-4 w-4" /> Sponsored
          </Link>
        </nav>
      </div>
    </footer>
  )
}