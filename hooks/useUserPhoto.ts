/**
 * useUserPhoto Hook
 * 
 * Consolidated photoURL fetching with shared cache across components
 * Single source of truth - eliminates duplicate Firestore reads
 * 
 * Architecture:
 * - Fetches from Firestore users collection once on mount
 * - Caches result in React state with session storage backup
 * - Provides loading state and error handling
 * - Fallback to Firebase Auth photoURL if Firestore fails
 * 
 * Usage:
 * ```tsx
 * const { photoURL, loading } = useUserPhoto(user)
 * ```
 */

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { getFirebaseApp } from "@/lib/firebase/client"
import { getFirestoreClient } from "@/lib/firebase/firestore-client"
import type { User } from "firebase/auth"

interface UseUserPhotoResult {
    photoURL: string | null
    loading: boolean
    error: Error | null
}

// In-memory cache to share across component instances
const photoURLCache = new Map<string, string | null>()

// Session storage key
const STORAGE_KEY = "user_photo_cache"

/**
 * Get cached photoURL from session storage
 */
function getCachedPhotoURL(uid: string): string | null {
    if (typeof window === "undefined") return null

    try {
        const cached = sessionStorage.getItem(STORAGE_KEY)
        if (cached) {
            const data = JSON.parse(cached)
            if (data[uid] && Date.now() - data[uid].timestamp < 3600000) { // 1 hour TTL
                return data[uid].photoURL
            }
        }
    } catch {
        // Ignore parse errors
    }

    return null
}

/**
 * Set cached photoURL in session storage
 */
function setCachedPhotoURL(uid: string, photoURL: string | null): void {
    if (typeof window === "undefined") return

    try {
        const cached = sessionStorage.getItem(STORAGE_KEY)
        const data = cached ? JSON.parse(cached) : {}
        data[uid] = {
            photoURL,
            timestamp: Date.now(),
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
        // Ignore storage errors
    }
}

/**
 * Hook to fetch and cache user photoURL
 * 
 * @param user - Firebase Auth user object (can be null)
 * @returns {UseUserPhotoResult} photoURL, loading state, and error
 */
export function useUserPhoto(user: User | null): UseUserPhotoResult {
    const [photoURL, setPhotoURL] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!user) {
            setPhotoURL(null)
            setLoading(false)
            return
        }

        // Check in-memory cache first
        if (photoURLCache.has(user.uid)) {
            setPhotoURL(photoURLCache.get(user.uid) || null)
            setLoading(false)
            return
        }

        // Check session storage cache
        const cachedURL = getCachedPhotoURL(user.uid)
        if (cachedURL !== null) {
            setPhotoURL(cachedURL)
            photoURLCache.set(user.uid, cachedURL)
            setLoading(false)
            return
        }

        // Fetch from Firestore
        const fetchPhotoURL = async () => {
            try {
                setLoading(true)
                const db = getFirestoreClient()

                if (!db) {
                    // Firestore not available, fallback to Firebase Auth photoURL
                    const fallbackURL = user.photoURL || null
                    setPhotoURL(fallbackURL)
                    photoURLCache.set(user.uid, fallbackURL)
                    setCachedPhotoURL(user.uid, fallbackURL)
                    setLoading(false)
                    return
                }

                const userDocRef = doc(db, "users", user.uid)
                const userDocSnap = await getDoc(userDocRef)

                let resolvedURL: string | null = null

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data()
                    resolvedURL = userData?.photoURL || user.photoURL || null
                } else {
                    // Document doesn't exist, use Auth photoURL
                    resolvedURL = user.photoURL || null
                }

                // Update all caches
                setPhotoURL(resolvedURL)
                photoURLCache.set(user.uid, resolvedURL)
                setCachedPhotoURL(user.uid, resolvedURL)
                setLoading(false)
            } catch (err) {
                // Check if error is due to offline status
                const isOfflineError = err instanceof Error &&
                    (err.message.includes("client is offline") ||
                        err.message.includes("Failed to get document"))

                // Only log non-offline errors (offline is expected behavior)
                if (!isOfflineError) {
                    console.error("Error fetching user photo:", err)
                }

                // Fallback to Firebase Auth photoURL on error
                const fallbackURL = user.photoURL || null
                setPhotoURL(fallbackURL)
                photoURLCache.set(user.uid, fallbackURL)
                setCachedPhotoURL(user.uid, fallbackURL)

                // Don't set error state for offline errors (they're expected)
                if (!isOfflineError) {
                    setError(err instanceof Error ? err : new Error("Failed to fetch photo"))
                }

                setLoading(false)
            }
        }

        fetchPhotoURL()
    }, [user])

    return { photoURL, loading, error }
}

/**
 * Clear photoURL cache (useful after profile updates)
 */
export function clearPhotoURLCache(uid?: string): void {
    if (uid) {
        photoURLCache.delete(uid)
        if (typeof window !== "undefined") {
            try {
                const cached = sessionStorage.getItem(STORAGE_KEY)
                if (cached) {
                    const data = JSON.parse(cached)
                    delete data[uid]
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
                }
            } catch {
                // Ignore errors
            }
        }
    } else {
        // Clear all caches
        photoURLCache.clear()
        if (typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(STORAGE_KEY)
            } catch {
                // Ignore errors
            }
        }
    }
}
