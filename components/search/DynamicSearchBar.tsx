"use client"

import { useEffect, useMemo, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { trackClick, searchListings } from "@/app/actions/searchActions"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

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

export default function DynamicSearchBar({ placeholder = "Search listings...", size = "md", onSelect }: DynamicSearchBarProps) {
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const debounced = useDebounce(q)
  const router = useRouter()

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!debounced || debounced.trim().length < 2) {
        setItems([])
        return
      }
      setLoading(true)
      try {
        const res = await searchListings(debounced, 10)
        if (alive) setItems(res as any[])
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [debounced])

  const heightClass = size === "lg" ? "h-14 text-base" : "h-11 text-sm"

  return (
    <div className="w-full">
      <Command className="group rounded-xl border border-gray-200 shadow-none ring-0 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200">
        <div className="p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500" />
            <CommandInput
              className={`${heightClass} pl-9 outline-none focus:outline-none focus:ring-0 ring-0 border-0 shadow-none`}
              placeholder={placeholder}
              value={q}
              onValueChange={setQ as any}
            />
          </div>
        </div>
        <CommandList className="max-h-64 overflow-auto scroll-smooth">
          {loading && (
            <div className="p-4 grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          )}
          {!loading && q.trim().length >= 2 && items.length === 0 && (
            <CommandEmpty>No results found</CommandEmpty>
          )}
          {!loading && items.length > 0 && (
            <CommandGroup heading="Results">
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  value={it.name}
                  onSelect={async () => {
                    try { await trackClick(it.id, q) } catch { }
                    if (onSelect) return onSelect(it)
                    router.push(`/listing/${it.id}`)
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{it.name}</p>
                      <p className="text-xs text-gray-500 truncate">{it.cat}</p>
                    </div>
                    {typeof it.rating === "number" && (
                      <span className="text-[11px] rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-800">★ {it.rating}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {/* View more link */}
              {q.trim().length >= 2 && (
                <div className="px-3 py-2">
                  <button
                    onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
                    className="w-full text-center text-sm text-red-600 hover:underline"
                  >
                    View more results
                  </button>
                </div>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  )
}

