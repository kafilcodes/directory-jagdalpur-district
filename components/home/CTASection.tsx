"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, TrendingUp, Users, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { onAuthChange } from "@/lib/firebase/authService"

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
        <section className="py-20 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3 flex-wrap">
                    <TrendingUp className="h-8 w-8" />
                    List Your Business Today
                </h2>
                <p className="text-red-100 mb-10 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed">
                    Join thousands of successful businesses in Dhamtari. Get discovered by customers looking for services like yours.
                </p>
                <div className="flex items-center justify-center gap-6 mb-8 text-white/90">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-medium">10,000+ Customers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        <span className="text-sm font-medium">Grow Your Business</span>
                    </div>
                </div>
                <Button
                    onClick={handleGetStarted}
                    size="lg"
                    variant="secondary"
                    className="group gap-2 px-8 py-4 text-lg font-semibold bg-white text-red-600 border border-white hover:bg-red-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
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
