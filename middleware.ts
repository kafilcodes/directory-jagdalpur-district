import { NextResponse, type NextRequest } from "next/server"

// Publicly accessible paths for unauthenticated users
const PUBLIC_PATHS: Array<RegExp> = [
  /^\/$/,
  /^\/browse(?:\/.*)?$/,
  /^\/search(?:\/.*)?$/,
  /^\/about(?:\/.*)?$/,
  /^\/listing(?:\/.*)?$/,
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((re) => re.test(pathname))
}

function isAssetOrSystemPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/bg.png") ||
    pathname.startsWith("/api/") // allow API routes
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isAssetOrSystemPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Simple gate: if no session cookie, redirect to home
  const hasSession = !!req.cookies.get("session")?.value
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

