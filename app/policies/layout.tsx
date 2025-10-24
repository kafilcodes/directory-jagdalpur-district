import type { Metadata } from "next"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dhamtari.directory";

export const metadata: Metadata = {
    title: `Terms & Policies - ${APP_NAME} | ${CITY_NAME} Business Directory`,
    description: `Read ${APP_NAME}'s terms and conditions, privacy policy, payment terms, and frequently asked questions. Learn about our guidelines for business listings, data protection, and user rights in ${CITY_NAME}, ${STATE_NAME}.`,
    keywords: [
        "terms and conditions",
        "privacy policy",
        "payment terms",
        "FAQ",
        "business directory policies",
        `${CITY_NAME} business guidelines`,
        "data protection",
        "user rights",
        "refund policy",
        "listing terms",
        `${APP_NAME} policies`,
        "subscription terms",
        "business listing rules",
        `${CITY_NAME} directory terms`,
        `${STATE_NAME} business policies`,
    ],
    openGraph: {
        title: `Terms & Policies - ${APP_NAME}`,
        description: `Read our terms and conditions, privacy policy, and FAQs for ${CITY_NAME}'s trusted business directory.`,
        url: `${SITE_URL}/policies`,
        siteName: APP_NAME,
        locale: "en_IN",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Terms & Policies - ${APP_NAME}`,
        description: `Read our terms and conditions, privacy policy, and FAQs for ${CITY_NAME}'s trusted business directory.`,
    },
    alternates: {
        canonical: `${SITE_URL}/policies`,
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function PoliciesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
