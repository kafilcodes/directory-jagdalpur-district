import { getCurrentUser } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Calendar, Shield, Briefcase } from "lucide-react"
import { PaymentReceipts } from "@/components/user/PaymentReceipts"

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

    // Extract username from email (part before @)
    const username = user.email?.split('@')[0] || "User"

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
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="relative shrink-0">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    className="h-16 w-16 rounded-full object-cover ring-2 ring-red-100"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-xl shadow-sm">
                                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">
                                {user.displayName || username}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Briefcase className="h-4 w-4" />
                                <span>Business Account</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {user.emailVerified && (
                                    <Badge className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-xs">
                                        <Shield className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-gray-100 rounded">
                                <Mail className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500">Email Address</p>
                                <p className="text-sm text-gray-900 truncate">{user.email || "Not provided"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-gray-100 rounded">
                                <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">Member Since</p>
                                <p className="text-sm text-gray-900">{createdDate}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-gray-100 rounded">
                                <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500">User ID</p>
                                <p className="text-xs text-gray-600 font-mono truncate">{user.uid}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-gray-100 rounded">
                                <Shield className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">Account Status</p>
                                <p className="text-sm text-gray-900">Active</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Receipts Section */}
            <PaymentReceipts userEmail={user.email || ""} />
        </div>
    )
}
