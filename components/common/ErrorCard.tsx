"use client"

import { AlertCircle, RefreshCw, X } from "lucide-react"

interface ErrorCardProps {
    title?: string
    message: string
    details?: string
    onRetry?: () => void
    onDismiss?: () => void
    className?: string
}

export function ErrorCard({
    title = "Error",
    message,
    details,
    onRetry,
    onDismiss,
    className = ""
}: ErrorCardProps) {
    return (
        <div
            className={`border border-red-500 bg-white rounded-lg p-3 ${className}`}
            role="alert"
        >
            <div className="flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{message}</p>
                    {details && (
                        <p className="text-xs text-gray-500 mt-0.5">{details}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="p-1.5 hover:bg-gray-50 rounded text-red-500 transition-colors"
                            aria-label="Retry"
                            title="Retry"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="p-1.5 hover:bg-gray-50 rounded text-gray-500 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
