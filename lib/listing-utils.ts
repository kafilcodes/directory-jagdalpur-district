/**
 * Business Listing Utilities
 * Handles offline caching, address validation, and image management
 * Uses environment variables for city-specific configuration
 */

const CACHE_KEY_PREFIX = 'listing_draft_';
const CACHE_EXPIRY_DAYS = 7;

// City configuration from environment variables
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || 'Dhamtari';
const CITY_PIN_CODE = process.env.NEXT_PUBLIC_CITY_PIN_CODE || '493773';
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || 'Chhattisgarh';
const STATE_CODE = process.env.NEXT_PUBLIC_STATE_CODE || 'CG';

export interface CachedPlaceData {
    placeDetails: any;
    images: Array<{
        photoName: string;
        url: string | null; // null if failed to download
        width?: number;
        height?: number;
    }>;
    timestamp: number;
    expiresAt: number;
}

/**
 * Validates if address is within the configured city district with state fallback
 * Primary: Checks for city name or PIN code from environment variables
 * Fallback: Allows state if city not found
 * @deprecated Use for backward compatibility - property names kept as isDhamtari/isChhattisgarh
 */
export function validateDhamtariAddress(address: string, pinCode?: string, addressComponents?: any[]): {
    isValid: boolean;
    isDhamtari: boolean; // Actually means "is in configured city" (kept for backward compatibility)
    isChhattisgarh: boolean; // Actually means "is in configured state" (kept for backward compatibility)
    reason?: string;
} {
    const addressLower = address.toLowerCase();
    const cityNameLower = CITY_NAME.toLowerCase();
    const stateNameLower = STATE_NAME.toLowerCase();
    const stateCodeLower = STATE_CODE.toLowerCase();

    // PRIMARY CHECK: City name
    const hasCityInAddress = addressLower.includes(cityNameLower);

    // PRIMARY CHECK: PIN code
    const hasPincode = addressLower.includes(CITY_PIN_CODE) || pinCode === CITY_PIN_CODE;

    // Check address components for city name
    let hasCityInComponents = false;
    if (addressComponents && Array.isArray(addressComponents)) {
        hasCityInComponents = addressComponents.some((comp: any) => {
            if (!comp.longName && !comp.shortName) return false;
            const longName = (comp.longName || '').toLowerCase();
            const shortName = (comp.shortName || '').toLowerCase();
            return longName.includes(cityNameLower) || shortName.includes(cityNameLower);
        });
    }

    const isDhamtari = hasCityInAddress || hasPincode || hasCityInComponents;

    // FALLBACK CHECK: State name
    const hasStateInAddress = addressLower.includes(stateNameLower);
    let hasStateInComponents = false;
    if (addressComponents && Array.isArray(addressComponents)) {
        hasStateInComponents = addressComponents.some((comp: any) => {
            if (!comp.longName && !comp.shortName) return false;
            const longName = (comp.longName || '').toLowerCase();
            const shortName = (comp.shortName || '').toLowerCase();
            const types = comp.types || [];
            const isStateComponent = types.includes('administrative_area_level_1');
            return isStateComponent && (longName.includes(stateNameLower) || shortName === stateCodeLower);
        });
    }

    const isChhattisgarh = hasStateInAddress || hasStateInComponents;

    // Determine validity and reason
    if (isDhamtari) {
        return { isValid: true, isDhamtari: true, isChhattisgarh: true };
    }

    if (isChhattisgarh) {
        return {
            isValid: false,
            isDhamtari: false,
            isChhattisgarh: true,
            reason: `This business is in ${STATE_NAME} but outside ${CITY_NAME} district. Only ${CITY_NAME} businesses (PIN: ${CITY_PIN_CODE}) are allowed.`
        };
    }

    return {
        isValid: false,
        isDhamtari: false,
        isChhattisgarh: false,
        reason: `Only ${CITY_NAME} businesses (PIN: ${CITY_PIN_CODE}) are allowed. If you believe this is in ${CITY_NAME}, verify the place address or try a different location.`
    };
}

