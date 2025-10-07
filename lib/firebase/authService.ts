"use client"

import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
    type Auth,
} from "firebase/auth"
import { getFirebaseApp } from "./client"

let authInstance: Auth | null = null

/**
 * Get or initialize Firebase Auth instance
 * Follows singleton pattern per architecture guidelines
 */
export function getFirebaseAuth(): Auth | null {
    if (authInstance) return authInstance

    const app = getFirebaseApp()
    if (!app) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[authService] Firebase app not initialized - missing env vars")
        }
        return null
    }

    authInstance = getAuth(app)
    return authInstance
}

/**
 * Sign in with Google popup
 * Production-ready error handling with specific error cases
 */
export async function signInWithGoogle(): Promise<{
    success: boolean
    user?: User
    error?: string
    errorCode?: string
}> {
    try {
        const auth = getFirebaseAuth()
        if (!auth) {
            return {
                success: false,
                error: "Firebase authentication not initialized. Check your environment configuration.",
                errorCode: "auth/not-initialized",
            }
        }

        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({
            prompt: "select_account",
        })

        const result = await signInWithPopup(auth, provider)

        // Create server session cookie
        const idToken = await result.user.getIdToken()
        await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        })

        // Auto-store user details in Firestore users collection
        // This handles both new and existing users silently
        try {
            await fetch("/api/users/upsert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
        } catch (upsertError) {
            // Silent fail - user can still sign in even if upsert fails
            if (process.env.NODE_ENV === "development") {
                console.warn("[authService] Failed to upsert user data:", upsertError)
            }
        }

        return {
            success: true,
            user: result.user,
        }
    } catch (error: any) {
        const errorCode = error?.code || "unknown"
        const errorMessage = error?.message || "An unexpected error occurred"

        // Handle specific Firebase Auth errors
        switch (errorCode) {
            case "auth/popup-closed-by-user":
                return {
                    success: false,
                    error: "Sign-in cancelled",
                    errorCode,
                }
            case "auth/popup-blocked":
                return {
                    success: false,
                    error: "Pop-up blocked by browser. Please allow pop-ups and try again.",
                    errorCode,
                }
            case "auth/cancelled-popup-request":
                return {
                    success: false,
                    error: "Sign-in cancelled",
                    errorCode,
                }
            case "auth/network-request-failed":
                return {
                    success: false,
                    error: "Network error. Please check your connection and try again.",
                    errorCode,
                }
            default:
                if (process.env.NODE_ENV === "development") {
                    console.error("[authService] Sign-in error:", errorCode, errorMessage)
                }
                return {
                    success: false,
                    error: "Failed to sign in. Please try again.",
                    errorCode,
                }
        }
    }
}

/**
 * Sign out current user
 * Clears both Firebase auth and server session
 */
export async function signOut(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const auth = getFirebaseAuth()
        if (!auth) {
            return {
                success: false,
                error: "Firebase authentication not initialized",
            }
        }

        await firebaseSignOut(auth)

        // Clear server session cookie
        await fetch("/api/auth/session", {
            method: "DELETE",
        })

        return { success: true }
    } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
            console.error("[authService] Sign-out error:", error)
        }
        return {
            success: false,
            error: "Failed to sign out. Please try again.",
        }
    }
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthChange(
    callback: (user: User | null) => void
): (() => void) | null {
    const auth = getFirebaseAuth()
    if (!auth) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[authService] Cannot subscribe to auth changes - auth not initialized")
        }
        return null
    }

    return onAuthStateChanged(auth, callback, (error) => {
        if (process.env.NODE_ENV === "development") {
            console.error("[authService] Auth state change error:", error)
        }
    })
}

/**
 * Get current user
 * Returns User object or null
 */
export function getCurrentUser(): User | null {
    const auth = getFirebaseAuth()
    return auth?.currentUser ?? null
}

/**
 * Get current user ID token
 * Used for authenticated API requests
 */
export async function getIdToken(): Promise<string | null> {
    try {
        const user = getCurrentUser()
        if (!user) return null
        return await user.getIdToken()
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("[authService] Failed to get ID token:", error)
        }
        return null
    }
}
