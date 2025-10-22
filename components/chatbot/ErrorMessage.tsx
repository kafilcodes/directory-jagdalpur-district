"use client"

interface ErrorMessageProps {
    message?: string
    onRetry?: () => void
}

/**
 * Error Message Component for Chatbot
 * 100% Tailwind CSS - No vanilla CSS
 */
export function ErrorMessage({
    message = "Something went wrong. Please try again.",
    onRetry
}: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center p-4 max-w-[90%] mx-auto">
            {/* Error Icon - Inline SVG */}
            <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>

            {/* Error Message */}
            <p className="text-sm text-gray-600 text-center mb-3">
                {message}
            </p>

            {/* Retry Button */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                    Try Again
                </button>
            )}
        </div>
    )
}
