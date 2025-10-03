import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_GOOGLE_PLACES_API_KEY;

// Dhamtari coordinates for location restriction
const DHAMTARI_CENTER = {
    latitude: 21.4416,
    longitude: 81.5979,
};

// 50km radius to cover Dhamtari district
const DHAMTARI_RADIUS = 50000; // in meters

export async function POST(req: NextRequest) {
    try {
        if (!GOOGLE_PLACES_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Google Places API key not configured' },
                { status: 500 }
            );
        }

        const { input } = await req.json();

        if (!input || input.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Search input is required' },
                { status: 400 }
            );
        }

        // Make request to Google Places API (New) Autocomplete endpoint
        const response = await fetch(
            'https://places.googleapis.com/v1/places:autocomplete',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types',
                },
                body: JSON.stringify({
                    input: input.trim(),
                    locationRestriction: {
                        circle: {
                            center: DHAMTARI_CENTER,
                            radius: DHAMTARI_RADIUS,
                        },
                    },
                    includedPrimaryTypes: [
                        'restaurant',
                        'cafe',
                        'bakery',
                        'bar',
                        'store',
                        'shopping_mall',
                        'supermarket',
                        'clothing_store',
                        'electronics_store',
                        'furniture_store',
                        'hardware_store',
                        'home_goods_store',
                        'jewelry_store',
                        'shoe_store',
                        'sporting_goods_store',
                        'beauty_salon',
                        'hair_care',
                        'spa',
                        'gym',
                        'hospital',
                        'doctor',
                        'dentist',
                        'pharmacy',
                        'veterinary_care',
                        'school',
                        'university',
                        'primary_school',
                        'secondary_school',
                        'car_dealer',
                        'car_repair',
                        'car_wash',
                        'gas_station',
                        'parking',
                        'lodging',
                        'movie_theater',
                        'night_club',
                        'tourist_attraction',
                        'art_gallery',
                        'museum',
                        'library',
                        'bank',
                        'atm',
                        'accounting',
                        'lawyer',
                        'real_estate_agency',
                        'travel_agency',
                        'insurance_agency',
                    ],
                    languageCode: 'en',
                    regionCode: 'IN',
                    includedRegionCodes: ['in'],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Google Places API Error:', errorData);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch place suggestions' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Extract place predictions
        const suggestions = data.suggestions?.map((suggestion: any) => ({
            placeId: suggestion.placePrediction?.placeId || '',
            place: suggestion.placePrediction?.place || '',
            text: suggestion.placePrediction?.text?.text || '',
            mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
            secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
            types: suggestion.placePrediction?.types || [],
        })) || [];

        return NextResponse.json({
            success: true,
            suggestions,
        });
    } catch (error) {
        console.error('Autocomplete API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
