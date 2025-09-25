import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { Toaster } from "sonner"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dhamtari Directory",
  description: "Find and connect with local businesses and service providers.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
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
