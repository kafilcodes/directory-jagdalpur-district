import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { safeQuery } from "@/lib/firebase/errorHandling"
import { CreateListingFormNew } from "@/components/user/CreateListingFormNew"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

/**
 * Check if user already has a listing
 */
async function userHasListing(userUid: string): Promise<boolean> {
    const db = getAdminDb()

    const result = await safeQuery(
        async () => {
            const snap = await db
                .collection("listings")
                .where("ownerUid", "==", userUid)
                .limit(1)
                .get()
            return !snap.empty
        },
        "Check existing listing",
        "listings"
    )

    return result.success && result.data === true
}

export default async function UserCreateListingPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Please sign in to create a listing.</p>
            </div>
        )
    }

    // Check if user already has a listing
    const hasListing = await userHasListing(user.uid)

    if (hasListing) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create Listing
                    </h1>
                    <p className="text-gray-600 mt-1">Add your business to the directory</p>
                </div>

                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900">
                                    You already have a listing
                                </p>
                                <p className="text-yellow-700 mt-1">
                                    You can only have one listing per account. View your existing listing
                                    or contact support for multiple listings.
                                </p>
                                <Link
                                    href={"/user/my-listing" as any}
                                    className="text-yellow-900 underline font-medium mt-2 inline-block"
                                >
                                    View My Listing →
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Create Listing
                </h1>
                <p className="text-gray-600 mt-1">Add your business to the directory</p>
            </div>

            <CreateListingFormNew />
        </div>
    )
}
