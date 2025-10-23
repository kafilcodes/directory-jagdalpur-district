import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { Toaster } from "sonner"
import LayoutWrapper from "@/components/layout/LayoutWrapper"
import { Providers } from "./providers"
import "@/lib/utils/suppress-dev-errors" // Suppress expected dev errors
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

// Dynamic metadata from environment variables
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  `Discover trusted local businesses, services, and professionals in ${CITY_NAME}. Your comprehensive directory for hotels, restaurants, healthcare, education, shopping, and more.`;
const SITE_KEYWORDS = process.env.NEXT_PUBLIC_SITE_KEYWORDS ||
  `${APP_NAME},${CITY_NAME} directory,${CITY_NAME} businesses,local businesses ${CITY_NAME}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} - Find Local Businesses & Services in ${CITY_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS.split(',').map(k => k.trim()),
  authors: [{ name: `${APP_NAME} Team` }],
  creator: APP_NAME,
  publisher: process.env.NEXT_PUBLIC_COPYRIGHT_HOLDER || APP_NAME,
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
    title: `${APP_NAME} - Find Local Businesses & Services`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: APP_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Local Business Directory`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Find Local Businesses & Services`,
    description: `Discover trusted local businesses, services, and professionals in ${CITY_NAME} district.`,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <Providers>
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
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
