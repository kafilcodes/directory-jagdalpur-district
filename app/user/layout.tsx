import type { ReactNode } from "react"
import { LayoutUser } from "@/components/user/LayoutUser"
import { ClientAuthGuard } from "@/components/auth/ClientAuthGuard"

/**
 * User area layout
 * All /user/* routes use this layout with:
 * - Custom sidebar navigation (no public header/footer)
 * - Client-side auth protection
 * - Mobile-responsive drawer
 */
export default function UserLayout({ children }: { children: ReactNode }) {
    return (
        <ClientAuthGuard showPopup={true} redirectTo="/">
            <LayoutUser>{children}</LayoutUser>
        </ClientAuthGuard>
    )
}
