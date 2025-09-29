"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"

import { CATEGORIES, normalizeCategoryToSlug, labelForSlug } from "@/lib/categories"

const CATEGORY_CHIPS = ["All", ...CATEGORIES.map(c => c.label)]

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Most Popular", value: "popular" },
  { label: "Recent", value: "recent" },
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
    router.push(`${pathname}?${next.toString()}` as any)
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
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_CHIPS.map((category) => (
          <Button
            key={category}
            variant={selectedCategories.size === 0 && category === "All" || selectedCategories.has(normalizeCategoryToSlug(category) || "__nomatch__") ? "default" : "outline"}
            size="sm"
            onClick={() => toggleCategory(category)}
            className={cn(
              "transition-all",
              (selectedCategories.size === 0 && category === "All") || selectedCategories.has(category) ? "bg-red-500 hover:bg-red-600" : undefined
            )}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Clear filters */}
      <button
        onClick={() => {
          const next = new URLSearchParams(params.toString())
          next.delete("q"); next.delete("cats"); next.delete("category"); next.delete("sort")
          apply(next)
        }}
        className="text-sm text-red-600 hover:underline"
        aria-label="Clear filters"
      >
        Clear filters
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto gap-2">
            <Filter className="h-4 w-4" />
            Sort: {SORT_OPTIONS.find(o => o.value === selectedSort)?.label ?? "Relevance"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => changeSort(option.value)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100",
                selectedSort === option.value && "bg-gray-100 font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}

