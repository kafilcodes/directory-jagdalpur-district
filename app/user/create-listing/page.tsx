import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { CreateListingFormNew4Step } from "@/components/user/CreateListingFormNew4Step"
import { ListingLimitAlert } from "@/components/user/ListingLimitAlert"
import { PageLottie } from "@/components/user/PageLottie"

export const dynamic = "force-dynamic"

// Maximum listings allowed per user
const MAX_LISTINGS_PER_USER = 100

/**
 * Get user's current listing count
 */
async function getUserListingCount(userUid: string) {
    try {
        const db = getAdminDb()
        const snap = await db
            .collection("listings")
            .where("ownerUid", "==", userUid)
            .get()

        return snap.size
    } catch (error) {
        // Gracefully handle missing collection
        return 0
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

    // Check user's current listing count
    const currentListingCount = await getUserListingCount(user.uid)
    const remainingSlots = MAX_LISTINGS_PER_USER - currentListingCount
    const hasReachedLimit = currentListingCount >= MAX_LISTINGS_PER_USER

    if (hasReachedLimit) {
        return (
            <ListingLimitAlert
                currentCount={currentListingCount}
                maxAllowed={MAX_LISTINGS_PER_USER}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight ">
                    Create Listing
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Add your business to the directory
                    <span className="text-sm ml-2 text-gray-500">
                        ({remainingSlots} of {MAX_LISTINGS_PER_USER} slots remaining)
                    </span>
                </p>
            </div>

            {/* Lottie Animation */}
            <PageLottie src="/lottie/user_create_listing.json" />

            <CreateListingFormNew4Step />
        </div>
    )
}
