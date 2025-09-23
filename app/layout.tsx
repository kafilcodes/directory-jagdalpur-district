import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dhamtari Directory",
  description: "Find and connect with local businesses and service providers.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
          <a href="/" className="text-lg font-bold" aria-label="Home">Dhamtari Directory</a>
        </div>
        {children}
      </body>
    </html>
  )
}
