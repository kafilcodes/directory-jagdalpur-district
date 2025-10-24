/**
 * Network Status Provider
 * 
 * Monitors online/offline status and shows toast notifications.
 * Automatically detects when user goes offline or comes back online.
 * 
 * Usage in app/layout.tsx:
 * ```tsx
 * import { NetworkStatusProvider } from '@/components/providers/NetworkStatusProvider'
 * 
 * <NetworkStatusProvider>
 *   {children}
 * </NetworkStatusProvider>
 * ```
 */

'use client'

import { useEffect } from 'react'
import { toastOffline, toastSuccess } from '@/lib/toastUtils'

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Track if we've already shown offline toast to avoid duplicates
        let offlineToastShown = false

        const handleOnline = () => {
            if (offlineToastShown) {
                toastSuccess('Back online', 'Your internet connection has been restored')
                offlineToastShown = false
            }
        }

        const handleOffline = () => {
            if (!offlineToastShown) {
                toastOffline()
                offlineToastShown = true
            }
        }

        // Listen to online/offline events
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check initial status
        if (!navigator.onLine) {
            handleOffline()
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return <>{children}</>
}

/**
 * Hook to check if user is online
 */
export function useNetworkStatus() {
    if (typeof window === 'undefined') {
        return true // SSR always returns true
    }
    return navigator.onLine
}
