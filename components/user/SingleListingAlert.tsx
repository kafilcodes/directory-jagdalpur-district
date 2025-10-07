"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface SingleListingAlertProps {
    listingId?: string
    businessName?: string
}

export function SingleListingAlert({ listingId, businessName }: SingleListingAlertProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Create Listing
                </h1>
                <p className="text-gray-600 mt-1">Add your business to the directory</p>
            </div>

            {/* Simple Alert Card */}
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
                                href="/user/my-listing"
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