/**
 * Google Places API Helper Functions
 * For Create Listing page integration
 */

export interface PlaceSuggestion {
    placeId: string;
    place: string;
    text: string;
    mainText: string;
    secondaryText: string;
    types: string[];
}

export interface PlaceDetails {
    id: string;
    placeId: string;
    name: string;
    address: string;
    location: {
        lat: number;
        lng: number;
    };
    types: string[];
    primaryType: string;
    phone: string;
    website: string;
    rating: number;
    userRatingCount: number;
    googleMapsUri: string;
    businessStatus: string;
    photos: Array<{
        name: string;
        widthPx: number;
        heightPx: number;
        authorAttributions: any[];
    }>;
    openingHours: string[];
    currentOpeningHours: string[];
    editorialSummary: string;
    addressComponents: any[];
    plusCode: any;
    viewport: any;
}

/**
 * Fetch place suggestions from Google Places Autocomplete API
 */
export async function fetchPlaceSuggestions(
    input: string
): Promise<{ success: boolean; suggestions: PlaceSuggestion[]; error?: string }> {
    try {
        const response = await fetch('/api/google-places/autocomplete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return {
                success: false,
                suggestions: [],
                error: data.error || 'Failed to fetch suggestions',
            };
        }

        return {
            success: true,
            suggestions: data.suggestions,
        };
    } catch (error) {
        console.error('fetchPlaceSuggestions error:', error);
        return {
            success: false,
            suggestions: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch detailed information about a place
 */
export async function fetchPlaceDetails(
    placeId: string
): Promise<{
    success: boolean;
    placeDetails?: PlaceDetails;
    error?: string;
    locationRestricted?: boolean;
    errorTitle?: string;
    errorDetails?: string;
    debugInfo?: any;
}> {
    try {
        const response = await fetch('/api/google-places/details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ placeId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return {
                success: false,
                error: data.error || 'Failed to fetch place details',
                locationRestricted: data.locationRestricted || false,
                errorTitle: data.errorTitle,
                errorDetails: data.errorDetails,
                debugInfo: data.debugInfo,
            };
        }

        return {
            success: true,
            placeDetails: data.placeDetails,
        };
    } catch (error) {
        console.error('fetchPlaceDetails error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorTitle: 'Network Error',
            errorDetails: 'Failed to connect to the server',
        };
    }
}

/**
 * Get photo URL for a Google Places photo
 */
export function getPlacePhotoUrl(
    photoName: string,
    maxWidth: number = 1200,
    maxHeight: number = 800
): string {
    return `/api/google-places/photo?name=${encodeURIComponent(photoName)}&maxWidth=${maxWidth}&maxHeight=${maxHeight}`;
}

/**
 * Download and convert place photo to File object for upload
 */
export async function downloadPlacePhoto(
    photoName: string,
    fileName: string = 'photo.jpg'
): Promise<File | null> {
    try {
        const photoUrl = getPlacePhotoUrl(photoName);
        const response = await fetch(photoUrl);

        if (!response.ok) {
            console.error('Failed to download photo');
            return null;
        }

        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });
        return file;
    } catch (error) {
        console.error('downloadPlacePhoto error:', error);
        return null;
    }
}

/**
 * Extract category from Google Places types
 */
export function extractCategoryFromTypes(types: string[]): string {
    // Priority order for category mapping
    const categoryMap: Record<string, string> = {
        restaurant: 'Restaurants & Food',
        cafe: 'Restaurants & Food',
        bakery: 'Restaurants & Food',
        bar: 'Restaurants & Food',
        store: 'Shopping & Retail',
        shopping_mall: 'Shopping & Retail',
        supermarket: 'Shopping & Retail',
        clothing_store: 'Shopping & Retail',
        beauty_salon: 'Health & Beauty',
        hair_care: 'Health & Beauty',
        spa: 'Health & Beauty',
        gym: 'Health & Beauty',
        hospital: 'Healthcare',
        doctor: 'Healthcare',
        dentist: 'Healthcare',
        pharmacy: 'Healthcare',
        school: 'Education',
        university: 'Education',
        car_dealer: 'Automotive',
        car_repair: 'Automotive',
        car_wash: 'Automotive',
        gas_station: 'Automotive',
        lodging: 'Hotels & Travel',
        movie_theater: 'Entertainment',
        tourist_attraction: 'Entertainment',
        bank: 'Professional Services',
        lawyer: 'Professional Services',
        real_estate_agency: 'Professional Services',
    };

    for (const type of types) {
        if (categoryMap[type]) {
            return categoryMap[type];
        }
    }

    return 'Other';
}
