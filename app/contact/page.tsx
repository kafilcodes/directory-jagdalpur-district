import type { Metadata } from "next"
import Image from "next/image"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppButton } from '@/components/common/WhatsappChat';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dhamtari.directory";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "odhamtari@gmail.com";
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91-9340897799";
const OFFICE_ADDRESS = process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "NEAR CIVIL COURT RUDRI DISTRICT DHAMTARI C.G.493776";

// ... rest of your component
export const metadata: Metadata = {
    title: `Contact ${APP_NAME} - Get in Touch with ${CITY_NAME}'s Business Directory`,
    description: `Contact ${APP_NAME} for business listing support, advertising inquiries, or customer assistance. Email: ${CONTACT_EMAIL} | Phone: ${CONTACT_PHONE} | ${CITY_NAME}, ${STATE_NAME}, India`,
    keywords: [
        `contact ${APP_NAME}`,
        `${CITY_NAME} business directory contact`,
        `${APP_NAME} support`,
        `business listing help`,
        `advertise in ${CITY_NAME}`,
        `${CITY_NAME} directory customer service`,
        "business directory support",
        "local advertising contact",
    ],
    openGraph: {
        title: `Contact ${APP_NAME} - ${CITY_NAME} Business Directory Support`,
        description: `Reach out to ${APP_NAME} for business listings, advertising, or support. Serving ${CITY_NAME}, ${STATE_NAME}. Email: ${CONTACT_EMAIL} | Phone: ${CONTACT_PHONE}`,
        url: `${SITE_URL}/contact`,
        siteName: APP_NAME,
        images: [{
            url: "/contact_us.svg",
            width: 800,
            height: 600,
            alt: `Contact ${APP_NAME}`
        }],
        type: "website",
        locale: "en_IN",
    },
    twitter: {
        card: "summary_large_image",
        title: `Contact ${APP_NAME} - ${CITY_NAME} Directory`,
        description: `Get in touch with ${APP_NAME}. Business listings, advertising & support for ${CITY_NAME}, ${STATE_NAME}.`,
        images: ["/contact_us.svg"],
    },
    alternates: {
        canonical: `${SITE_URL}/contact`,
    },
}

const handleWhatsAppClick = () => {
    window.open('https://wa.me/1234567890', '_blank', 'noopener,noreferrer');
};

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2 sm:mb-3">
                    Contact Us
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                    Contact the support team at {APP_NAME}.
                </p>
            </div>

            {/* Visual Section with SVG */}
            <div className="flex justify-center items-center py-4 sm:py-6 md:py-8">
                <div className="relative w-full max-w-xs sm:max-w-md md:max-w-2xl h-40 sm:h-48 md:h-64">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
                {/* Email Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-50 rounded-lg shrink-0">
                                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Email</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                    We respond to all emails within 72 hours.
                                </p>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    className="text-sm sm:text-base font-medium text-gray-900 hover:text-red-600 transition-colors break-all"
                                >
                                    {CONTACT_EMAIL}
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Office Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-50 rounded-lg shrink-0">
                                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Office</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                    Drop by our office for a chat.
                                </p>
                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                    {OFFICE_ADDRESS}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Phone Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-50 rounded-lg shrink-0">
                                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Phone</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                    We're available Mon-Fri, 9am-5pm.
                                </p>
                                <a
                                    href={`tel:${CONTACT_PHONE}`}
                                    className="text-sm sm:text-base font-medium text-gray-900 hover:text-red-600 transition-colors"
                                >
                                    {CONTACT_PHONE}
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Chat Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-50 rounded-lg shrink-0">
                                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Live Chat</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
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
