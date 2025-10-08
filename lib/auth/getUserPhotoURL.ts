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
 * Fetch user photoURL from Firestore with per-request caching
 * 
 * @param uid - User's Firebase Auth UID
 * @param fallbackPhotoURL - Fallback photoURL from Firebase Auth
 * @returns Promise<string | null> - User's photoURL or null
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
            return userData?.photoURL || fallbackPhotoURL || null
        }

        // Document doesn't exist, use fallback
        return fallbackPhotoURL || null
    } catch (error) {
        console.error("Error fetching user photoURL:", error)

        // Return fallback on error (graceful degradation)
        return fallbackPhotoURL || null
    }
})
