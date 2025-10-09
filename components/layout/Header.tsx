"use client"

import React, { useEffect, useState } from "react"
import type { JSX } from "react";


interface CategoryItem {
  name: string;
  icon: JSX.Element;
  href: string;
}

interface Category {
  title: string;
  items: CategoryItem[];
}
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  Search,
  Building2,
  Users,
  PlusCircle,
  User,
  Home,
  Briefcase,
  Phone,
  Star,
  TrendingUp,
  Compass,
  Info
} from "lucide-react"
import Image from "next/image"
import { Facebook as FacebookSvg, X as XSvg, Instagram as InstagramSvg } from "@/components/icons/SocialSvgr"
import { signInWithGoogle, onAuthChange } from "@/lib/firebase/authService"

const categories: Category[] = [
  {
    title: "Popular Services",
    items: [
      { name: "Restaurants", icon: <Briefcase className="h-4 w-4" />, href: "/search?category=restaurants" },
      { name: "Hotels", icon: <Building2 className="h-4 w-4" />, href: "/search?category=hotels" },
      { name: "Healthcare", icon: <Users className="h-4 w-4" />, href: "/search?category=healthcare" },
      { name: "Education", icon: <Star className="h-4 w-4" />, href: "/search?category=education" },
    ]
  },
  {
    title: "Local Business",
    items: [
      { name: "Shopping", icon: <TrendingUp className="h-4 w-4" />, href: "/search?category=shopping" },
      { name: "Services", icon: <Phone className="h-4 w-4" />, href: "/search?category=services" },
      { name: "Real Estate", icon: <Home className="h-4 w-4" />, href: "/search?category=real-estate" },
    ]
  }
]


function LogoMark() {
  const [ok, setOk] = React.useState(true)
  return ok ? (
    <div className="relative h-8 w-8">
      <Image src="/logo.png" alt="Dhamtari Directory" width={32} height={32} className="h-8 w-8 object-contain" priority unoptimized onError={() => setOk(false)} />
    </div>
  ) : (
    <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 grid place-items-center text-xs font-bold" aria-label="Logo fallback">DD</div>
  )
}

export default function Header({ canShowProfileIcon: _canShowProfileIcon = false }: { canShowProfileIcon?: boolean }) {
  const router = useRouter()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsSignedIn(!!user)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true)
      setSignInError(null)

      const result = await signInWithGoogle()

      if (!result.success) {
        // Don't show error for user-cancelled actions
        if (result.errorCode !== "auth/popup-closed-by-user" && result.errorCode !== "auth/cancelled-popup-request") {
          setSignInError(result.error || "Sign in failed")
        }
        return
      }

      // Successfully signed in - close dialog and redirect
      setSignInOpen(false)
      router.push("/user/create-listing")
    } catch (e) {
      setSignInError("An unexpected error occurred. Please try again.")
      if (process.env.NODE_ENV === "development") {
        console.error("[Header] Sign-in error:", e)
      }
    } finally {
      setSigningIn(false)
    }
  }

  const onAddListing = (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (isSignedIn) {
      router.push("/user/create-listing")
    } else {
      setSignInOpen(true)
      // Ensure dialog focus
      setTimeout(() => {
        const dlg = document.querySelector("[role='dialog']") as HTMLElement | null
        dlg?.focus?.()
      }, 50)
    }
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  // Hide public header on business area routes
  if (pathname?.startsWith("/user")) {
    return null
  }


  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8 pr-28">
            <Link href="/" className="flex items-center space-x-2 group" aria-label="Dhamtari Directory home">
              <LogoMark />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Dhamtari</span>
                <span className="text-xs text-gray-500 -mt-1">Directory</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>

                <NavigationMenuItem>
                  <Link href={"/browse" as any} aria-current={isActive("/browse") ? "page" : undefined} className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/browse") && " text-red-600",
                    "hover:text-red-500 transition-colors"
                  )}>
                    <Compass className="h-4 w-4 mr-2" />
                    Browse
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href={"/search" as any} aria-current={isActive("/search") ? "page" : undefined} className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/search") && " text-red-600",
                    "hover:text-red-500 transition-colors"
                  )}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href={"/about" as any} aria-current={isActive("/about") ? "page" : undefined} className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/about") && " text-red-600",
                    "hover:text-red-500 transition-colors"
                  )}>
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* Center social icons on lg+ to avoid overlap */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 text-gray-600">
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


          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {!isSignedIn && (
              <Button onClick={onAddListing} variant="outline" className="gap-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors group">
                <PlusCircle className="h-4 w-4 text-red-500 group-hover:text-white" />
                <span className="hidden lg:inline">Add Listing</span>
              </Button>
            )}
            {isSignedIn && (
              <Link href="/user/dashboard">
                <Button variant="outline" size="icon" className="relative border rounded-md" aria-label="Open profile">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto bg-white">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col space-y-4">

                <Link
                  href="/search"
                  aria-current={isActive("/search") ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-gray-100",
                    isActive("/search") && " text-red-600"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
                <Link
                  href={"/browse" as any}
                  aria-current={isActive("/browse") ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-gray-100",
                    isActive("/browse") && " text-red-600"
                  )}
                >
                  <Compass className="h-4 w-4" />
                  Browse
                </Link>

                <Link
                  href={"/about" as any}
                  aria-current={isActive("/about") ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-gray-100",
                    isActive("/about") && " text-red-600"
                  )}
                >
                  <Info className="h-4 w-4" />
                  About
                </Link>

                <div className="border-t pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Categories</h3>
                  {categories.flatMap(cat => cat.items).map((item: CategoryItem) => (
                    <Link
                      key={item.name}
                      href={item.href as any}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  {!isSignedIn && (
                    <Button onClick={() => { setMobileMenuOpen(false); onAddListing(); }} variant="outline" className="w-full gap-2 border-red-500 text-red-600 hover:bg-red-50">
                      <PlusCircle className="h-4 w-4 text-red-500" />
                      Add Listing
                    </Button>
                  )}
                  {isSignedIn && (
                    <Link href="/user/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        {/* Sign-in Modal (global) */}
        <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
          <DialogContent id="add-listing-signin" className="sm:max-w-md" role="dialog" aria-modal="true">
            <DialogHeader>
              <DialogTitle className="text-center">Sign in required</DialogTitle>
              <DialogDescription className="text-center">Please sign in to list your business and services.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Login SVG reduced by 40% from previous: 28*0.6=16.8≈17, 18*0.6=10.8≈11 
                  To adjust size further, edit width/height props in this line (Header.tsx line 335) */}
              {(signInError ? require("@/components/icons/ErrorIllus").ErrorIllus : require("@/components/icons/Login").Login)({ width: 17, height: 11 })}
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md border shadow-sm bg-white hover:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Sign in with Google"
              >
                <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.64 31.91 29.223 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.815C14.297 16.061 18.777 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 16.318 2 9.656 6.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.388-5.205l-6.167-5.206C29.22 35.09 26.65 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
                </svg>
                <span className="font-medium">{signingIn ? "Signing in..." : "Sign in with Google"}</span>
              </button>
              {signInError && (
                <p className="text-sm text-red-600" role="alert">{signInError}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </header >
  )
}