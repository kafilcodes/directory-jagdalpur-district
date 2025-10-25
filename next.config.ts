import type { NextConfig } from "next"

// Bundle analyzer - enable with ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Performance & Build Optimization
  productionBrowserSourceMaps: false, // Disable source maps in production (reduce bundle size)
  // Note: swcMinify is enabled by default in Next.js 15+
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Optimize bundle splitting and tree shaking
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Enable optimized package imports for faster cold starts
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
    // Optimize for Vercel deployment
    optimizeCss: true, // Optimize CSS in production
  },

  // Security and Performance Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security Headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ],
      },
      {
        // Cache static assets aggressively
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache images with revalidation
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
        ],
      },
      {
        // Enable bfcache - cache pages for back/forward navigation
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ]
  },

  typedRoutes: true,
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: {
    // Image optimization settings for better performance
    formats: ["image/webp"], // Use WebP for smaller file sizes
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Common device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon and thumbnail sizes
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "placehold.co" },
      // Google user profile photos
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
    ],
    // Local patterns for API routes and public folder (Next.js 15+)
    localPatterns: [
      {
        pathname: "/api/google-places/photo**",
        search: "",
      },
      {
        pathname: "/api/proxy-image**",
        search: "",
      },
      {
        pathname: "/**",
        search: "",
      },
    ],
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

export default withBundleAnalyzer(nextConfig)
