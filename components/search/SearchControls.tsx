"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Combobox } from "@/components/ui/combobox"
import { Filter, TrendingUp, Star, Clock, Crown, Gem, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { UNIFIED_CATEGORIES } from "@/config/categories"

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance", icon: TrendingUp },
  { label: "Most Popular", value: "popular", icon: Star },
  { label: "Recent", value: "recent", icon: Clock },
]

// Plan filter options (uses filter param, not sort)
const PLAN_FILTER_OPTIONS = [
  { label: "Featured & Sponsored", value: "premium", icon: Sparkles },
  { label: "Sponsored Only", value: "sponsored", icon: Crown },
  { label: "Featured Only", value: "featured", icon: Gem },
]

export default function SearchControls() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const selectedSort = params.get("sort") || "relevance"
  const selectedPlanFilter = params.get("filter") || ""
  const currentCatsParam = params.get("cats") || params.get("category") || ""
  const selectedCategories = useMemo(() => {
    const slugs = currentCatsParam.split(",").filter(Boolean)
    return slugs
  }, [currentCatsParam])

  const apply = (next: URLSearchParams) => {
    const url = `${pathname}?${next.toString()}`
    router.push(url as any, { scroll: false } as any)
  }

  const handleCategoryChange = (value: string | string[]) => {
    const next = new URLSearchParams(params.toString())
    const categories = Array.isArray(value) ? value : value ? [value] : []

    if (categories.length === 0) {
      next.delete("cats")
      next.delete("category")
    } else {
      next.set("cats", categories.join(","))
      next.delete("category")
    }
    apply(next)
  }

  const changeSort = (value: string) => {
    const next = new URLSearchParams(params.toString())
    next.set("sort", value)
    apply(next)
  }

  const changePlanFilter = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) {
      next.set("filter", value)
    } else {
      next.delete("filter")
    }
    apply(next)
  }

  // Prepare combobox options with category icons
  const categoryOptions = UNIFIED_CATEGORIES.map((cat) => ({
    value: cat.slug,
    label: (
      <div className="flex items-center gap-2">
        <span className="text-base">{cat.icon}</span>
        <span>{cat.label}</span>
      </div>
    ),
    keywords: [cat.label, cat.slug, cat.name],
  }))

  return (
    <div className="flex items-center gap-3  overflow-x-auto pb-2 scrollbar-hide group-hover:text-red-600">
      {/* Category Combobox Filter */}
      <div className="min-w-[200px] max-w-[280px ]">
        <Combobox
          options={categoryOptions}
          value={selectedCategories}
          onChange={handleCategoryChange}
          placeholder="All Categories"
          searchPlaceholder="Search categories..."
          emptyText="No category found."
          multiple={true}
          className="h-8 text-xs border-0.5 shadow-sm hover:shadow-md hover:border-red-500 transition-all duration-300  "
        />
      </div>

      {/* Sort dropdown - white background like filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs whitespace-nowrap hover:text-red-600 border-0.5 shadow-sm hover:shadow-md hover:border-red-500 transition-all duration-300">
            <Filter className="h-3 w-3" />
            {SORT_OPTIONS.find(o => o.value === selectedSort)?.label ?? "Relevance"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1.5 bg-white">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => changeSort(option.value)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-gray-100 flex items-center gap-1.5",
                  selectedSort === option.value && "bg-gray-100 text-red-600 font-medium"
                )}
              >
                <Icon className="h-3 w-3 text-gray-500" />
                {option.label}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* Plan Filter dropdown - Featured/Sponsored */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 h-8 text-xs whitespace-nowrap hover:text-red-600 border-0.5 shadow-sm hover:shadow-md hover:border-red-500 transition-all duration-300",
              selectedPlanFilter && "bg-red-50 text-red-600 "
            )}
          >
            {selectedPlanFilter ? (
              <>
                {PLAN_FILTER_OPTIONS.find(o => o.value === selectedPlanFilter)?.icon &&
                  (() => {
                    const Icon = PLAN_FILTER_OPTIONS.find(o => o.value === selectedPlanFilter)?.icon!
                    return <Icon className="h-3 w-3" />
                  })()
                }
                {PLAN_FILTER_OPTIONS.find(o => o.value === selectedPlanFilter)?.label ?? "Plans"}
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Plans
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1.5 bg-white">
          <button
            onClick={() => changePlanFilter("")}
            className={cn(
              "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-gray-100 flex items-center gap-1.5",
              !selectedPlanFilter && "bg-gray-100 text-red-600 font-medium"
            )}
          >
            <Filter className="h-3 w-3 text-gray-500" />
            All Plans
          </button>
          {PLAN_FILTER_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => changePlanFilter(option.value)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-gray-100 flex items-center gap-1.5",
                  selectedPlanFilter === option.value && "bg-gray-100 text-red-600 font-medium"
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
          next.delete("q"); next.delete("cats"); next.delete("category"); next.delete("sort"); next.delete("filter")
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

