import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { Toaster } from "sonner"
import HeaderServer from "@/components/layout/HeaderServer"
import Footer from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Dhamtari Directory",
    template: "%s | Dhamtari Directory",
  },
  description: "Find and connect with local businesses and service providers.",
  openGraph: {
    title: "Dhamtari Directory",
    description: "Find and connect with local businesses and service providers.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    siteName: "Dhamtari Directory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhamtari Directory",
    description: "Find and connect with local businesses and service providers.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
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
      </body>
    </html>
  )
}
