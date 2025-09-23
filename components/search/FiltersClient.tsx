"use client"
import { useEffect, useMemo, useState } from "react"
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
      <div>
        <Label className="mb-1 block">Categories</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c) => (
            <label key={c} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cats.has(c)} onChange={() => toggleCat(c)} />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="sm:ml-auto w-full sm:w-64">
        <Label className="mb-1 block">Sort</Label>
        <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
