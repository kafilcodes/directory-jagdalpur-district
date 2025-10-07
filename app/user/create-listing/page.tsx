import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { CreateListingFormNew4Step } from "@/components/user/CreateListingFormNew4Step"
import { SingleListingAlert } from "@/components/user/SingleListingAlert"

export const dynamic = "force-dynamic"

/**
 * Check if user already has a listing and return listing details
 */
async function getUserListing(userUid: string) {
    try {
        const db = getAdminDb()
        const snap = await db
            .collection("listings")
            .where("ownerUid", "==", userUid)
            .limit(1)
            .get()

        if (snap.empty) {
            return null
        }

        const doc = snap.docs[0]
        const data = doc.data()

        return {
            id: doc.id,
            businessName: data.businessName || data.title || "Your Listing"
        }
    } catch (error) {
        // Gracefully handle missing collection
        return null
    }
}

export default async function UserCreateListingPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600 dark:text-gray-400">Please sign in to create a listing.</p>
            </div>
        )
    }

    // Check if user already has a listing
    const existingListing = await getUserListing(user.uid)

    if (existingListing) {
        return (
            <SingleListingAlert
                listingId={existingListing.id}
                businessName={existingListing.businessName}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Create Listing
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Add your business to the directory</p>
            </div>

            <CreateListingFormNew4Step />
        </div>
    )
}
