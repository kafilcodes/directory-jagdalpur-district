import type { Metadata } from "next"
import Image from "next/image"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppButton } from '@/components/common/WhatsappChat';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dhamtari.directory";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "odhamtari@gmail.com";
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91-9340897799";
const OFFICE_ADDRESS = process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "NEAR CIVIL COURT RUDRI DISTRICT DHAMTARI C.G.493776";

// ... rest of your component
export const metadata: Metadata = {
    title: `Contact Us • ${APP_NAME}`,
    description: `Get in touch with ${APP_NAME}. Contact our support team for any questions, feedback, or assistance.`,
    openGraph: {
        title: `Contact Us • ${APP_NAME}`,
        description: `Contact the support team at ${APP_NAME} for assistance.`,
        url: `${SITE_URL}/contact`,
        siteName: APP_NAME,
        images: [{ url: "/logo.png", width: 256, height: 256 }],
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Contact Us • ${APP_NAME}`,
        description: `Get in touch with ${APP_NAME} support team.`,
        images: ["/logo.png"],
    },
}

const handleWhatsAppClick = () => {
    window.open('https://wa.me/1234567890', '_blank', 'noopener,noreferrer');
};

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">



            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
                    Contact Us
                </h1>
                <p className="text-gray-600">
                    Contact the support team at {APP_NAME}.
                </p>
            </div>

            {/* Visual Section with SVG */}
            <div className="flex justify-center items-center py-8">
                <div className="relative w-full max-w-2xl h-50 sm:h-65">
                    <Image
                        src="/contact_us.svg"
                        alt="Contact Us"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {/* Email Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <Mail className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    We respond to all emails within 72 hours.
                                </p>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    className="text-base font-medium text-gray-900 hover:text-red-600 transition-colors"
                                >
                                    {CONTACT_EMAIL}
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Office Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <MapPin className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Office</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Drop by our office for a chat.
                                </p>
                                <p className="text-base font-medium text-gray-900">
                                    {OFFICE_ADDRESS}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Phone Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <Phone className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    We're available Mon-Fri, 9am-5pm.
                                </p>
                                <a
                                    href={`tel:${CONTACT_PHONE}`}
                                    className="text-base font-medium text-gray-900 hover:text-red-600 transition-colors"
                                >
                                    {CONTACT_PHONE}
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Chat Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <MessageCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Get instant help from our support team.
                                </p>
                                {/* <button className="text-base font-medium text-gray-600 hover:text-red-700 transition-colors" onClick={handleWhatsAppClick}>
                                    Chat
                                </button> */}
                                <WhatsAppButton
                                    phoneNumber={CONTACT_PHONE.replace(/[^0-9]/g, '')}
                                    message={`Hello, I would like to inquire about ${APP_NAME}.`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


        </main>
    )
}
