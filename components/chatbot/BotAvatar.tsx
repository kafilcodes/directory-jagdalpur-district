"use client"

import { Bot } from "lucide-react"

/**
 * Custom Bot Avatar Component
 * Uses Lucide Bot icon - icon-based like user avatar
 */
export function BotAvatar() {
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-md flex-shrink-0">
            <Bot className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
    )
}
