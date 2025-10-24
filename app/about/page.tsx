import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import Brand from "@/components/icons/Brand"
import Famous from "@/components/icons/Famous"
import Marketing from "@/components/icons/Marketing"
import WordOfMouth from "@/components/icons/WordOfMouth"
import Growth from "@/components/icons/Growth"
import Misc from "@/components/icons/Misc"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dhamtari.directory";

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: `About ${APP_NAME} - ${CITY_NAME}'s Trusted Business Directory`,
  description: `Learn about ${APP_NAME}, ${CITY_NAME}'s premier business directory connecting people with trusted local services, restaurants, hotels, healthcare, shopping & more in ${STATE_NAME}, India. Discover verified listings, reviews & contact information.`,
  keywords: [
    `about ${APP_NAME}`,
    `${CITY_NAME} business directory`,
    `local business ${CITY_NAME}`,
    `${CITY_NAME} services`,
    `${STATE_NAME} directory`,
    "business listing platform",
    "verified businesses",
    "local directory India",
    "business advertising",
    "small business marketing",
  ],
  openGraph: {
    title: `About ${APP_NAME} - Connecting ${CITY_NAME} with Local Businesses`,
    description: `${APP_NAME} is ${CITY_NAME}'s most comprehensive business directory. We help businesses grow and people find trusted services in ${STATE_NAME}, India. Verified listings, real reviews, easy contact.`,
    url: `${SITE_URL}/about`,
    siteName: APP_NAME,
    images: [{
      url: "/logo.png",
      width: 512,
      height: 512,
      alt: `${APP_NAME} Logo - ${CITY_NAME} Business Directory`
    }],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `About ${APP_NAME} - ${CITY_NAME}'s Business Directory`,
    description: `Discover how ${APP_NAME} connects ${CITY_NAME} residents with trusted local businesses, services, restaurants & more in ${STATE_NAME}, India.`,
    images: ["/logo.png"],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const benefits = [
  {
    key: "brand",
    title: "Brand Building",
    img: "/brand.svg",
    copy: "Stand out with a complete, credible profile. Add photos, categories, working hours and highlights so people instantly recognise your brand.",
  },
  {
    key: "fame",
    title: "Fame & Social Influence",
    img: "/famous.svg",
    copy: "Be discoverable where customers search. Ratings, reviews and shares amplify your presence and build social proof.",
  },
  {
    key: "marketing",
    title: "Smarter Marketing",
    img: "/marketing.svg",
    copy: "Reach the right audience with category and location targeting. Featured plans place you in high‑visibility spots across the site.",
  },
  {
    key: "wordofmouth",
    title: "Word of Mouth",
    img: "/wordofmouth.svg",
    copy: "Happy customers talk. Showcase testimonials and make it effortless to recommend your business to friends and family.",
  },
  {
    key: "growth",
    title: "Business Growth",
    img: "/growth.svg",
    copy: "Turn visibility into visits and sales. Track engagement and continuously improve your listing for sustained growth.",
  },
] as const

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <header className="text-center max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">About {APP_NAME}</h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-gray-600">We connect people with trusted local businesses and help entrepreneurs grow with modern, searchable profiles.</p>
      </header>

      <section aria-labelledby="mission" className="mt-6 sm:mt-8 md:mt-10 lg:mt-14">
        <h2 id="mission" className="sr-only">Our mission</h2>
        <div className="grid gap-6 sm:gap-8 md:gap-8 lg:gap-10 md:grid-cols-2 items-center">
          <div className="order-2 md:order-1 space-y-1.5 sm:space-y-2 md:space-y-3">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Built for Local Discovery</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">From restaurants and hotels to healthcare and education, we make it simple to discover, compare and contact businesses across {CITY_NAME}. Listings are structured, easy to read and optimised for search.</p>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Owners can manage their presence, update details, and upgrade to Featured placement for top visibility on the homepage and category pages.</p>
          </div>
          <div className="order-1 md:order-2 w-full flex justify-center">
            <div className="w-[160px] sm:w-[200px] md:w-[280px] lg:w-[320px]">
              <Misc alt="Local discovery" width={320} height={240} className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="benefits" className="mt-8 sm:mt-10 md:mt-12 lg:mt-16">
        <h2 id="benefits" className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 text-center">Why businesses choose us</h2>
        <div className="mt-4 sm:mt-6 md:mt-8 space-y-8 sm:space-y-10 md:space-y-10 lg:space-y-12">
          {benefits.map((b, i) => (
            <article key={b.key} className="grid gap-6 sm:gap-8 md:gap-8 lg:gap-10 md:grid-cols-2 items-center">
              {i % 2 === 0 ? (
                <>
                  <div className="w-full flex justify-center">
                    <div className="w-[160px] sm:w-[200px] md:w-[280px] lg:w-[320px]">
                      {b.key === "brand" && <Brand alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "fame" && <Famous alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "marketing" && <Marketing alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "wordofmouth" && <WordOfMouth alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "growth" && <Growth alt={b.title} width={320} height={240} className="w-full h-auto" />}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3 my-10">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{b.title}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600">{b.copy}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3 order-2 md:order-1">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{b.title}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600">{b.copy}</p>
                  </div>
                  <div className="w-full flex justify-center order-1 md:order-2">
                    <div className="w-[160px] sm:w-[200px] md:w-[280px] lg:w-[320px]">
                      {b.key === "brand" && <Brand alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "fame" && <Famous alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "marketing" && <Marketing alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "wordofmouth" && <WordOfMouth alt={b.title} width={320} height={240} className="w-full h-auto" />}
                      {b.key === "growth" && <Growth alt={b.title} width={320} height={240} className="w-full h-auto" />}
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 sm:mt-10 md:mt-12 lg:mt-16">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 text-center">Our promise</h2>
        <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm md:text-base text-gray-600 max-w-3xl mx-auto">Accurate information, respectful moderation and a clean, accessible experience. We continuously improve our platform to support local commerce and community needs.</p>
        <p className="mt-2 sm:mt-3 md:mt-4 text-center">
          <Link href="/policies" className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:underline font-medium">
            Know about our policies →
          </Link>
        </p>
      </section>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `About • ${APP_NAME}`,
            description: `Directory for trusted local businesses in ${CITY_NAME}`,
            url: `${SITE_URL}/about`,
            publisher: { '@type': 'Organization', name: APP_NAME }
          })
        }}
      />
    </main>
  )
}
