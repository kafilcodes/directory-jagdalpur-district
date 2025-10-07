"use client"

import { useState } from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface RobustImageProps extends Omit<ImageProps, 'src' | 'alt'> {
    src: string
    alt: string
    fallbackSrc?: string
    showPlaceholder?: boolean
}

/**
 * Robust image component with error handling for various formats (JPG/PNG/WebP)
 * Handles Firebase Storage URLs and provides fallback mechanisms
 */
export default function RobustImage({
    src,
    alt,
    fallbackSrc,
    showPlaceholder = true,
    className,
    ...props
}: RobustImageProps) {
    const [error, setError] = useState(false)
    const [currentSrc, setCurrentSrc] = useState(src)

    const handleError = () => {
        if (!error && fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc)
            setError(false)
        } else {
            setError(true)
        }
    }

    // If error and no fallback, show placeholder
    if (error && showPlaceholder) {
        return (
            <div className={cn("bg-gray-200 flex items-center justify-center", className)}>
                <div className="text-gray-400 text-center p-4">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">{alt}</span>
                </div>
            </div>
        )
    }

    // Determine if we should use unoptimized flag for Firebase Storage
    const isFirebaseStorage = currentSrc?.includes('firebasestorage.app') || currentSrc?.includes('googleapis.com')

    return (
        <Image
            {...props}
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
            unoptimized={isFirebaseStorage}
        />
    )
}
