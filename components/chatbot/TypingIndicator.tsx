"use client"

/**
 * Typing Indicator Component
 * Plain text without bubble - only shown during AI thinking
 * 100% Tailwind CSS
 */
export function TypingIndicator() {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            Thinking
            <span className="inline-flex gap-0.5">
                <span
                    className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms', animationDuration: '1s' }}
                />
                <span
                    className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms', animationDuration: '1s' }}
                />
                <span
                    className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms', animationDuration: '1s' }}
                />
            </span>
        </span>
    )
}
