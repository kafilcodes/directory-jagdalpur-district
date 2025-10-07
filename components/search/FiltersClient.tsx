"use client"
import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { categories, sortOptions } from "@/features/listings/config"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FiltersClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const cats = useMemo(() => new Set((sp.get("cats") || "").split(",").filter(Boolean)), [sp])
  const sort = sp.get("sort") || "relevance"

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(sp.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}` as any, { scroll: false })
  }

  function toggleCat(c: string) {
    const nextSet = new Set(cats)
    if (nextSet.has(c)) nextSet.delete(c)
    else nextSet.add(c)
    updateParam("cats", Array.from(nextSet).join(",") || undefined)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="space-y-2">
        <Label className="block text-sm text-gray-600">Categories</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {categories.map((c) => {
            const checked = cats.has(c)
            return (
              <button
                key={c}
                type="button"
                aria-pressed={checked}
                onClick={() => toggleCat(c)}
                className={[
                  "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm transition-colors",
                  checked ? "bg-red-500 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>
      <div className="sm:ml-auto w-full sm:w-64">
        <Label className="mb-1 block text-sm text-gray-600">Sort</Label>
        <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger className="bg-white dark:bg-gray-800">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
