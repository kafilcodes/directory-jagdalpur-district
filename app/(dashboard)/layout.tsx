import type { ReactNode } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import OwnerSidebar from "@/components/owner/Sidebar"
import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) return (<div className="min-h-screen grid place-items-center"><p className="text-gray-600">Please sign in to access the dashboard.</p></div>)

  const db = getAdminDb()
  const udoc = await db.collection("users").doc(user.uid).get()
  const role = (udoc.exists && (udoc.data() as any)?.role) || "business"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sheet */}
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
              <Link href="/create-listing" className="rounded-md px-3 py-2 hover:bg-gray-100">Create Listing</Link>
              <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-gray-100">Profile</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <div className="hidden md:block">
            <OwnerSidebar />
          </div>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

