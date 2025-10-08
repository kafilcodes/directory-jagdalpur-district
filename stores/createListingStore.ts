/**
 * Zustand Store for Create Listing Flow
 * Manages state persistence across all steps: Business, Media, Plan, Review
 * Follows Database Modeling.md schema and clean architecture principles
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PlaceDetails {
    id: string
    placeId?: string
    name: string
    address: string
    formattedAddress?: string
    location: { lat: number; lng: number }
    types: string[]
    primaryType?: string
    phone?: string
    website?: string
    rating?: number
    userRatingCount?: number
    googleMapsUri?: string
    businessStatus?: string
    photos?: Array<{ name: string; widthPx?: number; heightPx?: number }>
    reviews?: Array<{
        authorName: string
        authorPhoto: string
        rating: number
        relativeTime: string
        time: string
        text: string
    }>
    openingHours?: string[]
    currentOpeningHours?: string[]
    regularOpeningHours?: {
        weekdayDescriptions?: string[]
        openNow?: boolean
    }
    editorialSummary?: string
    addressComponents?: Array<{
        longName: string
        shortName: string
        types: string[]
    }>
}

export interface BusinessSuggestion {
    placeId: string
    name: string
    address: string
    description: string
    types: string[]
    photoName?: string
}

export interface UploadedImage {
    id: string
    file: File
    localUrl: string
    uploadedUrl?: string // Firebase Storage URL after upload
    size: number
    type: string
    uploadProgress?: number
}

export type PlanId = 'free' | 'sponsored' | 'featured'

export type ListingStatus = 'draft' | 'media_uploaded' | 'payment_pending' | 'payment_completed' | 'created'

interface CreateListingState {
    // Step 1: Business Details
    selectedBusiness: BusinessSuggestion | null
    selectedPlace: PlaceDetails | null
    termsAccepted: boolean

    // Step 2: Media Upload
    uploadedImages: UploadedImage[]
    imagesStoredInFirebase: boolean
    primaryImageId: string | null

    // Step 3: Plan Selection
    selectedPlan: PlanId
    lockedPlan: PlanId | null
    paymentCompleted: boolean
    paymentId: string | null
    orderId: string | null

    // Status tracking
    currentStep: number
    status: ListingStatus

    // Actions - Business Details
    setSelectedBusiness: (business: BusinessSuggestion | null) => void
    setSelectedPlace: (place: PlaceDetails | null) => void
    setTermsAccepted: (accepted: boolean) => void

    // Actions - Media Upload
    addImage: (image: UploadedImage) => void
    removeImage: (imageId: string) => void
    updateImageProgress: (imageId: string, progress: number) => void
    updateImageUrl: (imageId: string, url: string) => void
    restoreImageFile: (imageId: string, restoredFile: File) => void
    clearImages: () => void
    setImagesStoredInFirebase: (stored: boolean) => void
    setPrimaryImageId: (imageId: string | null) => void

    // Actions - Plan Selection
    setSelectedPlan: (plan: PlanId) => void
    setLockedPlan: (plan: PlanId | null) => void
    setPaymentCompleted: (completed: boolean, paymentId?: string, orderId?: string) => void

    // Actions - Navigation
    setCurrentStep: (step: number) => void
    setStatus: (status: ListingStatus) => void
    nextStep: () => void
    previousStep: () => void

    // Actions - Reset
    reset: () => void
    softReset: () => void // Keeps payment info but resets to allow new listing
}

const initialState = {
    // Business Details
    selectedBusiness: null,
    selectedPlace: null,
    termsAccepted: false,

    // Media Upload
    uploadedImages: [],
    imagesStoredInFirebase: false,
    primaryImageId: null,

    // Plan Selection
    selectedPlan: 'free' as PlanId,
    lockedPlan: null,
    paymentCompleted: false,
    paymentId: null,
    orderId: null,

    // Status
    currentStep: 1,
    status: 'draft' as ListingStatus,
}

export const useCreateListingStore = create<CreateListingState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Business Details Actions
            setSelectedBusiness: (business) => set({ selectedBusiness: business }),
            setSelectedPlace: (place) => set({ selectedPlace: place }),
            setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

            // Media Upload Actions
            addImage: (image) => set((state) => {
                // Enforce 20 image maximum
                if (state.uploadedImages.length >= 20) {
                    return state
                }
                return { uploadedImages: [...state.uploadedImages, image] }
            }),

            removeImage: (imageId) => set((state) => ({
                uploadedImages: state.uploadedImages.filter(img => img.id !== imageId)
            })),

            updateImageProgress: (imageId, progress) => set((state) => ({
                uploadedImages: state.uploadedImages.map(img =>
                    img.id === imageId ? { ...img, uploadProgress: progress } : img
                )
            })),

            updateImageUrl: (imageId, url) => set((state) => ({
                uploadedImages: state.uploadedImages.map(img =>
                    img.id === imageId ? { ...img, uploadedUrl: url } : img
                )
            })),

            // Restore image File object (used after logout/login when File is lost from localStorage)
            restoreImageFile: (imageId, restoredFile) => set((state) => ({
                uploadedImages: state.uploadedImages.map(img =>
                    img.id === imageId ? { ...img, file: restoredFile } : img
                )
            })),

            clearImages: () => set({ uploadedImages: [], imagesStoredInFirebase: false, primaryImageId: null }),

            setImagesStoredInFirebase: (stored) => set({ imagesStoredInFirebase: stored }),

            setPrimaryImageId: (imageId) => set({ primaryImageId: imageId }),

            // Plan Selection Actions
            setSelectedPlan: (plan) => {
                const state = get()
                // Prevent plan changes if already locked
                if (state.lockedPlan && state.paymentCompleted) {
                    return
                }
                set({ selectedPlan: plan })
            },

            setLockedPlan: (plan) => set({ lockedPlan: plan }),

            setPaymentCompleted: (completed, paymentId, orderId) => set((state) => ({
                paymentCompleted: completed,
                paymentId: paymentId || state.paymentId,
                orderId: orderId || state.orderId,
                lockedPlan: completed ? state.selectedPlan : state.lockedPlan,
                status: completed ? 'payment_completed' : state.status,
            })),

            // Navigation Actions
            setCurrentStep: (step) => set({ currentStep: step }),

            setStatus: (status) => set({ status }),

            nextStep: () => set((state) => ({
                currentStep: Math.min(state.currentStep + 1, 4)
            })),

            previousStep: () => set((state) => {
                // Prevent going back from review if payment completed
                if (state.currentStep === 4 && state.paymentCompleted) {
                    return state
                }
                return {
                    currentStep: Math.max(state.currentStep - 1, 1)
                }
            }),

            // Reset Actions
            reset: () => set(initialState),

            softReset: () => set((state) => ({
                ...initialState,
                // Keep these for analytics/tracking
                paymentId: state.paymentId,
                orderId: state.orderId,
            })),
        }),
        {
            name: 'create-listing-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),
            // Don't persist File objects (not serializable)
            partialize: (state) => ({
                selectedBusiness: state.selectedBusiness,
                selectedPlace: state.selectedPlace,
                termsAccepted: state.termsAccepted,
                // Store image metadata but not File objects
                uploadedImages: state.uploadedImages.map(img => ({
                    id: img.id,
                    localUrl: img.localUrl,
                    uploadedUrl: img.uploadedUrl,
                    size: img.size,
                    type: img.type,
                    uploadProgress: img.uploadProgress,
                    // Exclude file object
                })),
                imagesStoredInFirebase: state.imagesStoredInFirebase,
                primaryImageId: state.primaryImageId,
                selectedPlan: state.selectedPlan,
                lockedPlan: state.lockedPlan,
                paymentCompleted: state.paymentCompleted,
                paymentId: state.paymentId,
                orderId: state.orderId,
                currentStep: state.currentStep,
                status: state.status,
            }),
        }
    )
)
