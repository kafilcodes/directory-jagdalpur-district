import { NextRequest, NextResponse } from 'next/server';
import { validateDhamtariAddress, isBusinessType } from '@/lib/listing-utils';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_GOOGLE_PLACES_API_KEY;

// City district boundaries (from environment)
const CITY_BOUNDS = {
    minLat: parseFloat(process.env.NEXT_PUBLIC_MIN_LAT || '20.9'),
    maxLat: parseFloat(process.env.NEXT_PUBLIC_MAX_LAT || '21.9'),
    minLng: parseFloat(process.env.NEXT_PUBLIC_MIN_LNG || '81.0'),
    maxLng: parseFloat(process.env.NEXT_PUBLIC_MAX_LNG || '82.2'),
};

// City name for logging (from environment)
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || 'Dhamtari';

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
        // Format: https://places.googleapis.com/v1/places/{PLACE_ID}
        const response = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}`,
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
                        'addressComponents,plusCode,viewport,editorialSummary,reviews',
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

        // Extract variables for validation
        const displayName = data.displayName?.text || '';
        const formattedAddress = data.formattedAddress || '';
        const types = data.types || [];
        const addressComponents = data.addressComponents || [];

        // Extract PIN code from address components for validation
        const pinCodeComponent = addressComponents?.find(
            (comp: any) => comp.types?.includes('postal_code')
        );
        const pinCode = pinCodeComponent?.longText;

        // Validate location using enhanced two-tier restriction
        const locationValidation = validateDhamtariAddress(
            formattedAddress || displayName || '',
            pinCode,
            addressComponents
        );

        // Validate business type with detailed reason
        const businessValidation = isBusinessType(types || []);

        console.log('🔍 Validation Results:', {
            place: displayName,
            isDhamtari: locationValidation.isDhamtari,
            isChhattisgarh: locationValidation.isChhattisgarh,
            isCommercial: businessValidation.isCommercial,
            locationValid: locationValidation.isValid,
            businessTypes: businessValidation.matchedTypes?.join(', ') || 'none',
        });

        // Block non-commercial places first (higher priority)
        if (!businessValidation.isCommercial) {
            console.log('🚫 BLOCKED: Non-commercial place type');
            console.log(`   Reason: ${businessValidation.reason}`);
            return NextResponse.json(
                {
                    error: businessValidation.reason || 'Not a commercial business',
                    locationRestricted: false,
                    commercialRestricted: true,
                    placeTypes: types,
                },
                { status: 400 }
            );
        }

        // Then check location restrictions
        if (!locationValidation.isValid) {
            const isChhattisgarhBusiness = locationValidation.isChhattisgarh;

            console.log(`🚫 BLOCKED: Business outside ${CITY_NAME} ${isChhattisgarhBusiness ? `(in ${process.env.NEXT_PUBLIC_STATE_NAME || 'state'})` : ''}`);
            console.log(`   Reason: ${locationValidation.reason}`);

            return NextResponse.json(
                {
                    error: locationValidation.reason || `Location not in ${CITY_NAME}`,
                    locationRestricted: true,
                    commercialRestricted: false,
                    isDhamtari: locationValidation.isDhamtari,
                    isChhattisgarh: isChhattisgarhBusiness,
                    address: formattedAddress,
                    pinCode: pinCode,
                },
                { status: 400 }
            );
        }

        console.log(`✅ ALLOWED: Valid ${CITY_NAME} business`);
        console.log(`   Types: ${businessValidation.matchedTypes?.join(', ')}`);
        console.log(`   Address: ${formattedAddress}`);

        // Extract and format place details
        const lat = data.location?.latitude;
        const lng = data.location?.longitude;

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
            reviews: data.reviews?.map((review: any) => ({
                authorName: review.authorAttribution?.displayName || '',
                authorPhoto: review.authorAttribution?.photoUri || '',
                rating: review.rating || 0,
                relativeTime: review.relativePublishTimeDescription || '',
                time: review.publishTime || '',
                text: review.text?.text || review.originalText?.text || '',
            })) || [],
            openingHours: data.regularOpeningHours?.weekdayDescriptions || [],
            currentOpeningHours: data.currentOpeningHours?.weekdayDescriptions || [],
            editorialSummary: data.editorialSummary?.text || '',
            addressComponents: data.addressComponents?.filter((comp: any) =>
                comp && comp.types && Array.isArray(comp.types) && comp.types.length > 0
            ).map((comp: any) => ({
                longName: comp.longName || '',
                shortName: comp.shortName || '',
                types: comp.types || []
            })) || [],
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
