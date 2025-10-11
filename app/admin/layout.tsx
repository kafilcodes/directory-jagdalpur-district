"use client"

import { useState, FormEvent, ReactNode, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    KeyRound,
    LayoutDashboard,
    ListIcon,
    Users,
    BarChart3,
    Home,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    LogOut
} from "lucide-react"

interface AdminLayoutProps {
    children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [authenticated, setAuthenticated] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile toggle
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop collapse
    const pathname = usePathname()
    const router = useRouter()

    // Check for stored authentication
    useEffect(() => {
        const storedAuth = localStorage.getItem('admin_authenticated')
        if (storedAuth === 'true') {
            setAuthenticated(true)
            setIsOpen(false)
        }
    }, [])

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
            setAuthenticated(true)
            setIsOpen(false)
            setError("")
            localStorage.setItem('admin_authenticated', 'true')
            // Store admin password for Cloud Function authentication
            localStorage.setItem('adminPassword', password)
        } else {
            setError("Incorrect password. Access denied.")
            setPassword("")
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('adminPassword') // Clear stored password
        setAuthenticated(false)
        setIsOpen(true)
        setPassword("")
        // Redirect to homepage after logout
        router.push('/')
    }

    const navItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/listings", icon: ListIcon, label: "Listings" },
        { href: "/admin/users", icon: Users, label: "Users" },
        { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ]

    // Password protection modal - same as before
    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <Dialog open={isOpen} onOpenChange={() => { }} modal>
                    <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl font-bold text-gray-900">Admin Access</DialogTitle>
                            <DialogDescription className="text-center text-gray-600">
                                Enter password to access the admin dashboard
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-6 py-6">
                            <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto">
                                <Image
                                    src="/admin.svg"
                                    alt="Admin Access"
                                    width={240}
                                    height={180}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>

                            <form onSubmit={handleSubmit} className="w-full space-y-4">
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Enter admin password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-500 text-center bg-red-50 py-2 px-3 rounded-md border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                                >
                                    Access Admin Dashboard
                                </Button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // Admin layout with sidebar (NO PUBLIC HEADER)
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile header with menu button */}
            <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-lg font-bold text-gray-900">Dial Dhamtari</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex">
                {/* Sidebar with collapse functionality */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200",
                        "transition-all duration-300 ease-in-out",
                        "lg:static lg:z-auto",
                        // Mobile: slide in/out
                        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                        // Desktop: collapse/expand
                        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
                        "w-64" // Mobile always full width when open
                    )}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo Section - Match user sidebar header design */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
                            {!sidebarCollapsed ? (
                                <>
                                    <div className="flex-1 flex flex-col items-center gap-2">
                                        {/* Logo */}
                                        <div className="relative h-10 w-full max-w-[120px]">
                                            <Image
                                                src="/logo.png"
                                                alt="Dial Dhamtari"
                                                fill
                                                sizes="120px"
                                                className="object-contain"
                                                priority
                                                onError={(e) => {
                                                    // Fallback to text logo on error
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = '<div class="h-10 w-10 rounded-full bg-red-100 text-red-600 grid place-items-center text-xs font-bold mx-auto">DD</div>';
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Two-line title */}
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-900">Dial Dhamtari</div>
                                            <div className="text-xs text-gray-500">Admin Panel</div>
                                        </div>
                                    </div>
                                    {/* Desktop collapse toggle */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className="hidden lg:flex shrink-0 self-start"
                                        aria-label="Collapse sidebar"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="hidden lg:flex mx-auto"
                                    aria-label="Expand sidebar"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Navigation */}
                        <ScrollArea className="flex-1 px-2 py-4">
                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href as any}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                                                "transition-all min-h-[44px]",
                                                isActive
                                                    ? "bg-red-50 text-red-600 shadow-sm"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                                sidebarCollapsed && "lg:justify-center lg:px-2"
                                            )}
                                            title={sidebarCollapsed ? item.label : undefined}
                                        >
                                            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-red-600" : "text-gray-400")} />
                                            {!sidebarCollapsed && <span>{item.label}</span>}
                                        </Link>
                                    )
                                })}
                            </nav>

                            <Separator className="my-4" />

                            {/* Back to site link */}
                            <Link
                                href="/"
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                                    "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all min-h-[44px]",
                                    sidebarCollapsed && "lg:justify-center lg:px-2"
                                )}
                                title={sidebarCollapsed ? "Back to Site" : undefined}
                            >
                                <Home className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                {!sidebarCollapsed && <span>Back to Site</span>}
                            </Link>
                        </ScrollArea>

                        {/* Footer with Logout */}
                        <div className="px-2 py-2 border-t border-gray-200">
                            {!sidebarCollapsed && (
                                <p className="text-xs text-gray-500 px-3 mb-1">
                                    Logged in as Admin
                                </p>
                            )}
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 min-h-[44px]",
                                    sidebarCollapsed && "lg:justify-center lg:px-2"
                                )}
                                title={sidebarCollapsed ? "Sign Out" : undefined}
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>Sign Out</span>}
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main content - NO PUBLIC HEADER */}
                <main className="flex-1 overflow-x-hidden">
                    <div className={cn(
                        "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8",
                        "transition-all duration-300"
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
