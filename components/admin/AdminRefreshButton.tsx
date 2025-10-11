"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AdminRefreshButtonProps {
    onRefresh: () => Promise<void>
    disabled?: boolean
    size?: "sm" | "default" | "lg" | "icon"
}

export function AdminRefreshButton({
    onRefresh,
    disabled = false,
    size = "icon"
}: AdminRefreshButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await onRefresh()
            toast.success("Data refreshed successfully")
        } catch (error) {
            console.error("Refresh error:", error)
            toast.error("Failed to refresh data")
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size={size}
            onClick={handleRefresh}
            disabled={disabled || isRefreshing}
            aria-label="Refresh data"
            className="border-0"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
    )
}
