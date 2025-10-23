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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dhamtari.directory";

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: `About • ${APP_NAME}`,
  description: `${APP_NAME} connects people with trusted local businesses. Discover, compare and contact verified listings across categories.`,
  openGraph: {
    title: `About • ${APP_NAME}`,
    description: `Discover how ${APP_NAME} helps businesses grow and people find what they need.`,
    url: `${SITE_URL}/about`,
    siteName: APP_NAME,
    images: [{ url: "/logo.png", width: 256, height: 256 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `About • ${APP_NAME}`,
    description: `Find trusted local businesses in ${CITY_NAME}.`,
    images: ["/logo.png"],
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">About {APP_NAME}</h1>
        <p className="mt-3 text-gray-600">We connect people with trusted local businesses and help entrepreneurs grow with modern, searchable profiles.</p>
      </header>

      <section aria-labelledby="mission" className="mt-10 sm:mt-14">
        <h2 id="mission" className="sr-only">Our mission</h2>
        <div className="grid gap-6 sm:gap-10 md:grid-cols-2 items-center">
          <div className="order-2 md:order-1 space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">Built for Local Discovery</h3>
            <p className="text-gray-600">From restaurants and hotels to healthcare and education, we make it simple to discover, compare and contact businesses across {CITY_NAME}. Listings are structured, easy to read and optimised for search.</p>
            <p className="text-gray-600">Owners can manage their presence, update details, and upgrade to Featured placement for top visibility on the homepage and category pages.</p>
          </div>
          <div className="order-1 md:order-2 w-full max-w-md mx-auto">
            <Misc alt="Local discovery" width={448} height={336} />
          </div>
        </div>
      </section>

      <section aria-labelledby="benefits" className="mt-12 sm:mt-16">
        <h2 id="benefits" className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Why businesses choose us</h2>
        <div className="mt-8 space-y-12">
          {benefits.map((b, i) => (
            <article key={b.key} className="grid gap-6 sm:gap-10 md:grid-cols-2 items-center">
              {i % 2 === 0 ? (
                <>
                  <div className="w-full max-w-md mx-auto">
                    {b.key === "brand" && <Brand alt={b.title} width={448} height={336} />}
                    {b.key === "fame" && <Famous alt={b.title} width={448} height={336} />}
                    {b.key === "marketing" && <Marketing alt={b.title} width={448} height={336} />}
                    {b.key === "wordofmouth" && <WordOfMouth alt={b.title} width={448} height={336} />}
                    {b.key === "growth" && <Growth alt={b.title} width={448} height={336} />}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">{b.title}</h3>
                    <p className="text-gray-600">{b.copy}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 order-2 md:order-1">
                    <h3 className="text-xl font-semibold text-gray-900">{b.title}</h3>
                    <p className="text-gray-600">{b.copy}</p>
                  </div>
                  <div className="w-full max-w-md mx-auto order-1 md:order-2">
                    {b.key === "brand" && <Brand alt={b.title} width={448} height={336} />}
                    {b.key === "fame" && <Famous alt={b.title} width={448} height={336} />}
                    {b.key === "marketing" && <Marketing alt={b.title} width={448} height={336} />}
                    {b.key === "wordofmouth" && <WordOfMouth alt={b.title} width={448} height={336} />}
                    {b.key === "growth" && <Growth alt={b.title} width={448} height={336} />}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Our promise</h2>
        <p className="mt-3 text-center text-gray-600 max-w-3xl mx-auto">Accurate information, respectful moderation and a clean, accessible experience. We continuously improve our platform to support local commerce and community needs.</p>
        <p className="mt-4 text-center">
          <Link href="/policies" className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium">
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
