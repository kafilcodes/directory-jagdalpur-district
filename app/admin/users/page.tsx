"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdminStore } from "@/stores/adminStore"
import {
    Search,
    Mail,
    Calendar,
    ListIcon,
    UserCircle,
    Trash2,
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"

export default function UsersPage() {
    // Use Zustand store for centralized state
    const { users, listings, loading, fetchAllData, deleteUser } = useAdminStore()

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12

    // AlertDialog for delete confirmation
    const [userToDelete, setUserToDelete] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Fetch data on mount
    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Calculate users with listings count (memoized)
    // Match by ownerUid (primary) or email (fallback)
    const usersWithListings = useMemo(() => {
        return users.map(user => ({
            ...user,
            listingsCount: listings.filter(l =>
                l.ownerUid === user.id ||
                (l.email && user.email && l.email.toLowerCase() === user.email.toLowerCase())
            ).length
        }))
    }, [users, listings])

    // Filter users based on search (memoized)
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return usersWithListings

        const query = searchQuery.toLowerCase()
        return usersWithListings.filter(user =>
            user.email?.toLowerCase().includes(query) ||
            user.displayName?.toLowerCase().includes(query) ||
            user.id.toLowerCase().includes(query)
        )
    }, [searchQuery, usersWithListings])

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return

        setIsDeleting(true)

        try {
            // Call Zustand store method (which calls Cloud Function)
            const result = await deleteUser(userToDelete.id)

            const details = result?.details
            const detailsText = details
                ? `Deleted from Auth ✓ | Deleted from Firestore ✓ | ${details.deletedListings || 0} listing(s) removed | ${details.deletedPayments || 0} payment(s) removed`
                : 'User removed from Authentication and Firestore'

            toast.success(
                `User ${userToDelete.displayName || userToDelete.email} deleted successfully`,
                { description: detailsText, duration: 6000 }
            )
        } catch (error: any) {
            console.error("Error deleting user:", error)
            toast.error(error?.message || "Failed to delete user. Please try again.")
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        const parts = name.split(" ")
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Header Skeleton */}
                <div>
                    <Skeleton className="h-6 sm:h-7 md:h-9 w-36 sm:w-40 md:w-48 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-4 sm:h-4.5 md:h-5 w-52 sm:w-60 md:w-72" />
                </div>

                {/* Search Skeleton */}
                <Card>
                    <CardContent className="pt-4 sm:pt-5 md:pt-6">
                        <Skeleton className="h-10 sm:h-10 md:h-11 w-full" />
                    </CardContent>
                </Card>

                {/* Users Grid Skeleton */}
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 sm:p-5 md:p-6">
                                <div className="flex flex-col items-center text-center">
                                    <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full mb-3 sm:mb-4" />
                                    <Skeleton className="h-5 sm:h-6 w-28 sm:w-32 mb-1.5 sm:mb-2" />
                                    <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-40 mb-2.5 sm:mb-3" />
                                    <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <Skeleton className="h-3.5 sm:h-4 w-16 sm:w-20" />
                                        <Skeleton className="h-3.5 sm:h-4 w-16 sm:w-20" />
                                    </div>
                                    <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 mb-3 sm:mb-4" />
                                    <div className="flex gap-2 w-full">
                                        <Skeleton className="h-8 sm:h-9 flex-1" />
                                        <Skeleton className="h-8 sm:h-9 flex-1" />
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-1.5 md:mt-2">
                        Manage registered users ({filteredUsers.length} total)
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-4 sm:pt-5 md:pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 sm:pl-10 h-10 sm:h-10 md:h-11 text-sm sm:text-base"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users Grid */}
            {paginatedUsers.length === 0 ? (
                <Card>
                    <CardContent className="py-8 sm:py-10 md:py-12 text-center px-4">
                        <UserCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">No users found matching your search.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedUsers.map((user) => (
                        <Card key={user.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 sm:p-5 md:p-6">
                                <div className="flex flex-col items-center text-center">
                                    {/* Avatar */}
                                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mb-3 sm:mb-4">
                                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                                        <AvatarFallback className="bg-red-100 text-red-600 text-base sm:text-lg font-semibold">
                                            {getInitials(user.displayName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Name */}
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate max-w-full px-2">
                                        {user.displayName || "Unnamed User"}
                                    </h3>

                                    {/* Email */}
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 mb-2.5 sm:mb-3 max-w-full px-2">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate max-w-[160px] sm:max-w-[200px]">{user.email}</span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm flex-wrap justify-center">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <ListIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                            <span>{user.listingsCount} listings</span>
                                        </div>
                                        {user.createdAt && (
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                                <span>
                                                    {(() => {
                                                        try {
                                                            // Handle both Firestore Timestamp and epoch number
                                                            const date = typeof user.createdAt.toDate === 'function'
                                                                ? user.createdAt.toDate()
                                                                : typeof user.createdAt === 'number'
                                                                    ? new Date(user.createdAt)
                                                                    : new Date(user.createdAt)
                                                            return date.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                        } catch (e) {
                                                            return 'N/A'
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(user.id)
                                                    toast.success("User ID copied to clipboard")
                                                }}
                                            >
                                                Copy ID
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 sm:h-9 text-xs sm:text-sm"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* User ID (small) */}
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                                    <p className="text-[10px] sm:text-xs text-gray-400 truncate" title={user.id}>
                                        ID: {user.id}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-0">
                    <p className="text-xs sm:text-sm text-gray-600 text-center xs:text-left">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
                        {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                            Previous
                        </Button>
                        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600">With Listings</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {usersWithListings.filter(u => (u.listingsCount || 0) > 0).length}
                            </p>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600">Total Listings</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {usersWithListings.reduce((sum, u) => sum + (u.listingsCount || 0), 0)}
                            </p>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600">Avg. Listings/User</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {users.length > 0
                                    ? (usersWithListings.reduce((sum, u) => sum + (u.listingsCount || 0), 0) / users.length).toFixed(1)
                                    : '0'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <div>
                                Are you sure you want to delete <strong>{userToDelete?.displayName || userToDelete?.email}</strong>?
                            </div>
                            <div className="text-red-600">
                                This will permanently delete the user from Firestore database.
                            </div>
                            {userToDelete && userToDelete.listingsCount > 0 && (
                                <div className="text-amber-600">
                                    ⚠️ This user has {userToDelete.listingsCount} listing(s). Consider handling their listings before deletion.
                                </div>
                            )}
                            <div className="text-sm text-gray-500 mt-2">
                                Note: Firebase Authentication record must be deleted separately via backend API.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? "Deleting..." : "Delete User"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
