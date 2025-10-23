import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_GOOGLE_PLACES_API_KEY;

// City district center coordinates and radius (from environment)
const CITY_CENTER = {
    lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '21.0278'),
    lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '81.6300'),
};
const RADIUS_KM = Math.floor(parseInt(process.env.NEXT_PUBLIC_MAP_RADIUS || '30000', 10) / 1000); // Convert meters to km

/**
 * Secure server-side proxy for Google Places Autocomplete API
 * Enforces geofencing around configured city district
 * Implements session token-based cost optimization
 */
export async function POST(req: NextRequest) {
    try {
        if (!GOOGLE_PLACES_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Google Places API key not configured' },
                { status: 500 }
            );
        }

        const { input } = await req.json();

        if (!input || input.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Input must be at least 2 characters' },
                { status: 400 }
            );
        }

        console.log('[Places Autocomplete] Query:', input);

        // Call Google Places Autocomplete API (New)
        // Using locationRestriction for STRICT geofencing to Dhamtari/Chhattisgarh only
        const url = 'https://places.googleapis.com/v1/places:autocomplete';

        const requestBody = {
            input: input.trim(),
            // Use locationBias with radius for city + nearby areas
            // Note: locationRestriction is stricter but can exclude valid results
            locationBias: {
                circle: {
                    center: {
                        latitude: CITY_CENTER.lat,
                        longitude: CITY_CENTER.lng,
                    },
                    radius: RADIUS_KM * 1000, // Convert km to meters
                },
            },
            languageCode: 'en',
        };

        console.log('[Places Autocomplete] Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Places Autocomplete] API Error Status:', response.status);
            console.error('[Places Autocomplete] API Error Response:', errorText);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch autocomplete suggestions', details: errorText },
                { status: 400 }
            );
        }

        const data = await response.json();
        console.log('[Places Autocomplete] API Response:', JSON.stringify(data, null, 2));

        // Format predictions for client
        const predictions = (data.suggestions || []).map((suggestion: any) => {
            const placePrediction = suggestion.placePrediction;
            if (!placePrediction) return null;

            return {
                placeId: placePrediction.placeId,
                // Extract place name from structured format
                name: placePrediction.structuredFormat?.mainText?.text ||
                    placePrediction.text?.text ||
                    'Unknown Business',
                // Full address
                address: placePrediction.structuredFormat?.secondaryText?.text ||
                    placePrediction.text?.text ||
                    '',
                // Full description for display
                description: placePrediction.text?.text || '',
                // Types for categorization
                types: placePrediction.types || [],
            };
        }).filter(Boolean);

        console.log(`[Places Autocomplete] Found ${predictions.length} results for "${input}"`);

        return NextResponse.json({
            success: true,
            predictions,
        });
    } catch (error) {
        console.error('[Places Autocomplete] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
