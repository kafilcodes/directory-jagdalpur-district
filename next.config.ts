import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  typedRoutes: true,
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "placehold.co" },
    ],
    // Removed localPatterns - they're not needed for public folder images
    // Next.js automatically allows all images from /public
    // For API routes with query strings, use unoptimized or loader
  },
  webpack: (config) => {
    config.module?.rules?.push({
      test: /\.svg$/i,
      issuer: { and: [/\.[jt]sx?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
            // Use currentColor so icons can be tinted via text-* classes if desired
            svgoConfig: {
              plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }],
            },
          },
        },
      ],
    })
    return config
  }
}

export default nextConfig
