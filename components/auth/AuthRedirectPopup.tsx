"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface AuthRedirectPopupProps {
    message?: string
    countdown?: number
    redirectTo?: string
}

/**
 * Accessible popup for protected page auth redirects
 * Shows centered modal with countdown and auto-redirects to home
 * Per requirements: 3s countdown, dismissible, ARIA compliant
 */
export function AuthRedirectPopup({
    message = "This page is protected — redirecting to home…",
    countdown = 3,
    redirectTo = "/",
}: AuthRedirectPopupProps) {
    const [secondsLeft, setSecondsLeft] = useState(countdown)
    const [dismissed, setDismissed] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (dismissed) return

        // Countdown timer
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push(redirectTo as any)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [dismissed, redirectTo, router])

    // Allow ESC key to dismiss
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDismissed(true)
                router.push(redirectTo as any)
            }
        }

        window.addEventListener("keydown", handleEscape)
        return () => window.removeEventListener("keydown", handleEscape)
    }, [redirectTo, router])

    if (dismissed) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-redirect-title"
            aria-describedby="auth-redirect-description"
            onClick={() => {
                setDismissed(true)
                router.push(redirectTo as any)
            }}
        >
            <div
                className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => {
                        setDismissed(true)
                        router.push(redirectTo as any)
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close dialog and redirect"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center space-y-4">
                    <div
                        className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto"
                        aria-hidden="true"
                    >
                        <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 id="auth-redirect-title" className="text-lg font-semibold text-gray-900">
                        Authentication Required
                    </h2>

                    <p id="auth-redirect-description" className="text-sm text-gray-600">
                        {message}
                    </p>

                    <div className="text-3xl font-bold text-red-600 tabular-nums" aria-live="polite">
                        {secondsLeft}
                    </div>

                    <p className="text-xs text-gray-500">
                        Press ESC or click outside to redirect immediately
                    </p>
                </div>
            </div>
        </div>
    )
}
