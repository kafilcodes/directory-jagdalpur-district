"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { BotMessageSquare } from 'lucide-react';
import { Chatbot } from "./Chatbot"

/**
 * Floating Action Button for AI Chatbot
 * 
 * Renders a circular button in the bottom-right corner of the screen.
 * Fully responsive with mobile-first design:
 * - Small size (48px) on mobile devices
 * - Medium size (56px) on tablets
 * - Large size (60px) on desktops
 * 
 * Design System Compliance:
 * - Uses Accent Red (bg-red-500) from our color palette
 * - Implements smooth transitions and hover effects
 * - Shadow elevation for depth (shadow-lg → hover:shadow-xl)
 * - Adaptive sizing across all breakpoints
 */
export function FloatingChatButton() {
    const [isOpen, setIsOpen] = useState(false)

    const toggleChat = () => {
        setIsOpen((prev) => !prev)
    }

    return (
        <>
            {/* Floating Action Button - Mobile First Responsive */}
            <button
                onClick={toggleChat}
                className="fixed z-50 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg transition-all duration-300 
                    bottom-4 right-4 h-12 w-12
                    sm:bottom-5 sm:right-5 sm:h-14 sm:w-14
                    md:bottom-6 md:right-6 md:h-[3.75rem] md:w-[3.75rem]
                    hover:scale-110 hover:shadow-xl 
                    active:scale-95
                    focus:outline-none focus:ring-4 focus:ring-red-500/50
                    flex items-center justify-center"
                aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
            >
                {isOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                ) : (
                    <BotMessageSquare className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                )}
            </button>

            {/* Chatbot Container */}
            {isOpen && <Chatbot onClose={() => setIsOpen(false)} />}
        </>
    )
}
