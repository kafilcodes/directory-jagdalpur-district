export const dynamic = "force-static"

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2 text-center">
        <h1>About Dhamtari Directory</h1>
        <p className="text-gray-600">Connecting customers with trusted local businesses and service providers.</p>
      </div>

      <section className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        <p>
          Dhamtari Directory helps residents and visitors find reliable businesses across categories
          like restaurants, hotels, healthcare, education, and more. We verify listings to keep
          information accurate and up-to-date.
        </p>
        <p>
          Business owners can submit their listing, optionally upgrade to Featured for priority
          placement and homepage highlights, and manage their presence from a simple dashboard.
        </p>
        <p>
          Have feedback or a partnership inquiry? Reach us via the contact options in the footer.
        </p>
      </section>
    </main>
  )
}

