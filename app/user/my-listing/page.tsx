import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { safeQuery } from "@/lib/firebase/errorHandling"
import { getCategoryLabel } from "@/config/directory"
import { AlertCircle, MapPin, Globe, Phone, Mail, ExternalLink, Edit } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

/**
 * Get user's listing with error handling
 */
async function getUserListing(userUid: string) {
    const db = getAdminDb()

    const result = await safeQuery(
        async () => {
            const snap = await db
                .collection("listings")
                .where("ownerUid", "==", userUid)
                .limit(1)
                .get()

            if (snap.empty) return null

            return {
                id: snap.docs[0].id,
                ...(snap.docs[0].data() as any),
            }
        },
        "Get user listing",
        "listings"
    )

    return result
}

export default async function UserMyListingPage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Please sign in to view your listing.</p>
            </div>
        )
    }

    const listingResult = await getUserListing(user.uid)

    // Handle errors
    if (!listingResult.success) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Listing</h1>
                    <p className="text-gray-600 mt-1">View and manage your business listing</p>
                </div>

                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900">
                                    Error loading listing data
                                </p>
                                <p className="text-yellow-700 mt-1">{listingResult.error}</p>
                                {listingResult.missing && (
                                    <p className="text-yellow-700 mt-2">
                                        Missing collections: {listingResult.missing.join(", ")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const listing = listingResult.data

    // No listing found
    if (!listing) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Listing</h1>
                    <p className="text-gray-600 mt-1">View and manage your business listing</p>
                </div>

                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No listing found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            You haven't created a business listing yet. Get started now!
                        </p>
                        <Link href={"/user/create-listing" as any}>
                            <Button className="bg-red-600 hover:bg-red-700">
                                Create Your Listing
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Display listing
    const address = listing.address || {}
    const googleData = listing.googleData || {}
    const monetization = listing.monetization || {}

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Listing</h1>
                    <p className="text-gray-600 mt-1">View and manage your business listing</p>
                </div>
                <Link href={`/listing/${listing.id}` as any}>
                    <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public Page
                    </Button>
                </Link>
            </div>

            {/* Status Badge */}
            <div>
                <Badge
                    variant={listing.isPublic ? "default" : "secondary"}
                    className={listing.isPublic ? "bg-green-600" : ""}
                >
                    {listing.isPublic ? "Public" : "Draft"}
                </Badge>
                {monetization.planId && monetization.planId !== "free" && (
                    <Badge className="ml-2 bg-yellow-500">
                        {monetization.planId === "featured" ? "Featured" : "Sponsored"}
                    </Badge>
                )}
            </div>

            {/* Business Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle>{listing.businessName || "Untitled Listing"}</CardTitle>
                        <Button variant="ghost" size="sm" disabled>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Category */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Category</h3>
                        <p className="text-sm text-gray-900">
                            {getCategoryLabel(listing.categorySlug) || listing.categorySlug}
                        </p>
                    </div>

                    {/* Address */}
                    {address.formattedAddress && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Address
                            </h3>
                            <p className="text-sm text-gray-900">{address.formattedAddress}</p>
                        </div>
                    )}

                    {/* Contact Info */}
                    {googleData.phoneNumber && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone
                            </h3>
                            <p className="text-sm text-gray-900">{googleData.phoneNumber}</p>
                        </div>
                    )}

                    {googleData.website && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Website
                            </h3>
                            <a
                                href={googleData.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                                {googleData.website}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Monetization Info */}
            {monetization.planId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-sm font-medium">Plan:</span>{" "}
                            <span className="text-sm text-gray-700 capitalize">
                                {monetization.planId}
                            </span>
                        </div>
                        {monetization.expiresAt && (
                            <div>
                                <span className="text-sm font-medium">Expires:</span>{" "}
                                <span className="text-sm text-gray-700">
                                    {new Date(monetization.expiresAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Link href={"/user/dashboard" as any}>
                        <Button variant="outline" className="w-full justify-start">
                            View Analytics Dashboard
                        </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start" disabled>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Listing (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
