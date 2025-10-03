/**
 * Firestore Error Handling Utilities
 * Gracefully handles missing collections and documents
 * Per architecture: log errors, don't crash, provide empty states
 */

export interface FirestoreError {
    code?: number | string
    message?: string
    details?: string
}

export interface SafeQueryResult<T> {
    success: boolean
    data?: T
    error?: string
    errorCode?: string
    missing?: string[] // List of missing collections/documents
}

/**
 * Check if error is a NOT_FOUND (code 5) error
 */
export function isNotFoundError(error: any): boolean {
    return (
        error?.code === 5 ||
        error?.code === "not-found" ||
        /NOT_FOUND|not.found|doesn't exist|does not exist/i.test(
            String(error?.message || "")
        )
    )
}

/**
 * Check if error is a PERMISSION_DENIED error
 */
export function isPermissionDeniedError(error: any): boolean {
    return (
        error?.code === 7 ||
        error?.code === "permission-denied" ||
        /PERMISSION.DENIED|permission.denied|Missing or insufficient permissions/i.test(
            String(error?.message || "")
        )
    )
}

/**
 * Log Firestore error with context
 * Production-safe: only logs in development
 */
export function logFirestoreError(
    context: string,
    error: any,
    collectionHint?: string
) {
    if (process.env.NODE_ENV !== "development") return

    console.group(`[Firestore Error] ${context}`)
    console.error("Error:", error)

    if (isNotFoundError(error)) {
        console.warn(
            `❌ Collection/Document not found${collectionHint ? `: ${collectionHint}` : ""}`
        )
        console.info("ℹ️ This collection may need to be created in Firestore")
    } else if (isPermissionDeniedError(error)) {
        console.warn("❌ Permission denied - check Firestore security rules")
    }

    console.groupEnd()
}

/**
 * Wrap Firestore query with error handling
 * Returns SafeQueryResult with data or error
 */
export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    context: string,
    collectionHint?: string
): Promise<SafeQueryResult<T>> {
    try {
        const data = await queryFn()
        return { success: true, data }
    } catch (error: any) {
        logFirestoreError(context, error, collectionHint)

        if (isNotFoundError(error)) {
            return {
                success: false,
                error: "Data not found",
                errorCode: "not-found",
                missing: collectionHint ? [collectionHint] : undefined,
            }
        }

        if (isPermissionDeniedError(error)) {
            return {
                success: false,
                error: "Permission denied",
                errorCode: "permission-denied",
            }
        }

        return {
            success: false,
            error: "An error occurred while fetching data",
            errorCode: "unknown",
        }
    }
}

/**
 * Get required Firestore collections for user area
 * Used in documentation and error messages
 */
export function getRequiredCollections(): string[] {
    return [
        "users",
        "listings",
        "listingStats",
        "listingEvents",
        "search",
    ]
}

/**
 * Format missing collections message for user
 */
export function formatMissingCollectionsMessage(
    missing: string[]
): string {
    return `Missing Firestore collections: ${missing.join(", ")}. Please create these collections in your Firebase Console.`
}
