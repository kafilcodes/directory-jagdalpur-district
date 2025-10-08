"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FilePlus2, FileText, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { onAuthChange } from "@/lib/firebase/authService"
import { useUserPhoto } from "@/hooks/useUserPhoto"
import Image from "next/image"

const items = [
  { href: "/user/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/my-listing" as const, label: "My Listing", icon: FileText },
  { href: "/user/create-listing" as const, label: "Create Listing", icon: FilePlus2 },
  { href: "/user/profile" as const, label: "Profile", icon: User },
] as const

export default function OwnerSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [logoError, setLogoError] = useState(false)

  // Use consolidated photoURL hook with shared cache
  const { photoURL } = useUserPhoto(user)

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <aside className="sticky top-4 h-fit w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-md">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        {!logoError ? (
          <div className="relative h-10 w-full max-w-[120px] mx-auto">
            <Image
              src="/logo.png"
              alt="Dhamtari Directory"
              fill
              sizes="120px"
              className="object-contain"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          <div className="h-10 w-10 mx-auto rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 grid place-items-center text-xs font-bold">
            DD
          </div>
        )}
      </div>

      {/* Profile Section */}
      {user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {photoURL ? (
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src={photoURL}
                  alt={user.displayName || "User"}
                  fill
                  sizes="40px"
                  className="rounded-full object-cover ring-2 ring-red-100 dark:ring-red-900"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {user.displayName || "Business Owner"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]",
                active
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Link href="/">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-h-[44px]"
            aria-label="Back to Site"
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            <span>Back to Site</span>
          </button>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" })
            window.location.href = "/"
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all min-h-[44px]"
          aria-label="Sign Out"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

