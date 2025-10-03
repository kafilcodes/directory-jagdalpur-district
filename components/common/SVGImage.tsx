"use client"
import * as React from "react"
import Image from "next/image"

interface SVGImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    priority?: boolean
}

/**
 * Production-ready SVG image component
 * Handles loading states, errors, and fallbacks per architecture guidelines
 * Uses Next.js Image component for optimized delivery
 */
export function SVGImage({
    src,
    alt,
    width = 640,
    height = 480,
    className,
    priority = false
}: SVGImageProps) {
    const [error, setError] = React.useState(false)
    const [loading, setLoading] = React.useState(true)

    if (error) {
        return (
            <div
                className={className || "w-full h-auto bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded"}
                style={{ width, height, minHeight: height }}
                aria-label={`${alt} (unavailable)`}
                role="img"
            >
                <span className="text-center px-4">Image unavailable</span>
            </div>
        )
    }

    return (
        <div className={className || "w-full h-auto"} style={{ position: "relative", width, height }}>
            {loading && (
                <div
                    className="absolute inset-0 bg-gray-100 animate-pulse rounded"
                    aria-label="Loading image"
                />
            )}
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={className || "w-full h-auto"}
                onError={() => {
                    setError(true)
                    setLoading(false)
                }}
                onLoad={() => setLoading(false)}
                unoptimized
                priority={priority}
            />
        </div>
    )
}

export default SVGImage
