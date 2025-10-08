/**
 * Firestore Client Configuration
 * 
 * Handles Firestore initialization with proper offline settings
 * Suppresses expected offline warnings in development
 */

import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"
import { getFirebaseApp } from "./client"
import type { Firestore } from "firebase/firestore"

let firestoreInstance: Firestore | null = null

/**
 * Get Firestore instance with offline persistence
 * Initializes once and returns cached instance
 */
export function getFirestoreClient(): Firestore | null {
    try {
        const app = getFirebaseApp()
        if (!app) return null

        // Return cached instance if already initialized
        if (firestoreInstance) {
            return firestoreInstance
        }

        // Try to get existing Firestore instance
        try {
            firestoreInstance = getFirestore(app)
            return firestoreInstance
        } catch {
            // If not initialized, initialize with persistence settings
            firestoreInstance = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager()
                })
            })
            return firestoreInstance
        }
    } catch (error) {
        // Suppress expected offline errors
        const isOfflineError = error instanceof Error &&
            (error.message.includes("client is offline") ||
                error.message.includes("Failed to get document") ||
                error.message.includes("transport errored"))

        if (!isOfflineError) {
            console.error("Error initializing Firestore:", error)
        }

        return null
    }
}

/**
 * Check if Firestore is available (online)
 */
export function isFirestoreOnline(): boolean {
    return firestoreInstance !== null
}
