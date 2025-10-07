"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, TrendingUp, Star, Clock, Building2, UtensilsCrossed, Stethoscope, GraduationCap, ShoppingBag, Wrench, Home, Car, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { CATEGORIES, normalizeCategoryToSlug, labelForSlug } from "@/lib/categories"

const CATEGORY_CHIPS = [
  { label: "All", icon: null },
  { label: "Hotels", icon: Building2 },
  { label: "Restaurants", icon: UtensilsCrossed },
  { label: "Healthcare", icon: Stethoscope },
  { label: "Education", icon: GraduationCap },
  { label: "Shopping", icon: ShoppingBag },
  { label: "Services", icon: Wrench },
  { label: "Real Estate", icon: Home },
  { label: "Transport", icon: Car },
]

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance", icon: TrendingUp },
  { label: "Most Popular", value: "popular", icon: Star },
  { label: "Recent", value: "recent", icon: Clock },
]

export default function SearchControls() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const selectedSort = params.get("sort") || "relevance"
  const currentCatsParam = params.get("cats") || params.get("category") || "All"
  const selectedCategories = useMemo(() => {
    const slugs = currentCatsParam === "All" ? [] : currentCatsParam.split(",").filter(Boolean)
    return new Set(slugs)
  }, [currentCatsParam])

  const apply = (next: URLSearchParams) => {
    const url = `${pathname}?${next.toString()}`
    router.push(url as any, { scroll: false } as any)
  }

  const toggleCategory = (label: string) => {
    const next = new URLSearchParams(params.toString())
    if (label === "All") {
      next.delete("cats")
      next.delete("category")
      apply(next)
      return
    }
    const slug = normalizeCategoryToSlug(label)
    if (!slug) return
    const set = new Set(selectedCategories)
    if (set.has(slug)) set.delete(slug)
    else set.add(slug)
    if (set.size === 0) next.delete("cats")
    else next.set("cats", Array.from(set).join(","))
    next.delete("category")
    apply(next)
  }

  const changeSort = (value: string) => {
    const next = new URLSearchParams(params.toString())
    next.set("sort", value)
    apply(next)
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {/* Category filters */}
      <div className="flex gap-2 flex-nowrap">
        {CATEGORY_CHIPS.map((category) => {
          const isSelected = selectedCategories.size === 0 && category.label === "All" || selectedCategories.has(normalizeCategoryToSlug(category.label) || "__nomatch__")
          const Icon = category.icon
          return (
            <Button
              key={category.label}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category.label)}
              className={cn(
                "transition-all gap-1.5 h-8 text-xs whitespace-nowrap",
                isSelected ? "bg-red-500 hover:bg-red-600" : undefined
              )}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {category.label}
            </Button>
          )
        })}
      </div>

      {/* Sort dropdown - reduced size */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs whitespace-nowrap">
            <Filter className="h-3 w-3" />
            {SORT_OPTIONS.find(o => o.value === selectedSort)?.label ?? "Relevance"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1.5">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => changeSort(option.value)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-gray-100 flex items-center gap-1.5",
                  selectedSort === option.value && "bg-gray-100 font-medium"
                )}
              >
                <Icon className="h-3 w-3 text-gray-500" />
                {option.label}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* Clear filters - Icon button */}
      <Button
        onClick={() => {
          const next = new URLSearchParams(params.toString())
          next.delete("q"); next.delete("cats"); next.delete("category"); next.delete("sort")
          apply(next)
        }}
        variant="ghost"
        size="sm"
        className="gap-1.5 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap ml-auto"
        aria-label="Clear filters"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  )
}

