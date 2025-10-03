/**
 * Draft Storage Manager
 * Handles saving and loading listing drafts from LocalStorage
 */

const DRAFT_KEY = 'listing_draft';
const DRAFT_TIMESTAMP_KEY = 'listing_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Drafts expire after 7 days

export interface ListingDraft {
    // Step 1: Business Info
    businessName: string;
    placeId?: string;
    googlePlaceData?: any;

    // Step 2: Details
    category: string;
    subcategory?: string;
    description: string;
    tags: string[];

    // Step 3: Contact & Location
    phone: string;
    email?: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    location?: {
        lat: number;
        lng: number;
    };

    // Step 4: Media
    photos: string[]; // base64 or URLs
    photoFiles?: File[]; // temporary file references (not stored in localStorage)

    // Step 5: Hours & Additional Info
    openingHours?: string[];
    amenities?: string[];

    // Payment
    selectedPlan?: 'basic' | 'pro' | 'premium';
}

/**
 * Save draft to localStorage
 */
export function saveDraft(draft: Partial<ListingDraft>): boolean {
    try {
        const timestamp = Date.now();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        localStorage.setItem(DRAFT_TIMESTAMP_KEY, timestamp.toString());
        console.log('Draft saved successfully');
        return true;
    } catch (error) {
        console.error('Failed to save draft:', error);
        return false;
    }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(): Partial<ListingDraft> | null {
    try {
        const draftData = localStorage.getItem(DRAFT_KEY);
        const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

        if (!draftData || !timestamp) {
            return null;
        }

        // Check if draft has expired
        const draftAge = Date.now() - parseInt(timestamp, 10);
        const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert to milliseconds

        if (draftAge > maxAge) {
            console.log('Draft expired, clearing...');
            clearDraft();
            return null;
        }

        const draft = JSON.parse(draftData);
        console.log('Draft loaded successfully');
        return draft;
    } catch (error) {
        console.error('Failed to load draft:', error);
        return null;
    }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): boolean {
    try {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        console.log('Draft cleared successfully');
        return true;
    } catch (error) {
        console.error('Failed to clear draft:', error);
        return false;
    }
}

/**
 * Check if a draft exists
 */
export function hasDraft(): boolean {
    try {
        const draftData = localStorage.getItem(DRAFT_KEY);
        const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

        if (!draftData || !timestamp) {
            return false;
        }

        // Check if draft has expired
        const draftAge = Date.now() - parseInt(timestamp, 10);
        const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        if (draftAge > maxAge) {
            clearDraft();
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get draft age in human-readable format
 */
export function getDraftAge(): string | null {
    try {
        const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

        if (!timestamp) {
            return null;
        }

        const age = Date.now() - parseInt(timestamp, 10);
        const minutes = Math.floor(age / (1000 * 60));
        const hours = Math.floor(age / (1000 * 60 * 60));
        const days = Math.floor(age / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    } catch (error) {
        return null;
    }
}

/**
 * Auto-save functionality with debouncing
 */
let autoSaveTimeout: NodeJS.Timeout | null = null;

export function autoSaveDraft(
    draft: Partial<ListingDraft>,
    delay: number = 2000
): void {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
        saveDraft(draft);
    }, delay);
}
