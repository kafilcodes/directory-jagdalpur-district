"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

// Debounce hook for auto-search
function useDebounce<T>(value: T, delay = 500) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(h)
    }, [value, delay])
    return debounced
}

export default function SearchPageBar() {
    const router = useRouter()
    const params = useSearchParams()
    const [q, setQ] = useState(params.get("q") || "")
    const debouncedQ = useDebounce(q, 500)

    // Auto-search when debounced value changes
    // When cleared, reverts to browse mode (no query = show all listings)
    useEffect(() => {
        const next = new URLSearchParams(params.toString())
        if (debouncedQ.trim()) {
            next.set("q", debouncedQ.trim())
        } else {
            next.delete("q")
            // When search is cleared, revert to browse mode
            // This will trigger the page to fetch initial 9 listings
        }
        router.push(`/search?${next.toString()}`, { scroll: false } as any)
    }, [debouncedQ, router, params])

    const handleVoiceResult = (text: string) => {
        setQ(text)
        // Voice input will trigger search through debounce
    }

    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 pr-20 h-12 rounded-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {q && (
                    <button
                        onClick={() => setQ("")}
                        className="h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                )}
                {require("react").createElement(require("@/components/search/VoiceInput").default, {
                    onResult: handleVoiceResult,
                    size: "md"
                })}
            </div>
        </div>
    )
}
