import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
      <div className="relative w-64 h-44 mx-auto">
        <Image src="/404.svg" alt="Page not found" fill className="object-contain" priority />
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-gray-600">The page you are looking for doesn't exist or was moved.</p>
      <Link href="/" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500">Go home</Link>
    </main>
  )
}