/**
 * COMMERCIAL PLACE TYPE WHITELIST
 * Only these business types are allowed for listing creation
 * Excludes: parks, monuments, transit, residential, generic landmarks
 */
export const ALLOWED_BUSINESS_TYPES = [
    // Food & Dining
    'restaurant', 'cafe', 'bakery', 'bar', 'meal_delivery', 'meal_takeaway',
    'food', 'coffee_shop', 'fast_food_restaurant', 'ice_cream_shop',

    // Retail & Shopping
    'store', 'shopping_mall', 'supermarket', 'convenience_store', 'clothing_store',
    'electronics_store', 'furniture_store', 'hardware_store', 'jewelry_store',
    'shoe_store', 'book_store', 'department_store', 'home_goods_store',
    'liquor_store', 'pet_store', 'florist', 'gift_shop', 'toy_store',
    'sporting_goods_store', 'bicycle_store',

    // Healthcare & Wellness
    'hospital', 'doctor', 'dentist', 'pharmacy', 'physiotherapist',
    'veterinary_care', 'medical_lab', 'health', 'dental_clinic',
    'beauty_salon', 'hair_care', 'spa', 'gym', 'fitness_center',

    // Professional Services
    'lawyer', 'accounting', 'real_estate_agency', 'insurance_agency',
    'travel_agency', 'car_rental', 'moving_company', 'storage',
    'laundry', 'dry_cleaning', 'tailor', 'locksmith', 'plumber',
    'electrician', 'roofing_contractor', 'painter',

    // Automotive
    'car_dealer', 'car_repair', 'car_wash', 'gas_station', 'parking',
    'auto_parts_store', 'tire_shop',

    // Lodging & Hospitality
    'lodging', 'hotel', 'motel', 'resort_hotel', 'guest_house',
    'bed_and_breakfast', 'campground', 'rv_park',

    // Education & Childcare
    'school', 'primary_school', 'secondary_school', 'university',
    'library', 'preschool', 'child_care', 'driving_school', 'tutoring',

    // Finance
    'bank', 'atm', 'finance', 'money_exchange',

    // Entertainment & Recreation
    'movie_theater', 'night_club', 'bowling_alley', 'amusement_park',
    'aquarium', 'art_gallery', 'museum', 'zoo', 'stadium',
    'casino', 'event_venue',

    // Other Commercial
    'post_office', 'courier_service', 'telecommunication_service',
    'place_of_worship', 'funeral_home', 'cemetery',
    'community_center', 'convention_center', 'wedding_venue',
];

/**
 * NON-BUSINESS TYPES TO EXCLUDE
 * Only block public places, monuments, landmarks, transit, and geographic entities
 * Allow all businesses and service establishments
 */
export const BLOCKED_PLACE_TYPES = [
    // Public Places & Landmarks (NOT businesses)
    'tourist_attraction', 'park', 'natural_feature', 'landmark',
    'monument', 'garden', 'playground', 'picnic_ground',

    // Transit & Transportation (NOT businesses)
    'bus_station', 'train_station', 'transit_station', 'light_rail_station',
    'subway_station', 'airport', 'bus_stop', 'transit_depot',

    // Public Facilities (NOT businesses)
    'public_bathroom', 'rest_area', 'toilet',

    // Geographic Entities (NOT physical locations)
    'political', 'locality', 'administrative_area', 'sublocality',
    'route', 'street_address', 'intersection', 'colloquial_area',
    'neighborhood', 'country', 'postal_code', 'postal_town',
    'archipelago', 'continent', 'geocode', 'plus_code',

    // Building Components (NOT standalone businesses)
    'premise', 'subpremise', 'floor', 'room', 'street_number',
    'parking', 'town_square',
];

/**
 * Validates if place is a commercial business
 * PERMISSIVE APPROACH: Allow all businesses/services by default
 * Only block: monuments, parks, public toilets, transit, geographic entities
 */
