/**
 * Toast Utility - Reusable Sonner Toast Wrappers
 * 
 * Provides consistent, accessible toast notifications across the app.
 * Uses sonner library with standardized styling matching design tokens.
 * 
 * Usage:
 * ```tsx
 * import { toastError, toastOffline, toastRateLimit } from '@/lib/toastUtils'
 * 
 * // Network error
 * toastError('Failed to load data', 'Check your connection and try again')
 * 
 * // Offline detection
 * toastOffline()
 * 
 * // Rate limit reached
 * toastRateLimit('chatbot')
 * ```
 */

import { toast } from 'sonner'

/**
 * General error toast with red styling
 */
export function toastError(title: string, description?: string) {
    return toast.error(title, {
        description,
        duration: 5000,
        classNames: {
            toast: 'bg-red-50 border-red-200',
            title: 'text-red-900 font-medium',
            description: 'text-red-700'
        }
    })
}

/**
 * Network/offline toast
 */
export function toastOffline() {
    return toast.error('🌐 No internet connection', {
        description: 'Please check your network and try again',
        duration: 6000,
        classNames: {
            toast: 'bg-red-50 border-red-200',
            title: 'text-red-900 font-medium',
            description: 'text-red-700'
        }
    })
}

/**
 * Auth/session error toast with actionable guidance
 */
export function toastAuthError() {
    return toast.error('⚠️ Session expired or invalid', {
        description: 'Please clear site data (Settings → Clear browsing data) and log in again',
        duration: 8000,
        classNames: {
            toast: 'bg-red-50 border-red-200',
            title: 'text-red-900 font-medium',
            description: 'text-red-700'
        },
        action: {
            label: 'Help',
            onClick: () => {
                // Show instructions in console
                console.log(`
[Auth Help]
1. Open browser settings
2. Go to Privacy & Security → Clear browsing data
3. Select "Cookies and site data" and "Cached images and files"
4. Click Clear data
5. Return to the site and log in again
                `.trim())
                toast.info('Instructions printed to console (F12)')
            }
        }
    })
}

/**
 * Rate limit reached toast
 */
export function toastRateLimit(service: 'chatbot' | 'search' | 'general') {
    const serviceNames = {
        chatbot: 'AI Chatbot',
        search: 'Search',
        general: 'This service'
    }

    return toast.warning(`⏱️ ${serviceNames[service]} request limit reached`, {
        description: 'You\'ve made too many requests. Please wait a moment and try again.',
        duration: 7000,
        classNames: {
            toast: 'bg-amber-50 border-amber-200',
            title: 'text-amber-900 font-medium',
            description: 'text-amber-700'
        }
    })
}

/**
 * Success toast (green)
 */
export function toastSuccess(title: string, description?: string) {
    return toast.success(title, {
        description,
        duration: 4000,
    })
}

/**
 * Info toast (blue)
 */
export function toastInfo(title: string, description?: string) {
    return toast.info(title, {
        description,
        duration: 4000,
    })
}
