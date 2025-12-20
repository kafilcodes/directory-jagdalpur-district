"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowRight, TrendingUp, Users, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { onAuthChange } from "@/lib/firebase/authService"

// Lazy load LottieAnimation for performance
const LottieAnimation = dynamic(() => import("@/components/common/LottieAnimation"), {
    loading: () => <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 animate-pulse rounded-full mx-auto" />,
    ssr: false
})

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";

export default function CTASection() {
    const router = useRouter()
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [signInOpen, setSignInOpen] = useState(false)

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setIsSignedIn(!!user)
        })
        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    const handleGetStarted = () => {
        if (isSignedIn) {
            router.push("/user/create-listing")
        } else {
            // Trigger the header's sign-in popup by clicking the Add Listing button
            // Alternative: implement local sign-in popup here
            setSignInOpen(true)
            router.push("/#signin")
            // For now, scroll to top where header's Add Listing button can be clicked
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    return (
        <section className="py-16 sm:py-20 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative align-center">
                {/* Lottie Animation above title - Bigger size for section graphic */}
                <div className="mb-6 sm:mb-8">
                    <LottieAnimation
                        src="/lottie/list_your_business_today_CTA_section.json"
                        loop={true}
                        autoplay={true}
                        className="w-100 h-100 sm:w-50 sm:h-50 md:w-58 md:h-58 lg:w-96 lg:h-86 mx-auto align-center text-center"
                        ariaLabel="List your business illustration"
                        lazyLoad={true}
                    />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
                    List Your Business Today
                </h2>
                <p className="text-red-100 mb-8 sm:mb-10 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed">
                    Join thousands of successful businesses in {CITY_NAME}. Get discovered by customers looking for services like yours.
                </p>
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8 text-white/90">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-sm font-medium">10,000+ Customers</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-sm font-medium">Grow Your Business</span>
                    </div>
                </div>
                <Button
                    onClick={handleGetStarted}
                    size="lg"
                    variant="secondary"
                    className="group gap-2 px-8 py-4 text-lg font-semibold bg-white text-red-600 border border-white  hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    Get Started
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </section>
    )
}
