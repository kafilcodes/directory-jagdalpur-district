"use client"

import { usePathname } from "next/navigation"
import HeaderServer from "@/components/layout/HeaderServer"
import Footer from "@/components/layout/Footer"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAdminRoute = pathname?.startsWith('/admin')

    if (isAdminRoute) {
        // Admin routes: no header/footer, just content
        return <>{children}</>
    }

    // Public routes: header + main + footer
    return (
        <>
            <HeaderServer />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </>
    )
}
