import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_GOOGLE_PLACES_API_KEY;

// Dhamtari district boundaries (approximate)
const DHAMTARI_BOUNDS = {
    minLat: 20.9,
    maxLat: 21.9,
    minLng: 81.0,
    maxLng: 82.2,
};

export async function POST(req: NextRequest) {
    try {
        if (!GOOGLE_PLACES_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Google Places API key not configured' },
                { status: 500 }
            );
        }

        const { placeId } = await req.json();

        if (!placeId) {
            return NextResponse.json(
                { success: false, error: 'Place ID is required' },
                { status: 400 }
            );
        }

        // Fetch place details from Google Places API (New)
        const response = await fetch(
            `https://places.googleapis.com/v1/${placeId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask':
                        'id,displayName,formattedAddress,location,types,' +
                        'internationalPhoneNumber,nationalPhoneNumber,websiteUri,' +
                        'rating,userRatingCount,googleMapsUri,businessStatus,' +
                        'photos,regularOpeningHours,currentOpeningHours,primaryType,' +
                        'addressComponents,plusCode,viewport,editorialSummary',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Google Places Details API Error:', errorData);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch place details' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Validate location is within Dhamtari district
        const lat = data.location?.latitude;
        const lng = data.location?.longitude;
        const address = data.formattedAddress || '';
        const addressComponents = data.addressComponents || [];

        console.log('Validating location:', {
            lat,
            lng,
            address,
            addressComponents: addressComponents.map((c: any) => ({
                types: c.types,
                shortName: c.shortName,
                longName: c.longName
            }))
        });

        // Method 1: Check if "Dhamtari" is in the address (most reliable for Indian addresses)
        const hasDhamtariInAddress = address.toLowerCase().includes('dhamtari') ||
            address.toLowerCase().includes('493773'); // Pin code

        // Method 2: Check address components for district
        const hasDhamtariInComponents = addressComponents.some((component: any) => {
            const longName = component.longName?.toLowerCase() || '';
            const shortName = component.shortName?.toLowerCase() || '';
            const types = component.types || [];

            // Check if it's an administrative area or locality containing Dhamtari
            const isAdministrative = types.includes('administrative_area_level_3') ||
                types.includes('locality') ||
                types.includes('sublocality') ||
                types.includes('political');

            return isAdministrative && (longName.includes('dhamtari') || shortName.includes('dhamtari'));
        });

        // Method 3: Coordinate bounds check (fallback)
        const isInBounds = lat && lng &&
            lat >= DHAMTARI_BOUNDS.minLat &&
            lat <= DHAMTARI_BOUNDS.maxLat &&
            lng >= DHAMTARI_BOUNDS.minLng &&
            lng <= DHAMTARI_BOUNDS.maxLng;

        // Business is valid if ANY of the checks pass
        const isValidDhamtariBusiness = hasDhamtariInAddress || hasDhamtariInComponents || isInBounds;

        console.log('Location validation result:', {
            hasDhamtariInAddress,
            hasDhamtariInComponents,
            isInBounds,
            isValidDhamtariBusiness
        });

        if (!isValidDhamtariBusiness) {
            console.log('Location restriction triggered - business outside Dhamtari');
            return NextResponse.json(
                {
                    success: false,
                    error: 'This business is outside Dhamtari district. Only businesses located in Dhamtari, Chhattisgarh (PIN: 493773) are allowed.',
                    locationRestricted: true,
                },
                { status: 400 }
            );
        }

        console.log('Location validation passed - business is in Dhamtari');

        // Extract and format place details
        const placeDetails = {
            id: data.id,
            placeId: data.id?.replace('places/', ''),
            name: data.displayName?.text || '',
            address: data.formattedAddress || '',
            location: {
                lat: lat || 0,
                lng: lng || 0,
            },
            types: data.types || [],
            primaryType: data.primaryType || '',
            phone: data.internationalPhoneNumber || data.nationalPhoneNumber || '',
            website: data.websiteUri || '',
            rating: data.rating || 0,
            userRatingCount: data.userRatingCount || 0,
            googleMapsUri: data.googleMapsUri || '',
            businessStatus: data.businessStatus || 'OPERATIONAL',
            photos: data.photos?.map((photo: any) => ({
                name: photo.name,
                widthPx: photo.widthPx,
                heightPx: photo.heightPx,
                authorAttributions: photo.authorAttributions,
            })) || [],
            openingHours: data.regularOpeningHours?.weekdayDescriptions || [],
            currentOpeningHours: data.currentOpeningHours?.weekdayDescriptions || [],
            editorialSummary: data.editorialSummary?.text || '',
            addressComponents: data.addressComponents || [],
            plusCode: data.plusCode,
            viewport: data.viewport,
        };

        return NextResponse.json({
            success: true,
            placeDetails,
        });
    } catch (error) {
        console.error('Place Details API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
