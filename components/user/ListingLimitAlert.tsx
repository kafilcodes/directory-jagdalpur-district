"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ListingLimitAlertProps {
    currentCount: number
    maxAllowed: number
}

export function ListingLimitAlert({ currentCount, maxAllowed }: ListingLimitAlertProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Create Listing
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Add your business to the directory</p>
            </div>

            {/* Limit Reached Alert Card */}
            <Card className="border-red-200 bg-red-50">
                <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-red-900 text-base sm:text-lg">
                                    Listing Limit Reached
                                </p>
                                <p className="text-red-700 mt-1 text-sm sm:text-base">
                                    You have reached the maximum of <span className="font-bold">{maxAllowed}</span> listings per account.
                                </p>
                                <p className="text-red-600 mt-2 text-xs sm:text-sm">
                                    Currently using: <span className="font-medium">{currentCount}</span> of {maxAllowed} slots
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Link href="/user/my-listing" className="flex-1 sm:flex-none">
                            <Button
                                variant="default"
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Building2 className="h-4 w-4 mr-2" />
                                Manage My Listings
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/contact" className="flex-1 sm:flex-none">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-100"
                            >
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">Need more listings?</span>{" "}
                        If you need to list more than {maxAllowed} businesses, please contact our support team
                        to discuss enterprise options.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
