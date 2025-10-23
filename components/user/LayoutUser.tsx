"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FilePlus, FileText, User as UserIcon, LogOut, Home, Clock, Calendar } from "lucide-react"
import { signOut, getFirebaseAuth } from "@/lib/firebase/authService"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useUserPhoto } from "@/hooks/useUserPhoto"
import { cn } from "@/lib/utils"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";

interface UserLayoutProps {
    children: React.ReactNode
}

const mainMenuItems = [
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
]

const actionsMenuItems = [
    {
        href: "/user/create-listing" as const,
        label: "Create Listing",
        icon: FilePlus,
    },
    {
        href: "/user/profile" as const,
        label: "Profile",
        icon: UserIcon,
    },
]

function AppSidebar() {
    const pathname = usePathname()
    const [user, setUser] = React.useState<User | null>(null)
    const [currentTime, setCurrentTime] = React.useState<string>("")
    const [currentDate, setCurrentDate] = React.useState<string>("")

    // Use consolidated photoURL hook with shared cache
    const { photoURL } = useUserPhoto(user)

    // Subscribe to auth state
    React.useEffect(() => {
        const auth = getFirebaseAuth()
        if (!auth) return

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
        })

        return () => unsubscribe()
    }, [])

    // Update time and date every minute
    React.useEffect(() => {
        const updateDateTime = () => {
            const now = new Date()
            // 12-hour format with AM/PM
            let hours = now.getHours()
            const minutes = now.getMinutes().toString().padStart(2, "0")
            const ampm = hours >= 12 ? 'PM' : 'AM'
            hours = hours % 12
            hours = hours ? hours : 12 // 0 should be 12
            const formattedHours = hours.toString().padStart(2, "0")
            setCurrentTime(`${formattedHours}:${minutes} ${ampm}`)

            // Format: "Thursday | 03 Oct 2025"
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
            const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            setCurrentDate(`${dayName} | ${date}`)
        }

        updateDateTime()
        const interval = setInterval(updateDateTime, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [])

    const handleSignOut = async () => {
        const result = await signOut()
        if (result.success) {
            window.location.href = "/"
        }
    }

    // Get first letter of email for avatar fallback
    const getAvatarLetter = () => {
        if (user?.email) {
            return user.email.charAt(0).toUpperCase()
        }
        return "U"
    }

    return (
        <Sidebar collapsible="icon" className="bg-gray-100">
            <SidebarHeader className="border-b border-gray-200 bg-gray-100">
                {/* Logo/Brand - Expanded State */}
                <Link href="/" className="flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:hidden hover:opacity-80 transition-opacity">
                    <div className="relative h-10 w-10 shrink-0">
                        <Image
                            src="/logo.png"
                            alt={APP_NAME}
                            fill
                            sizes="40px"
                            className="object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                                if (fallback) fallback.classList.remove('hidden')
                            }}
                        />
                        <div className="hidden h-full w-full rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-base">
                            {APP_NAME.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-900 text-base leading-tight">{APP_NAME}</span>
                        <span className="font-medium text-gray-600 text-xs">Business Area</span>
                    </div>
                </Link>

                {/* Logo Only - Collapsed State */}
                <Link href="/" className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-3 hover:opacity-80 transition-opacity">
                    <div className="relative h-8 w-8">
                        <Image
                            src="/logo.png"
                            alt={APP_NAME}
                            fill
                            sizes="32px"
                            className="object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                                if (fallback) fallback.classList.remove('hidden')
                            }}
                        />
                        <div className="hidden h-full w-full rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                            {APP_NAME.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </Link>

                {/* User Profile Section */}
                <div className="px-3 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:hidden">
                    <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-3">
                        {/* Profile Avatar & Name */}
                        <div className="flex items-center gap-3">
                            {photoURL ? (
                                <div className="relative h-10 w-10 shrink-0">
                                    <Image
                                        src={photoURL}
                                        alt={user?.displayName || "User"}
                                        fill
                                        sizes="40px"
                                        className="rounded-full object-cover ring-2 ring-gray-300"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-300">
                                    {getAvatarLetter()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user?.displayName || (user?.email?.split('@')[0]) || "User"}
                                </p>
                                <p className="text-xs text-gray-600">Welcome back</p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                <span className="font-medium">{currentDate || "Loading..."}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-5">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-xl font-bold text-gray-900">
                                    {currentTime || "--:--"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collapsed State Avatar */}
                <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
                    {photoURL ? (
                        <div className="relative h-8 w-8">
                            <Image
                                src={photoURL}
                                alt={user?.displayName || "User"}
                                fill
                                sizes="32px"
                                className="rounded-full object-cover ring-2 ring-gray-300"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-300">
                            {getAvatarLetter()}
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-gray-100">
                {/* Main Navigation Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-gray-700 font-semibold">Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainMenuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                            size="lg"
                                            className="group-data-[collapsible=icon]:justify-center"
                                        >
                                            <Link href={item.href}>
                                                <Icon className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="bg-gray-300" />

                {/* Actions Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-gray-700 font-semibold">My Business</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {actionsMenuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                            size="lg"
                                            className="group-data-[collapsible=icon]:justify-center"
                                        >
                                            <Link href={item.href}>
                                                <Icon className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 bg-gray-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Back to Site"
                            size="lg"
                            className="group-data-[collapsible=icon]:justify-center"
                        >
                            <Link href="/">
                                <Home className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
                                <span className="font-medium">Back to Site</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            tooltip="Sign Out"
                            size="lg"
                            className="group-data-[collapsible=icon]:justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
                            <span className="font-medium">Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}

/**
 * User Area Layout Component with ShadCN Sidebar
 * Provides collapsible sidebar navigation for authenticated user pages
 * Mobile: Sheet drawer, Desktop: Collapsible sidebar (icon/expanded)
 */
export function LayoutUser({ children }: UserLayoutProps) {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-gray-50">
                <AppSidebar />
                <SidebarInset>
                    {/* Header with Trigger - No elevation or border */}
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 bg-gray-50 px-4">
                        <SidebarTrigger />
                        <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 md:hidden">
                                <Image
                                    src="/logo.png"
                                    alt={APP_NAME}
                                    fill
                                    sizes="28px"
                                    className="object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                />
                                <div className="hidden h-full w-full rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                                    {APP_NAME.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <span className="font-semibold text-gray-900 md:hidden">Business Area</span>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="mx-auto max-w-5xl p-4 sm:p-5 lg:p-6">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