export function isBusinessType(types: string[]): {
    isCommercial: boolean;
    reason?: string;
    matchedTypes?: string[];
} {
    if (!types || !Array.isArray(types) || types.length === 0) {
        return {
            isCommercial: false,
            reason: 'No place type information available'
        };
    }

    // Check for blocked types
    const blockedTypesFound = types.filter(t => BLOCKED_PLACE_TYPES.includes(t));

    // Generic types that need additional context
    const genericTypes = ['establishment', 'point_of_interest'];
    const nonGenericTypes = types.filter(t => !genericTypes.includes(t) && !BLOCKED_PLACE_TYPES.includes(t));

    // CASE 1: Only generic types (establishment, point_of_interest) - Too vague
    if (types.every(t => genericTypes.includes(t))) {
        return {
            isCommercial: false,
            reason: 'Location type too generic — please select a specific business with more details'
        };
    }

    // CASE 2: Contains ONLY blocked types (no business types at all)
    // Example: ['park', 'tourist_attraction'] or ['bus_station', 'transit_station']
    if (blockedTypesFound.length > 0 && nonGenericTypes.length === 0) {
        return {
            isCommercial: false,
            reason: `This is a ${blockedTypesFound[0].replace(/_/g, ' ')} — only businesses and services can be listed`
        };
    }

    // CASE 3: Has at least one non-generic, non-blocked type = It's a business!
    // Examples: 
    // - ['sporting_goods_store', 'store', 'establishment'] ✅ 
    // - ['restaurant', 'food', 'point_of_interest'] ✅
    // - ['shop', 'establishment'] ✅
    if (nonGenericTypes.length > 0) {
        return {
            isCommercial: true,
            matchedTypes: nonGenericTypes
        };
    }

    // Default: Allow if we're not sure (permissive approach)
    return {
        isCommercial: true,
        matchedTypes: types
    };
}

/**
 * Cache place data with images to localStorage
 */
export async function cachePlaceData(
    placeId: string,
    placeDetails: any,
    photoNames: string[],
    onProgress?: (percent: number, current: number, total: number) => void
): Promise<CachedPlaceData> {
    const images: CachedPlaceData['images'] = [];
    const maxImages = Math.min(photoNames.length, 20); // Cap at 20 images

    // Download images with progress
    for (let i = 0; i < maxImages; i++) {
        const photoName = photoNames[i];

        try {
            // Fetch image through our proxy
            const response = await fetch(
                `/api/google-places/photo?name=${encodeURIComponent(photoName)}&maxWidth=400&maxHeight=300`
            );

            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();

                const dataUrl = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                images.push({
                    photoName,
                    url: dataUrl,
                });
            } else {
                // Mark as failed but continue
                images.push({
                    photoName,
                    url: null,
                });
            }
        } catch (error) {
            console.error(`Failed to cache image ${i + 1}:`, error);
            images.push({
                photoName,
                url: null,
            });
        }

        // Report progress
        const percent = Math.round(((i + 1) / maxImages) * 100);
        onProgress?.(percent, i + 1, maxImages);
    }

    const now = Date.now();
    const cachedData: CachedPlaceData = {
        placeDetails,
        images,
        timestamp: now,
        expiresAt: now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };

    try {
        localStorage.setItem(
            `${CACHE_KEY_PREFIX}${placeId}`,
            JSON.stringify(cachedData)
        );
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        // Try IndexedDB fallback if needed
    }

    return cachedData;
}

/**
 * Retrieve cached place data
 */
export function getCachedPlaceData(placeId: string): CachedPlaceData | null {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${placeId}`);
        if (!cached) return null;

        const data: CachedPlaceData = JSON.parse(cached);

        // Check expiry
        if (Date.now() > data.expiresAt) {
            localStorage.removeItem(`${CACHE_KEY_PREFIX}${placeId}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to retrieve cached data:', error);
        return null;
    }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '');
                    if (data.expiresAt && now > data.expiresAt) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    // Invalid data, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.error('Failed to clear expired cache:', error);
    }
}
