# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Quick facts
- Stack: Next.js 15 (App Router) + TypeScript + React 19 + Tailwind CSS 4
- Data/services: Firebase (Admin + Client), Firestore, Firebase Storage; optional Algolia search; Razorpay payments; Google Places API; Google AdSense/Ad Manager
- Package manager: npm (package-lock.json present)
- Node version: >= 24 (see "engines" in package.json)

Setup
- Copy environment template and fill values:
  - cp .env.example .env.local
  - Required groups (see .env.example for full list): Firebase Client, Firebase Admin (service account), Firebase Storage bucket, Razorpay (including webhook secret), Google (Places API + AdSense client ID), optional Algolia (APP_ID, API_KEY, INDEX)
- Install dependencies: npm install

Core commands
- Dev server: npm run dev
- Build: npm run build
- Start (prod): npm run start
- Lint: npm run lint
- Typecheck: npm run typecheck
- Tests: npm test (no test runner configured; current script is a placeholder that exits non-zero)
- Project-specific:
  - Seed sample listings (requires Firebase Admin env): npm run seed:listings
  - Grant admin claim to a user (requires Firebase Admin env): npm run set:admin -- <uid>
  - Start MCP helper for shadcn/ui (local tooling): npm run mcp:shadcn

High-level architecture
- Next.js App Router with server and client components
  - Root layout and global styles: app/layout.tsx, styles/globals.css
  - Route groups:
    - Public pages: app/page.tsx (home), app/search/page.tsx (search), app/listing/[id]/page.tsx (listing detail), app/submit/page.tsx (submit form)
    - Auth-required/admin areas:
      - Provider dashboard: app/(dashboard)/dashboard/page.tsx
      - Admin moderation: app/(admin)/admin/moderation/page.tsx with server action toggle at app/(admin)/admin/moderation/toggle.ts
- API routes (Next.js route handlers under app/api)
  - Session cookie management using Firebase ID token: app/api/auth/session/route.ts (sets/deletes httpOnly "session")
  - Listings read endpoint: app/api/listings/[id]/route.ts (Firestore fetch)
  - Google Places proxy with in-memory LRU caching: app/api/google-places-proxy/route.ts
  - Analytics ingestion with simple IP+route rate limiting (LRU): app/api/track/route.ts and lib/rate-limit.ts
  - Payments:
    - Create Razorpay order (node runtime): app/api/razorpay/create-order/route.ts via lib/payments/razorpay.ts
    - Webhook verification (node runtime, HMAC check): app/api/webhooks/payment/route.ts → persists to Firestore/analyticsEvents
- Server actions (mutations, Firestore writes) in app/actions
  - submitListing.ts (validate with zod → Firestore create)
  - uploadAndCreateListing.ts (optional image upload to Firebase Storage via lib/images/upload.ts)
  - getListingDetails.ts, getListingAnalytics.ts
- Data and integration layer (lib/)
  - Firebase Admin (server-only) initialization and helpers: lib/firebase/admin.ts (app, db, storage bucket)
  - Firebase Client (browser): lib/firebase/client.ts
  - Search: lib/search/server.ts uses Algolia when ALGOLIA_* envs present; otherwise falls back to Firestore + in-memory filter/sort
  - Auth helpers for server usage: lib/auth/server.ts (reads "session" cookie; verifies via Admin SDK; checks admin claim)
  - Images: lib/images/upload.ts (upload to Storage), lib/images/thumb.ts (thumbnail URL derivation compatible with Firebase Extensions)
  - Payments: lib/payments/razorpay.ts (credentialed client)
  - Validation: lib/validators/listing.ts (zod schema)
- UI and features
  - UI components (shadcn-style) under components/ui (form, input, dialog, etc.)
  - Listings UI and interactions:
    - ListingCard (server) + ListingCardClient (client wrapper with navigation + fire-and-forget tracking)
    - FeaturedListings server component with graceful skeleton fallback if Admin env missing
    - ListingDetailSheet client component fetches /api/listings/[id]
  - Search UX:
    - SearchBox (client) + FiltersClient (client) using features/listings/config.ts (categories, sort)
    - useSearchParamsState hook: hooks/useSearchParamsState.ts (URL param management)
  - Ads abstraction:
    - config/ads.ts defines ad slots
    - components/ads/AdSlot.ts selects AdSense vs Google Ad Manager rendering
- Environment gating and fallbacks
  - Many data-rendering components detect Admin env presence and render skeleton placeholders if missing (e.g., FeaturedListings, search page), allowing the app to run locally without full credentials
- Configuration
  - next.config.ts enables typedRoutes; strict lint/typecheck during build; remote images allowlisted for Google Cloud Storage

Notes on integrations
- Firebase Admin requires FIREBASE_ADMIN_PRIVATE_KEY with literal “\n” escapes (handled by replace(/\\n/g, "\n") in lib/firebase/admin.ts)
- Razorpay requires RAZORPAY_KEY_ID/SECRET server-side; client checkout uses NEXT_PUBLIC_RAZORPAY_KEY_ID
- Google Places proxy requires GOOGLE_PLACES_API_KEY
- Optional Algolia trio: ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX
- AdSense client ID must be set in NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID for AdSenseSlot to initialize
