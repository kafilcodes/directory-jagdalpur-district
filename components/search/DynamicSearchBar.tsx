"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Search, MapPin, Star, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/common/CategoryBadge"
import Image from "next/image"

export type DynamicSearchBarProps = {
  placeholder?: string
  size?: "lg" | "md"
  onSelect?: (item: any) => void
}

function useDebounce<T>(value: T, delay = 1000) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

// Enhanced skeleton with shimmer effect
function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 animate-pulse">
      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="h-3 w-full rounded bg-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export default function DynamicSearchBar({ placeholder = "Search listings...", size = "md", onSelect }: DynamicSearchBarProps) {
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const debounced = useDebounce(q, 1000)
  const router = useRouter()
  const commandRef = useRef<HTMLDivElement>(null)

  // Handle API search
  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!debounced || debounced.trim().length < 2) {
        setItems([])
        setIsOpen(false)
        return
      }
      setLoading(true)
      setIsOpen(true)
      try {
        // Call API route instead of server function directly
        const response = await fetch(`/api/search?q=${encodeURIComponent(debounced)}&limit=10&sort=relevance`)
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        const json = await response.json()
        if (alive && json.ok) {
          setItems(json.data || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Search error:', error)
        if (alive) {
          setItems([])
          setIsOpen(false)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [debounced])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    if (isOpen || isFocused) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isFocused])

  const heightClass = size === "lg" ? "h-12 text-base" : "h-10 text-sm"

  return (
    <div className="w-full relative">
      <Command
        ref={commandRef}
        className={`
          group rounded-2xl border-2 bg-white relative overflow-visible
          transition-all duration-300 ease-out
          ${isFocused
            ? 'border-red-500 shadow-2xl shadow-red-500/10 scale-105 z-50'
            : 'border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300'
          }
        `}
      >
        <div className={`flex items-center gap-2 sm:gap-3 ${size === "lg" ? "p-3" : "p-2 sm:p-3"}`}>
          {/* Search Icon - Left */}
          <Search
            className={`
              ${size === "lg" ? "h-5 w-5" : "h-4 w-4"} flex-shrink-0 transition-all duration-300
              ${isFocused ? 'text-red-500 scale-110' : 'text-gray-400'}
            `}
          />

          {/* Search Input - Center (flex-1) */}
          <input
            type="text"
            className={`${heightClass} flex-1 px-0 outline-none focus:outline-none focus:ring-0 ring-0 border-0 shadow-none bg-transparent placeholder:text-gray-400 text-gray-900`}
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              if (q.trim().length >= 1 && items.length > 0) {
                setIsOpen(true)
              }
            }}
            onBlur={() => {
              // Delay to allow click events on results
              setTimeout(() => setIsFocused(false), 200)
            }}
          />

          {/* Action Buttons - Right */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {loading && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            )}
            {q && !loading && (
              <button
                onClick={() => {
                  setQ("")
                  setItems([])
                  setIsOpen(false)
                }}
                className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:rotate-90"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
            {require("react").createElement(require("@/components/search/VoiceInput").default, {
              onResult: (text: string) => setQ(text),
              size: size === "lg" ? "md" : "sm"
            })}
          </div>
        </div>
        {/* Enhanced Results Dropdown with smooth animations - Fixed overlay */}
        <div
          className={`
            fixed left-1/2 -translate-x-1/2 top-auto z-[100] mt-3 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl
            transition-all duration-300 ease-out
            ${size === "lg" ? "w-full max-w-xl" : "w-full max-w-lg"}
            ${q.trim().length >= 1 && isOpen && (items.length > 0 || loading)
              ? 'max-h-[600px] opacity-100 translate-y-0'
              : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
            }
          `}
          style={{
            top: commandRef.current ? `${commandRef.current.getBoundingClientRect().bottom + 12}px` : 'auto'
          }}
        >
          <div className="max-h-[600px] overflow-y-auto p-3 custom-scrollbar">
            {loading && (
              <>
                <SkeletonCard />
                <div className="mt-3">
                  <SkeletonCard />
                </div>
                <div className="mt-3">
                  <SkeletonCard />
                </div>
              </>
            )}
            {!loading && q.trim().length >= 2 && items.length === 0 && (
              <div className="p-8 text-center animate-fade-in">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No results found</p>
                <p className="text-xs text-gray-500">Try different keywords</p>
              </div>
            )}
            {!loading && items.length > 0 && (
              <div className="space-y-2">
                {items.slice(0, 10).map((it, index) => {
                  // Extract image URL from various possible fields
                  const imageUrl = it.thumbnail ||
                    (it.images && Array.isArray(it.images) && it.images.length > 0
                      ? (typeof it.images[0] === 'string' ? it.images[0] : it.images[0]?.url)
                      : null) ||
                    (it.photos && Array.isArray(it.photos) && it.photos.length > 0 ? it.photos[0] : null) ||
                    (it.googlePhotos && Array.isArray(it.googlePhotos) && it.googlePhotos.length > 0 ? it.googlePhotos[0] : null) ||
                    it.photoUrl

                  // Clean address - remove Dhamtari, Chhattisgarh, Pincode, India
                  const rawAddress = it.address || it.formattedAddress || (it.address?.formattedAddress) || ""
                  const cleanAddress = (typeof rawAddress === 'string' ? rawAddress : JSON.stringify(rawAddress))
                    ?.replace(/,?\s*Dhamtari,?\s*/gi, '')
                    ?.replace(/,?\s*Chhattisgarh,?\s*/gi, '')
                    ?.replace(/,?\s*India,?\s*/gi, '')
                    ?.replace(/,?\s*\d{6},?\s*/g, '') // Remove 6-digit pincodes
                    ?.trim()
                    ?.replace(/^,|,$/g, '') // Remove leading/trailing commas
                    ?.trim()

                  // Determine plan type
                  const planType = it.planType || (it.activePlan?.type) || (it.monetization?.type)

                  return (
                    <div
                      key={it.id}
                      onClick={async () => {
                        setIsOpen(false)
                        if (onSelect) {
                          onSelect(it)
                        } else {
                          // Track click via API endpoint (fire-and-forget)
                          try {
                            fetch("/api/search-click", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ listingId: it.id, q }),
                              keepalive: true,
                            })
                          } catch { }
                          router.push(`/search?q=${encodeURIComponent(q)}`)
                        }
                      }}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-red-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fade-in 0.4s ease-out forwards'
                      }}
                    >
                      {/* Thumbnail with Plan Badge */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={it.name || it.businessName || "Listing"}
                            fill
                            sizes="(max-width: 640px) 64px, 80px"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            unoptimized
                          />
                        ) : (
                          <span className="text-gray-400 text-xl sm:text-2xl font-bold">
                            {(it.name || it.businessName || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                        {/* Plan badge on image - only for paid plans */}
                        {planType === 'featured' && (
                          <div className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            ★
                          </div>
                        )}
                        {planType === 'sponsored' && (
                          <div className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            S
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                        {/* Name - left aligned */}
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate text-left group-hover:text-red-600 transition-colors leading-tight">
                          {it.name || it.businessName || "Unnamed Listing"}
                        </h3>

                        {/* Category with icon */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {(it.cat || it.category || it.categorySlug) && (
                            <CategoryBadge
                              category={it.cat || it.category || it.categorySlug}
                              variant="secondary"
                              showText={true}
                              showIcon={true}
                              iconSize="h-3 w-3"
                              className="text-xs"
                            />
                          )}
                        </div>

                        {/* Address - cleaned */}
                        {cleanAddress && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                            <span className="truncate">{cleanAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* View all results */}
                {items.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        router.push(`/search?q=${encodeURIComponent(q)}`)
                      }}
                      className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors"
                    >
                      View all results →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Command>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 10px;
          transition: background 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `}</style>
    </div>
  )
}

