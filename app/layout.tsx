import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { Toaster } from "sonner"
import HeaderServer from "@/components/layout/HeaderServer"
import Footer from "@/components/layout/Footer"
import { Providers } from "./providers"
import "@/lib/utils/suppress-dev-errors" // Suppress expected dev errors
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Dhamtari Directory - Find Local Businesses & Services in Dhamtari",
    template: "%s | Dhamtari Directory",
  },
  description: "Discover trusted local businesses, services, and professionals in Dhamtari. Your comprehensive directory for hotels, restaurants, healthcare, education, shopping, and more. Connect with verified businesses in Dhamtari district.",
  keywords: ["Dhamtari directory", "Dhamtari businesses", "local businesses Dhamtari", "Dhamtari services", "Dhamtari restaurants", "Dhamtari hotels", "Dhamtari healthcare", "business directory Dhamtari", "Chhattisgarh businesses"],
  authors: [{ name: "Dhamtari Directory Team" }],
  creator: "Dhamtari Directory",
  publisher: "Dhamtari Directory",
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
    title: "Dhamtari Directory - Find Local Businesses & Services",
    description: "Discover trusted local businesses, services, and professionals in Dhamtari. Your comprehensive directory for hotels, restaurants, healthcare, education, shopping, and more.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    siteName: "Dhamtari Directory",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dhamtari Directory - Local Business Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhamtari Directory - Find Local Businesses & Services",
    description: "Discover trusted local businesses, services, and professionals in Dhamtari district.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
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
          <HeaderServer />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
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
