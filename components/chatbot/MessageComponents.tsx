"use client"

import { useEffect, useRef } from "react"

interface BotMessageProps {
    message: string
    isLoading?: boolean
}

/**
 * Bot Message Bubble Component - Pure Tailwind
 * Features: Gradient background, shimmer loading, proper text visibility
 */
export function BotMessage({ message, isLoading = false }: BotMessageProps) {
    return (
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%] shadow-md animate-fadeInUp">
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-white/20 rounded animate-shimmer"></div>
                </div>
            ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message}
                </div>
            )}
        </div>
    )
}

interface UserMessageProps {
    message: string
}

/**
 * User Message Bubble Component - Pure Tailwind
 */
export function UserMessage({ message }: UserMessageProps) {
    return (
        <div className="bg-white text-gray-800 px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] shadow-md border border-gray-200 ml-auto animate-fadeInUp">
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message}
            </div>
        </div>
    )
}

interface MessagesContainerProps {
    children: React.ReactNode
}

/**
 * Messages Container with auto-scroll - Pure Tailwind
 */
export function MessagesContainer({ children }: MessagesContainerProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }

        // Small delay to ensure content is rendered
        const timer = setTimeout(scrollToBottom, 100)
        return () => clearTimeout(timer)
    }, [children])

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3"
            style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
            }}
        >
            {children}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} className="h-0" />
        </div>
    )
}

interface InputContainerProps {
    children: React.ReactNode
}

/**
 * Input Container - Pure Tailwind
 * Fixed at bottom, above messages, proper z-index
 */
export function InputContainer({ children }: InputContainerProps) {
    return (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 shadow-lg">
            {children}
        </div>
    )
}
