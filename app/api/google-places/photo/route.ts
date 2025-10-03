import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_GOOGLE_PLACES_API_KEY;

export async function GET(req: NextRequest) {
    try {
        if (!GOOGLE_PLACES_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Google Places API key not configured' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);
        const photoName = searchParams.get('name');
        const maxWidth = searchParams.get('maxWidth') || '1200';
        const maxHeight = searchParams.get('maxHeight') || '800';

        if (!photoName) {
            return NextResponse.json(
                { success: false, error: 'Photo name is required' },
                { status: 400 }
            );
        }

        // Construct photo URL for Google Places API (New)
        const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_PLACES_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;

        // Fetch the photo
        const response = await fetch(photoUrl);

        if (!response.ok) {
            console.error('Google Places Photo API Error:', response.statusText);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch photo' },
                { status: response.status }
            );
        }

        // Get the image as a buffer
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Return the image directly
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Photo API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
