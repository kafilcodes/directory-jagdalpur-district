import type { ReactNode } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple business sidebar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between lg:hidden">
        <div className="text-lg font-semibold">Business Area</div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="mt-6 grid gap-2">
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-gray-100">Dashboard</Link>
              <Link href="/dashboard/my-listings" className="rounded-md px-3 py-2 hover:bg-gray-100">My Listings</Link>
              <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-gray-100">Profile</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-2">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Business</div>
            <nav className="grid gap-1 text-sm">
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-gray-100">Dashboard</Link>
              <Link href="/dashboard/my-listings" className="rounded-md px-3 py-2 hover:bg-gray-100">My Listings</Link>
              <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-gray-100">Profile</Link>
            </nav>
          </div>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  )
}

