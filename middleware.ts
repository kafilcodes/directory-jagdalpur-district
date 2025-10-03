import { NextResponse, type NextRequest } from "next/server"

/**
 * Production-ready middleware for Firebase authentication
 * Per architecture: Only business owner pages require auth
 * Public pages: Homepage, Search, Browse, About, Listing details
 * Auth-required pages: Dashboard, My Listings, Create Listing, Profile
 */

// Fully public paths accessible to all users
const PUBLIC_PATHS: RegExp[] = [
  /^\/$/,                        // Homepage
  /^\/browse(?:\/.*)?$/,         // Browse page
  /^\/search(?:\/.*)?$/,         // Search page
  /^\/about(?:\/.*)?$/,          // About page
  /^\/listing\/[^/]+$/,          // Listing detail pages
  /^\/sponsored(?:\/.*)?$/,      // Sponsored listings
]

// Paths that require authentication (business owner only)
const AUTH_REQUIRED_PATHS: RegExp[] = [
  /^\/user(?:\/.*)?$/,           // All /user/* routes require auth
  /^\/dashboard(?:\/.*)?$/,      // Legacy route (will redirect to /user/dashboard)
  /^\/my-listing(?:s)?(?:\/.*)?$/,  // Legacy route (will redirect to /user/my-listing)
  /^\/create-listing(?:\/.*)?$/,    // Legacy route (will redirect to /user/create-listing)
  /^\/profile(?:\/.*)?$/,           // Legacy route (will redirect to /user/profile)
  /^\/submit(?:\/.*)?$/,
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(pathname))
}

function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PATHS.some((re) => re.test(pathname))
}

function isAssetOrSystemPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp|css|js|woff|woff2|ttf|eot)$/i) !== null
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow assets and system paths
  if (isAssetOrSystemPath(pathname)) {
    return NextResponse.next()
  }

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check auth for protected paths
  if (requiresAuth(pathname)) {
    const sessionToken = req.cookies.get("session")?.value

    if (!sessionToken) {
      // No session - redirect to home with return URL
      const url = req.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // Has session token - allow through
    // Token verification happens server-side via Firebase Admin SDK
    return NextResponse.next()
  }

  // Default: allow through
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

