import { getCurrentUser } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Calendar, Shield, FileText, Download, CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UserProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <User className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Please sign in to view your profile</p>
            </div>
        )
    }

    const createdDate = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "Unknown"

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
                    <p className="text-gray-600 mt-1">Manage your account and settings</p>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-red-500 to-red-600" />
                <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 pb-6">
                        <div className="relative">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                                />
                            ) : (
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center ring-4 ring-white shadow-lg">
                                    <User className="h-12 w-12 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {user.displayName || "Business Owner"}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="gap-1">
                                    <Shield className="h-3 w-3" />
                                    Business Owner
                                </Badge>
                                {user.emailVerified && (
                                    <Badge className="gap-1 bg-green-500">
                                        <Shield className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <Mail className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="text-sm text-gray-900 truncate">{user.email || "Not provided"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Member Since</p>
                                <p className="text-sm text-gray-900">{createdDate}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500">User ID</p>
                                <p className="text-xs text-gray-600 font-mono truncate">{user.uid}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Account Status</p>
                                <p className="text-sm text-gray-900">Active</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Receipts Section */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <CardTitle className="text-lg">Payment Receipts</CardTitle>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Download invoices for your transactions</p>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">No receipts yet</p>
                        <p className="text-xs text-gray-500 mt-1">Your payment receipts will appear here</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
