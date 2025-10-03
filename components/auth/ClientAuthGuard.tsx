"use client"

import { useEffect, useState } from "react"
import { onAuthChange } from "@/lib/firebase/authService"
import { AuthRedirectPopup } from "./AuthRedirectPopup"

interface ClientAuthGuardProps {
    children: React.ReactNode
    redirectTo?: string
    showPopup?: boolean
}

/**
 * Client-side auth protection component
 * Provides fallback for SPA navigation when middleware doesn't catch routes
 * Shows redirect popup when user is not authenticated
 */
export function ClientAuthGuard({
    children,
    redirectTo = "/",
    showPopup = true,
}: ClientAuthGuardProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [showRedirectPopup, setShowRedirectPopup] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setIsAuthenticated(true)
                setShowRedirectPopup(false)
            } else {
                setIsAuthenticated(false)
                if (showPopup) {
                    setShowRedirectPopup(true)
                } else {
                    // Redirect immediately without popup
                    window.location.href = redirectTo
                }
            }
        })

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [redirectTo, showPopup])

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
        )
    }

    // Not authenticated - show popup
    if (!isAuthenticated && showRedirectPopup) {
        return <AuthRedirectPopup redirectTo={redirectTo} />
    }

    // Authenticated - show protected content
    return <>{children}</>
}
