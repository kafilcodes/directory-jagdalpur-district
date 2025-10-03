"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, FilePlus, FileText, User, LogOut, Home } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOut } from "@/lib/firebase/authService"
import { cn } from "@/lib/utils"

interface UserLayoutProps {
    children: React.ReactNode
}

const menuItems = [
    {
        href: "/user/dashboard" as const,
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/user/my-listing" as const,
        label: "My Listing",
        icon: FileText,
    },
    {
        href: "/user/create-listing" as const,
        label: "Create Listing",
        icon: FilePlus,
    },
    {
        href: "/user/profile" as const,
        label: "Profile",
        icon: User,
    },
]

function SidebarNav() {
    const pathname = usePathname()

    const handleSignOut = async () => {
        const result = await signOut()
        if (result.success) {
            window.location.href = "/"
        }
    }

    return (
        <nav className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="p-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                    D
                </div>
                <span className="font-semibold text-gray-900">Business Area</span>
            </div>

            <Separator />

            {/* Navigation Links */}
            <div className="flex-1 p-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-red-50 text-red-600"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            <Separator />

            {/* Back to Site & Sign Out */}
            <div className="p-3 space-y-1">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    <Home className="h-4 w-4 shrink-0" />
                    <span>Back to Site</span>
                </Link>

                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </nav>
    )
}

/**
 * User Area Layout Component
 * Provides sidebar navigation for authenticated user pages
 * Mobile: Sheet drawer, Desktop: Fixed sidebar
 * No public header/footer rendered
 */
export function LayoutUser({ children }: UserLayoutProps) {
    const [mobileOpen, setMobileOpen] = React.useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header with Menu Trigger */}
            <div className="lg:hidden sticky top-0 z-40 bg-white border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                            D
                        </div>
                        <span className="font-semibold text-gray-900">Business Area</span>
                    </div>

                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Open navigation menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <SidebarNav />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-0">
                {/* Desktop Sidebar - Fixed */}
                <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[260px] bg-white border-r">
                    <SidebarNav />
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-start-2 lg:ml-[260px] min-h-screen">
                    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
