"use client"

import { useRef, useEffect, useState } from "react"
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import { cn } from "@/lib/utils"

interface LottieAnimationProps {
    /** Path to the Lottie JSON file in public folder (e.g., "/lottie/animation.json") */
    src: string
    /** Whether to loop the animation */
    loop?: boolean
    /** Whether to autoplay on mount */
    autoplay?: boolean
    /** Additional CSS classes for the container */
    className?: string
    /** Width of the animation container */
    width?: number | string
    /** Height of the animation container */
    height?: number | string
    /** Animation speed (1 = normal, 2 = 2x, 0.5 = half) */
    speed?: number
    /** Custom aria-label for accessibility */
    ariaLabel?: string
    /** Whether to use IntersectionObserver for lazy loading */
    lazyLoad?: boolean
    /** Play animation only when in viewport */
    playOnVisible?: boolean
}

/**
 * Optimized Lottie Animation Component
 * - Lazy loads animation data
 * - Uses IntersectionObserver for viewport detection
 * - Supports responsive sizing
 * - Accessible with ARIA labels
 */
export function LottieAnimation({
    src,
    loop = true,
    autoplay = true,
    className,
    width,
    height,
    speed = 1,
    ariaLabel,
    lazyLoad = true,
    playOnVisible = false,
}: LottieAnimationProps) {
    const lottieRef = useRef<LottieRefCurrentProps>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [animationData, setAnimationData] = useState<object | null>(null)
    const [isVisible, setIsVisible] = useState(!lazyLoad && !playOnVisible)
    const [isLoaded, setIsLoaded] = useState(false)

    // Lazy load animation data when component is visible
    useEffect(() => {
        if (!isVisible || isLoaded) return

        const loadAnimation = async () => {
            try {
                const response = await fetch(src)
                if (!response.ok) throw new Error(`Failed to load: ${src}`)
                const data = await response.json()
                setAnimationData(data)
                setIsLoaded(true)
            } catch (error) {
                console.error("Failed to load Lottie animation:", error)
            }
        }

        loadAnimation()
    }, [src, isVisible, isLoaded])

    // IntersectionObserver for lazy loading and play on visible
    useEffect(() => {
        if (!containerRef.current || (!lazyLoad && !playOnVisible)) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                        if (playOnVisible && lottieRef.current && animationData) {
                            lottieRef.current.play()
                        }
                    } else if (playOnVisible && lottieRef.current) {
                        lottieRef.current.pause()
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: "50px",
            }
        )

        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [lazyLoad, playOnVisible, animationData])

    // Set animation speed
    useEffect(() => {
        if (lottieRef.current && speed !== 1) {
            lottieRef.current.setSpeed(speed)
        }
    }, [speed, animationData])

    // Build responsive style
    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === "number" ? `${width}px` : width
    if (height) style.height = typeof height === "number" ? `${height}px` : height

    return (
        <div
            ref={containerRef}
            className={cn("flex items-center justify-center", className)}
            style={style}
            role="img"
            aria-label={ariaLabel || "Animated illustration"}
        >
            {animationData ? (
                <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={loop}
                    autoplay={autoplay && (!playOnVisible || isVisible)}
                    className="w-full h-full"
                    rendererSettings={{
                        preserveAspectRatio: "xMidYMid slice",
                    }}
                />
            ) : (
                // Placeholder while loading
                <div
                    className="w-full h-full bg-gray-100 animate-pulse rounded-lg"
                    style={style}
                />
            )}
        </div>
    )
}

export default LottieAnimation
