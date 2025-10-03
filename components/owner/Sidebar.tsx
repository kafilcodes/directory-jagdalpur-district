"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FilePlus2, FileText, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { onAuthChange } from "@/lib/firebase/authService"

const items = [
  { href: "/user/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/my-listing" as const, label: "My Listing", icon: FileText },
  { href: "/user/create-listing" as const, label: "Create Listing", icon: FilePlus2 },
  { href: "/user/profile" as const, label: "Profile", icon: User },
] as const

export default function OwnerSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <aside className="sticky top-4 h-fit w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Profile Section */}
      {user && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-red-100"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {user.displayName || "Business Owner"}
              </h3>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {items.map((it) => {
          const Icon = it.icon
          const active = pathname === it.href || pathname.startsWith(it.href + "/")
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-red-50 text-red-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" })
            window.location.href = "/"
          }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

