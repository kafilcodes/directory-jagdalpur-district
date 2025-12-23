"use client"

import dynamic from "next/dynamic"

// Lazy load Lottie for performance
const LottieAnimation = dynamic(
    () => import("@/components/common/LottieAnimation").then(mod => ({ default: mod.LottieAnimation })),
    {
        ssr: false,
        loading: () => <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 bg-gray-100 rounded-lg animate-pulse mx-auto" />
    }
)

interface PageLottieProps {
    src: string
    className?: string
}

/**
 * Reusable Page Lottie Animation Component
 * Use this in server components to add Lottie animations
 * Provides consistent responsive sizing across user pages
 */
export function PageLottie({ src, className }: PageLottieProps) {
    return (
        <div className="flex justify-center">
            <div className={className || "w-100 h-100 sm:w-30 sm:h-30 md:h-60 md:w-100"}>
                <LottieAnimation
                    src={src}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                />
            </div>
        </div>
    )
}
