import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve shortened Google Maps URLs to get the full URL with Place ID
 */
export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url || !url.trim()) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        console.log('Resolving URL:', url);

        // Follow redirects to get the final URL and fetch full HTML
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const finalUrl = response.url;
        console.log('Final URL after redirects:', finalUrl);

        // Try to extract Place ID from the final URL first
        let placeId = extractPlaceIdFromUrl(finalUrl);

        // If not found in URL, try to extract from HTML content
        if (!placeId) {
            const html = await response.text();
            placeId = extractPlaceIdFromHtml(html);
        }

        if (!placeId) {
            console.log('Failed to extract Place ID from both URL and HTML');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Could not extract Place ID. Please use the full Google Maps URL from your business listing.',
                    finalUrl
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            placeId,
            finalUrl,
        });
    } catch (error) {
        console.error('Resolve URL Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to resolve URL'
            },
            { status: 500 }
        );
    }
}

/**
 * Extract Place ID from HTML content
 */
function extractPlaceIdFromHtml(html: string): string | null {
    try {
        console.log('Extracting Place ID from HTML content');

        // Look for ChIJ format in the HTML
        const chijPatterns = [
            /"ludocid":"(ChIJ[a-zA-Z0-9_-]+)"/i,
            /data-place-id="(ChIJ[a-zA-Z0-9_-]+)"/i,
            /"placeid":"(ChIJ[a-zA-Z0-9_-]+)"/i,
            /ChIJ[a-zA-Z0-9_-]{20,}/g, // Generic ChIJ search
        ];

        for (const pattern of chijPatterns) {
            const match = html.match(pattern);
            if (match) {
                const placeId = match[1] || match[0];
                // Clean the placeId if it was captured from generic pattern
                const cleanId = placeId.replace(/[^a-zA-Z0-9_-]/g, '');
                if (cleanId.startsWith('ChIJ') && cleanId.length >= 24) {
                    console.log('Extracted ChIJ from HTML:', cleanId);
                    return `places/${cleanId}`;
                }
            }
        }

        // Look for ludocid (numeric CID) in HTML
        const cidMatch = html.match(/"ludocid":"(\d+)"/i);
        if (cidMatch) {
            console.log('Found ludocid in HTML:', cidMatch[1]);
            // Try to find corresponding ChIJ nearby in the HTML
            const contextStart = Math.max(0, html.indexOf(cidMatch[0]) - 1000);
            const contextEnd = Math.min(html.length, html.indexOf(cidMatch[0]) + 1000);
            const context = html.slice(contextStart, contextEnd);

            const contextChij = context.match(/ChIJ[a-zA-Z0-9_-]{20,}/);
            if (contextChij) {
                console.log('Found ChIJ near ludocid:', contextChij[0]);
                return `places/${contextChij[0]}`;
            }
        }

        console.log('No Place ID found in HTML');
        return null;
    } catch (error) {
        console.error('Error extracting Place ID from HTML:', error);
        return null;
    }
}

/**
 * Extract Place ID from Google Maps URL
 */
function extractPlaceIdFromUrl(url: string): string | null {
    try {
        console.log('Extracting Place ID from URL:', url);

        // Priority 1: Look for ChIJ format first (most reliable)
        const chijPatterns = [
            /!1s(ChIJ[a-zA-Z0-9_-]+)/i, // Direct ChIJ in URL params
            /\/place\/[^/]+\/@[^/]+\/data=.*!1s(ChIJ[a-zA-Z0-9_-]+)/i, // Deep link format
            /cid=(ChIJ[a-zA-Z0-9_-]+)/i, // CID with ChIJ
            /places\/(ChIJ[a-zA-Z0-9_-]+)/i, // Direct places/ prefix
        ];

        for (const pattern of chijPatterns) {
            const match = url.match(pattern);
            if (match) {
                const placeId = `places/${match[1]}`;
                console.log('Extracted ChIJ Place ID:', placeId);
                return placeId;
            }
        }

        // Priority 2: Look for numeric CID format
        const cidMatch = url.match(/cid=(\d+)/i);
        if (cidMatch) {
            console.log('Extracted CID:', cidMatch[1]);
            // Note: CID format might need conversion, but let's try it
            return cidMatch[1];
        }

        // Priority 3: Extract from ftid parameter
        const ftidMatch = url.match(/ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
        if (ftidMatch) {
            console.log('Found ftid format:', ftidMatch[1]);
            // This format is not directly usable, need to find ChIJ in the full URL
        }

        // Try to parse the URL and look for the place ID in different parts
        try {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;

            // Check all query parameters for ChIJ
            for (const [key, value] of params.entries()) {
                if (value.includes('ChIJ')) {
                    const chijMatch = value.match(/(ChIJ[a-zA-Z0-9_-]+)/);
                    if (chijMatch) {
                        const placeId = `places/${chijMatch[1]}`;
                        console.log('Found ChIJ in query params:', placeId);
                        return placeId;
                    }
                }
            }
        } catch (e) {
            // URL parsing failed, continue with other methods
        }

        console.log('Could not extract valid Place ID from URL');
        return null;
    } catch (error) {
        console.error('Error extracting Place ID:', error);
        return null;
    }
}
