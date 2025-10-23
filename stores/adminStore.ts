/**
 * Zustand Store for Admin Panel
 * Manages centralized state for dashboard, analytics, listings, and users
 * Implements caching and shared data fetching to minimize Firestore reads
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getFirebaseApp } from '@/lib/firebase/client'
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

// Types
export interface Listing {
    id: string
    name?: string
    title?: string
    businessName?: string
    description?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    photos?: string[]
    status: 'active' | 'pending' | 'draft'
    plan: 'free' | 'sponsored' | 'featured'
    categorySlug?: string
    categories?: string[]
    createdAt?: any
    updatedAt?: any
    userId?: string
    ownerUid?: string // Primary field for listing owner
    views?: number
    clicks?: number
    impressions?: number
    [key: string]: any
}

export interface User {
    id: string
    email?: string
    displayName?: string
    photoURL?: string
    createdAt?: any
    updatedAt?: any
    listingsCount?: number
    [key: string]: any
}

export interface Payment {
    id: string
    amount: number
    createdAt: number
    listingId: string
    orderId: string
    paymentId: string
    plan: 'free' | 'sponsored' | 'featured'
    status: 'completed' | 'pending' | 'failed'
    updatedAt: number
    userEmail: string
    userId: string
}

export interface ListingEvent {
    id: string
    listingId: string
    type: 'view' | 'click'
    ts: number
    meta?: { path?: string }
}

interface CachedData {
    listings: Listing[]
    users: User[]
    payments: Payment[]
    listingEvents: Map<string, ListingEvent[]> // listingId -> events
    lastFetch: number | null
}

interface AdminState extends CachedData {
    // Loading states
    loading: boolean
    error: string | null

    // Cache settings
    cacheTTL: number // milliseconds (default: 5 minutes)

    // Computed stats (memoized)
    stats: {
        totalListings: number
        activeListings: number
        totalUsers: number
        totalRevenue: number
        sponsoredListings: number
        featuredListings: number
        freeListings: number
    } | null

    // Actions - Data Fetching
    fetchAllData: () => Promise<void>
    refreshData: () => Promise<void>
    isCacheValid: () => boolean

    // Actions - Listings
    updateListing: (listingId: string, updates: Partial<Listing>) => Promise<void>
    deleteListing: (listingId: string) => Promise<void>

    // Actions - Users
    deleteUser: (userId: string) => Promise<{ success: boolean; message: string; details?: any }>

    // Actions - Events
    fetchListingEvents: (listingId: string) => Promise<ListingEvent[]>

    // Actions - State Management
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearCache: () => void

    // Computed Getters
    getListingById: (id: string) => Listing | undefined
    getUserById: (id: string) => User | undefined
    getListingsByPlan: (plan: 'free' | 'sponsored' | 'featured') => Listing[]
    getListingsByStatus: (status: 'active' | 'pending' | 'draft') => Listing[]
}

const initialState: CachedData & { loading: boolean; error: string | null; cacheTTL: number; stats: null } = {
    listings: [],
    users: [],
    payments: [],
    listingEvents: new Map(),
    lastFetch: null,
    loading: false,
    error: null,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    stats: null,
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Check if cache is still valid
            isCacheValid: () => {
                const { lastFetch, cacheTTL } = get()
                if (!lastFetch) return false
                return Date.now() - lastFetch < cacheTTL
            },

            // Fetch all admin data (with caching)
            fetchAllData: async () => {
                const state = get()

                // Return cached data if valid
                if (state.isCacheValid() && state.listings.length > 0) {
                    console.log('🎯 Admin data: Using cached data')
                    return
                }

                console.log('🔄 Admin data: Fetching fresh data...')
                set({ loading: true, error: null })

                try {
                    const app = getFirebaseApp()
                    if (!app) {
                        throw new Error('Firebase app not initialized')
                    }

                    const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
                    if (!dbId) {
                        throw new Error('NEXT_PUBLIC_FIREBASE_DATABASE_ID is not configured')
                    }

                    const db = getFirestore(app, dbId)

                    // Fetch all collections in parallel
                    const [listingsSnap, usersSnap, paymentsSnap] = await Promise.all([
                        getDocs(collection(db, 'listings')),
                        getDocs(collection(db, 'users')),
                        getDocs(collection(db, 'listings_payments')),
                    ])

                    const listings: Listing[] = listingsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Listing))

                    const users: User[] = usersSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as User))

                    const payments: Payment[] = paymentsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Payment))

                    // Calculate stats
                    const totalListings = listings.length
                    const activeListings = listings.filter(l => l.status === 'active').length
                    const sponsoredListings = listings.filter(l => l.plan === 'sponsored').length
                    const featuredListings = listings.filter(l => l.plan === 'featured').length
                    const freeListings = totalListings - sponsoredListings - featuredListings
                    // Use exact amount from DB - no conversion or formatting
                    const totalRevenue = payments
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + (p.amount || 0), 0)

                    const stats = {
                        totalListings,
                        activeListings,
                        totalUsers: users.length,
                        totalRevenue,
                        sponsoredListings,
                        featuredListings,
                        freeListings,
                    }

                    console.log('✅ Admin data fetched:', {
                        listings: listings.length,
                        users: users.length,
                        payments: payments.length,
                    })

                    set({
                        listings,
                        users,
                        payments,
                        stats,
                        lastFetch: Date.now(),
                        loading: false,
                        error: null,
                    })
                } catch (error: any) {
                    console.error('❌ Error fetching admin data:', error)
                    set({
                        error: error.message || 'Failed to fetch admin data',
                        loading: false,
                    })
                }
            },

            // Force refresh (bypass cache)
            refreshData: async () => {
                set({ lastFetch: null })
                await get().fetchAllData()
            },

            // Fetch events for specific listing
            fetchListingEvents: async (listingId: string) => {
                const state = get()

                // Return cached if available
                if (state.listingEvents.has(listingId)) {
                    return state.listingEvents.get(listingId)!
                }

                try {
                    const app = getFirebaseApp()
                    if (!app) return []

                    const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
                    if (!dbId) {
                        console.error('NEXT_PUBLIC_FIREBASE_DATABASE_ID is not configured')
                        return []
                    }

                    const db = getFirestore(app, dbId)
                    const eventsRef = collection(db, `listingEvents/${listingId}/events`)
                    const eventsSnap = await getDocs(eventsRef)

                    const events: ListingEvent[] = eventsSnap.docs.map(doc => ({
                        id: doc.id,
                        listingId,
                        ...doc.data()
                    } as ListingEvent))

                    // Cache the events
                    const newMap = new Map(state.listingEvents)
                    newMap.set(listingId, events)
                    set({ listingEvents: newMap })

                    return events
                } catch (error) {
                    console.error(`Error fetching events for listing ${listingId}:`, error)
                    return []
                }
            },

            // Update listing
            updateListing: async (listingId: string, updates: Partial<Listing>) => {
                try {
                    const app = getFirebaseApp()
                    if (!app) throw new Error('Firebase not initialized')

                    const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
                    if (!dbId) throw new Error('NEXT_PUBLIC_FIREBASE_DATABASE_ID is not configured')

                    const db = getFirestore(app, dbId)
                    await updateDoc(doc(db, 'listings', listingId), updates)

                    // Update local state
                    set((state) => ({
                        listings: state.listings.map(l =>
                            l.id === listingId ? { ...l, ...updates } : l
                        ),
                    }))

                    console.log('✅ Listing updated:', listingId)
                } catch (error) {
                    console.error('❌ Error updating listing:', error)
                    throw error
                }
            },

            // Delete listing
            deleteListing: async (listingId: string) => {
                try {
                    const app = getFirebaseApp()
                    if (!app) throw new Error('Firebase not initialized')

                    const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
                    if (!dbId) throw new Error('NEXT_PUBLIC_FIREBASE_DATABASE_ID is not configured')

                    const db = getFirestore(app, dbId)
                    await deleteDoc(doc(db, 'listings', listingId))

                    // Update local state
                    set((state) => ({
                        listings: state.listings.filter(l => l.id !== listingId),
                    }))

                    console.log('✅ Listing deleted:', listingId)
                } catch (error) {
                    console.error('❌ Error deleting listing:', error)
                    throw error
                }
            },

            // Delete user (via Cloud Function)
            deleteUser: async (userId: string) => {
                try {
                    // Get admin password from localStorage (existing auth mechanism)
                    const adminPassword = localStorage.getItem('adminPassword')
                    if (!adminPassword) {
                        throw new Error('Admin authentication required')
                    }

                    // Call Cloud Function endpoint
                    const response = await fetch('/api/admin/delete-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Admin-Password': adminPassword,
                        },
                        body: JSON.stringify({ userId }),
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || 'Failed to delete user')
                    }

                    const result = await response.json()

                    // Update local state
                    set((state) => ({
                        users: state.users.filter(u => u.id !== userId),
                        listings: state.listings.filter(l => l.userId !== userId),
                    }))

                    console.log('✅ User deleted:', userId, result)
                    return result
                } catch (error) {
                    console.error('❌ Error deleting user:', error)
                    throw error
                }
            },

            // Getters
            getListingById: (id: string) => {
                return get().listings.find(l => l.id === id)
            },

            getUserById: (id: string) => {
                return get().users.find(u => u.id === id)
            },

            getListingsByPlan: (plan: 'free' | 'sponsored' | 'featured') => {
                return get().listings.filter(l => l.plan === plan)
            },

            getListingsByStatus: (status: 'active' | 'pending' | 'draft') => {
                return get().listings.filter(l => l.status === status)
            },

            // State management
            setLoading: (loading: boolean) => set({ loading }),
            setError: (error: string | null) => set({ error }),

            clearCache: () => set({
                listings: [],
                users: [],
                payments: [],
                listingEvents: new Map(),
                lastFetch: null,
                stats: null,
            }),
        }),
        {
            name: 'admin-store',
            storage: createJSONStorage(() => localStorage),
            // Only persist cache metadata, not actual data (too large)
            partialize: (state) => ({
                cacheTTL: state.cacheTTL,
                lastFetch: state.lastFetch,
            }),
        }
    )
)
