"use client"

import { useEffect } from "react"
import { getFirebaseApp } from "@/lib/firebase/client"
import { getFirestoreClient } from "@/lib/firebase/firestore-client"

/**
 * Providers Component
 * 
 * Initializes Firebase and Firestore with proper error handling
 * Suppresses expected offline errors
 */
export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize Firebase app
        const app = getFirebaseApp()

        if (app) {
            // Initialize Firestore with offline persistence
            try {
                getFirestoreClient()
            } catch (error) {
                // Suppress expected initialization errors
                // Firestore will work when online
            }
        }
    }, [])

    return <>{children}</>
}
