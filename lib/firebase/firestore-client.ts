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
 * Supports multi-database setup via NEXT_PUBLIC_FIREBASE_DATABASE_ID
 */
export function getFirestoreClient(): Firestore | null {
    try {
        const app = getFirebaseApp()
        if (!app) return null

        // Return cached instance if already initialized
        if (firestoreInstance) {
            return firestoreInstance
        }

        // Get database ID from environment (defaults to '(default)')
        const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)'

        // Log database connection info in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔥 [Firestore Client] Connecting to database: "${databaseId}"`)
        }

        // Try to get existing Firestore instance with database ID
        try {
            firestoreInstance = getFirestore(app, databaseId)
            return firestoreInstance
        } catch {
            // If not initialized, initialize with persistence settings and database ID
            firestoreInstance = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager()
                }),
            }, databaseId) // Pass database ID as third parameter
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
