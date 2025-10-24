"use client"

import dynamic from "next/dynamic"

// Lazy load analytics to reduce initial bundle and improve TBT
// These must be in a client component when using ssr: false
const SpeedInsights = dynamic(
    () => import("@vercel/speed-insights/next").then(mod => mod.SpeedInsights),
    { ssr: false }
)

const Analytics = dynamic(
    () => import("@vercel/analytics/next").then(mod => mod.Analytics),
    { ssr: false }
)

export default function AnalyticsWrapper() {
    return (
        <>
            <SpeedInsights />
            <Analytics />
        </>
    )
}
