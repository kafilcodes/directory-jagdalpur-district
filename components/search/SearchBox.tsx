"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/features/listings/config"
import { useSearchParamsState } from "@/hooks/useSearchParamsState"

export default function SearchBox() {
  const { get, set } = useSearchParamsState()
  const q = get("q")
  const cat = get("cat")

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <Input
          placeholder="Search by business name or category..."
          defaultValue={q}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>
      <div className="w-full sm:w-56">
        <Select value={cat} onValueChange={(v) => set("cat", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
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
