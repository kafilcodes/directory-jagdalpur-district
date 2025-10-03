"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SearchPageBar() {
    const router = useRouter()
    const params = useSearchParams()
    const [q, setQ] = useState(params.get("q") || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const next = new URLSearchParams(params.toString())
        if (q.trim()) {
            next.set("q", q.trim())
        } else {
            next.delete("q")
        }
        router.push(`/search?${next.toString()}`, { scroll: false } as any)
    }

    const handleVoiceResult = (text: string) => {
        setQ(text)
        // Auto-submit after voice input
        setTimeout(() => {
            const next = new URLSearchParams(params.toString())
            if (text.trim()) {
                next.set("q", text.trim())
            } else {
                next.delete("q")
            }
            router.push(`/search?${next.toString()}`, { scroll: false } as any)
        }, 300)
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search listings..."
                    className="pl-12 h-14 text-base"
                />
            </div>
            {require("react").createElement(require("@/components/search/VoiceInput").default, {
                onResult: handleVoiceResult,
                size: "lg"
            })}
            <Button type="submit" className="bg-red-500 hover:bg-red-600 gap-2 px-6 h-14">
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Search</span>
            </Button>
        </form>
    )
}
