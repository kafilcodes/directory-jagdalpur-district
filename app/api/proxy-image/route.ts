import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API Route
 * Proxies external images (especially Google profile photos) to avoid CORS issues
 * 
 * Usage: /api/proxy-image?url=https://lh3.googleusercontent.com/...
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing url parameter' },
                { status: 400 }
            );
        }

        // Validate URL is from allowed domains (security)
        const allowedDomains = [
            'lh3.googleusercontent.com',
            'googleusercontent.com',
            'graph.facebook.com',
            'avatars.githubusercontent.com',
        ];

        try {
            const parsedUrl = new URL(imageUrl);
            const isAllowed = allowedDomains.some(domain =>
                parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
            );

            if (!isAllowed) {
                return NextResponse.json(
                    { error: 'Image URL from unauthorized domain' },
                    { status: 403 }
                );
            }
        } catch (err) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 400 }
            );
        }

        // Fetch the image
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Image-Proxy/1.0)',
                'Accept': 'image/*',
            },
            cache: 'force-cache', // Cache for 1 hour
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: 'Failed to fetch image' },
                { status: response.status }
            );
        }

        // Get image data
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine content type
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Return proxied image with proper caching headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800', // 1 day cache, 1 week stale
                'CDN-Cache-Control': 'public, max-age=86400',
                'Vercel-CDN-Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
