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
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  Search,
  MapPin,
  Building2,
  Users,
  PlusCircle,
  User,
  Home,
  Briefcase,
  Phone,
  Star,
  TrendingUp,
  Compass
} from "lucide-react"
import AuthButtons from "@/components/auth/AuthButtons"
import { getAuth } from "firebase/auth"
import { getFirebaseApp } from "@/lib/firebase/client"

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
      { name: "Real Estate", icon: <Home className="h-4 w-4" />, href: "/search?category=realestate" },
    ]
  }
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const app = getFirebaseApp()
      if (!app) return
      const auth = getAuth(app)
      return auth.onAuthStateChanged((u) => setSignedIn(!!u))
    } catch {
      // no-op
    }
  }, [])

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <MapPin className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-1 bg-red-500/10 rounded-full blur-md group-hover:bg-red-500/20 transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Dhamtari</span>
                <span className="text-xs text-gray-500 -mt-1">Directory</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {pathname !== "/" && (
                  <NavigationMenuItem>
                    <Link href="/" className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/") && "bg-gray-100"
                    )}>
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Link>
                  </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                  <Link href={"/browse" as any} className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/browse") && "bg-gray-100"
                  )}>
                    <Compass className="h-4 w-4 mr-2" />
                    Browse
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href={"/search" as any} className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/search") && "bg-gray-100"
                  )}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/submit">
              <Button variant="outline" className="gap-2 border-red-500 text-red-600 hover:bg-red-50">
                <PlusCircle className="h-4 w-4 text-red-500" />
                Add Listing
              </Button>
            </Link>
            {signedIn && (
              <Link href="/dashboard">
                <Button variant="outline" size="icon" className="relative border rounded-md">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <AuthButtons />
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col space-y-4">
                {pathname !== "/" && (
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
                      isActive("/") && "bg-gray-100"
                    )}
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                )}
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
                    isActive("/search") && "bg-gray-100"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
                <Link
                  href={"/browse" as any}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
                    isActive("/browse") && "bg-gray-100"
                  )}
                >
                  <Compass className="h-4 w-4" />
                  Browse
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
                  <Link href="/submit" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full gap-2 border-red-500 text-red-600 hover:bg-red-50">
                      <PlusCircle className="h-4 w-4 text-red-500" />
                      Add Listing
                    </Button>
                  </Link>
                  <div className="w-full">
                    <AuthButtons />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}