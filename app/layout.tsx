import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { Toaster } from "sonner"
import LayoutWrapper from "@/components/layout/LayoutWrapper"
import { Providers } from "./providers"
import "@/lib/utils/suppress-dev-errors" // Suppress expected dev errors
import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper"
import { NetworkStatusProvider } from "@/components/providers/NetworkStatusProvider"

const inter = Inter({ subsets: ["latin"] })

// Dynamic metadata from environment variables
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  `Discover trusted local businesses, services, and professionals in ${CITY_NAME}. Your comprehensive directory for hotels, restaurants, healthcare, education, shopping, and more.`;

// Enhanced SEO keywords - comprehensive coverage for directory, local businesses, cities, services
const CHHATTISGARH_CITIES = [
  "Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Raigarh",
  "Jagdalpur", "Ambikapur", "Mahasamund", "Dhamtari", "Kanker", "Kawardha"
];

const CORE_KEYWORDS = [
  // Brand & Location
  APP_NAME,
  `Dial${CITY_NAME.replace(/\s+/g, '')}`,
  `${CITY_NAME} directory`,
  `${CITY_NAME} businesses`,
  `${CITY_NAME} business directory`,
  `local businesses ${CITY_NAME}`,
  `${CITY_NAME} local services`,

  // Services & Categories
  "business directory",
  "local directory",
  "yellow pages",
  "business listings",
  "local services",
  "service providers",
  "business finder",
  "local business search",

  // Chhattisgarh specific
  `${STATE_NAME} directory`,
  `${STATE_NAME} businesses`,
  `businesses in ${STATE_NAME}`,
  ...CHHATTISGARH_CITIES.map(city => `${city} businesses`),

  // Category keywords
  `${CITY_NAME} restaurants`,
  `${CITY_NAME} hotels`,
  `${CITY_NAME} hospitals`,
  `${CITY_NAME} schools`,
  `${CITY_NAME} shops`,
  `${CITY_NAME} services`,
  "best restaurants",
  "best hotels",
  "best businesses",
  "top rated services",
  "verified businesses",

  // Marketing & Ads
  "business advertising",
  "local advertising",
  "promote business",
  "business marketing",
  "local business ads",
  "sponsored listings",

  // India specific
  "India business directory",
  `${STATE_NAME} India`,
  `${CITY_NAME} ${STATE_NAME} India`,
  "Indian businesses",
  "local business India",

  // Travel & Tourism
  `visit ${CITY_NAME}`,
  `${CITY_NAME} travel guide`,
  `things to do in ${CITY_NAME}`,
  `${CITY_NAME} tourism`,
  "local attractions",
  "city guide"
];

const SITE_KEYWORDS = process.env.NEXT_PUBLIC_SITE_KEYWORDS || CORE_KEYWORDS.join(',');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} - Find Local Businesses & Services in ${CITY_NAME}, ${STATE_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS.split(',').map(k => k.trim()),
  authors: [{ name: `${APP_NAME} Team` }],
  creator: APP_NAME,
  publisher: process.env.NEXT_PUBLIC_COPYRIGHT_HOLDER || APP_NAME,
  category: "Business Directory",
  classification: "Business & Economy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: `${APP_NAME} - ${CITY_NAME}'s Premier Business Directory`,
    description: `Discover ${CITY_NAME}'s best restaurants, hotels, services, shopping, healthcare & more. Your trusted local business directory in ${STATE_NAME}, India.`,
    url: SITE_URL,
    siteName: APP_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - ${CITY_NAME} Local Business Directory`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Find Everything in ${CITY_NAME}`,
    description: `${CITY_NAME}'s most comprehensive business directory. Discover restaurants, hotels, services, healthcare, shopping & more in ${STATE_NAME}, India.`,
    images: ["/og-image.png"],
    creator: `@Dial${CITY_NAME.replace(/\s+/g, '')}`,
    site: `@Dial${CITY_NAME.replace(/\s+/g, '')}`,
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
    },
  },
  // Additional metadata for better SEO
  applicationName: APP_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  // Geographic metadata
  other: {
    "geo.region": `IN-${STATE_NAME === "Chhattisgarh" ? "CT" : ""}`,
    "geo.placename": CITY_NAME,
    "geo.position": process.env.NEXT_PUBLIC_CITY_COORDINATES || "",
    "ICBM": process.env.NEXT_PUBLIC_CITY_COORDINATES || "",
    "distribution": "global",
    "rating": "general",
    "target": "all",
    "audience": "all",
    "coverage": "worldwide",
    "revisit-after": "7 days",
    "language": "English, Hindi",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Essential Meta Tags */}
        <meta charSet="utf-8" />
        {/* Improved viewport for accessibility and SEO: allow pinch-zoom, safe-area, and disable shrink-to-fit */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover, shrink-to-fit=no"
        />
        {/* Explicit keywords meta for crawlers (augmenting Metadata export) */}
        <meta name="keywords" content={Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : String(metadata.keywords)} />
        {/* Meta description - CRITICAL for SEO (Lighthouse requirement) */}
        <meta name="description" content={SITE_DESCRIPTION} />

        {/* Enhanced Robots Meta */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* PWA & Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="theme-color" content="#EF4444" />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: APP_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              description: SITE_DESCRIPTION,
              address: {
                "@type": "PostalAddress",
                addressLocality: CITY_NAME,
                addressRegion: STATE_NAME,
                addressCountry: "IN"
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
                contactType: "customer service",
                email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
                availableLanguage: ["English", "Hindi"]
              },
              sameAs: [
                process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
                process.env.NEXT_PUBLIC_TWITTER_URL || "",
                process.env.NEXT_PUBLIC_INSTAGRAM_URL || ""
              ].filter(Boolean)
            })
          }}
        />

        {/* Structured Data - Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": SITE_URL,
              name: APP_NAME,
              description: SITE_DESCRIPTION,
              url: SITE_URL,
              telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
              email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
              address: {
                "@type": "PostalAddress",
                streetAddress: process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "",
                addressLocality: CITY_NAME,
                addressRegion: STATE_NAME,
                postalCode: process.env.NEXT_PUBLIC_CITY_PIN_CODE || "",
                addressCountry: "IN"
              },
              geo: process.env.NEXT_PUBLIC_CITY_COORDINATES ? {
                "@type": "GeoCoordinates",
                latitude: process.env.NEXT_PUBLIC_CITY_COORDINATES.split(',')[0],
                longitude: process.env.NEXT_PUBLIC_CITY_COORDINATES.split(',')[1]
              } : undefined,
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "500",
                bestRating: "5",
                worstRating: "1"
              },
              priceRange: "Free - ₹₹₹"
            })
          }}
        />

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [{
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL
              }]
            })
          }}
        />

        {/* WebSite structured data with potential SearchAction for improved site search snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": SITE_URL,
              "name": APP_NAME,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${SITE_URL}/?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <Providers>
          <NetworkStatusProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            {/* Falcon demo analytics placeholder: replace with your real script; disabled by default */}
            {false && (
              <script
                dangerouslySetInnerHTML={{ __html: `/* Falcon Placeholder */\n// window.falcon = window.falcon || function(){ (window.falcon.q = window.falcon.q || []).push(arguments) }\n// falcon('init', { apiKey: 'YOUR_KEY', projectId: 'YOUR_PROJECT' })\n// falcon('pageview')` }}
              />
            )}
            <Toaster
              richColors
              position="top-right"
              className="z-[100]"
              toastOptions={{
                className: "font-medium",
                duration: 4000,
              }}
            />
            <AnalyticsWrapper />
          </NetworkStatusProvider>
        </Providers>
      </body>
    </html>
  )
}
