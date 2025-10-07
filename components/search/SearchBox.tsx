"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/features/listings/config"
import { useSearchParamsState } from "@/hooks/useSearchParamsState"
import { Search as SearchIcon } from "lucide-react"

export default function SearchBox() {
  const { get, set } = useSearchParamsState()
  const q = get("q")
  const cat = get("cat")

  function onCatChange(v: string) {
    if (v === "__all") {
      // Clear the param to show placeholder and all categories
      set("cat", "")
    } else {
      set("cat", v)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
          <SearchIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <Input
          aria-label="Search"
          placeholder="Search by business name or category..."
          defaultValue={q}
          onChange={(e) => set("q", e.target.value)}
          className="h-12 pl-11 pr-4 text-base border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        />
      </div>
      <div className="sm:border-l sm:border-gray-200 sm:pl-2">
        <Select value={cat || undefined} onValueChange={onCatChange}>
          <SelectTrigger className="h-12 w-full sm:w-56 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="__all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
