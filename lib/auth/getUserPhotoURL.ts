/**
 * getUserPhotoURL - Server-side utility
 * 
 * Fetches photoURL from Firestore with server-side caching
 * Used in server components (app/user/profile/page.tsx, etc.)
 * 
 * Architecture:
 * - Uses Next.js cache() for automatic deduplication per request
 * - Falls back to Firebase Auth photoURL if Firestore fails
 * - Graceful error handling for missing collections
 * 
 * Usage:
 * ```tsx
 * const photoURL = await getUserPhotoURL(user.uid, user.photoURL)
 * ```
 */

import { getAdminDb } from "@/lib/firebase/admin"
import { cache } from "react"

/**
 * Helper to proxy external image URLs through our API
 * Fixes CORS issues with Google, Facebook, GitHub avatars
 */
function proxyExternalPhoto(photoURL: string | null): string | null {
    if (!photoURL) return null

    // Proxy external images through our API to avoid CORS
    if (photoURL.includes('googleusercontent.com') ||
        photoURL.includes('graph.facebook.com') ||
        photoURL.includes('avatars.githubusercontent.com')) {
        return `/api/proxy-image?url=${encodeURIComponent(photoURL)}`
    }

    return photoURL
}

/**
 * Fetch user photoURL from Firestore with per-request caching
 * Automatically proxies external images to avoid CORS issues
 * 
 * @param uid - User's Firebase Auth UID
 * @param fallbackPhotoURL - Fallback photoURL from Firebase Auth
 * @returns Promise<string | null> - User's photoURL (proxied if external) or null
 */
export const getUserPhotoURL = cache(async (
    uid: string,
    fallbackPhotoURL?: string | null
): Promise<string | null> => {
    try {
        const db = getAdminDb()
        const userDoc = await db.collection("users").doc(uid).get()

        if (userDoc.exists) {
            const userData = userDoc.data()
            const photoURL = userData?.photoURL || fallbackPhotoURL || null
            return proxyExternalPhoto(photoURL)
        }

        // Document doesn't exist, use fallback
        return proxyExternalPhoto(fallbackPhotoURL || null)
    } catch (error) {
        console.error("Error fetching user photoURL:", error)

        // Return proxied fallback on error (graceful degradation)
        return proxyExternalPhoto(fallbackPhotoURL || null)
    }
})
