# User Area Documentation

Version: 1.0  
Last Updated: October 3, 2025

## Overview

The `/user/*` routes provide a secure, authenticated area for business owners to manage their listings on the Dhamtari Directory platform. All routes under `/user/*` require authentication and use a custom sidebar layout (no public header/footer).

## Architecture

### Route Structure

```
/user
├── layout.tsx          # User area layout with sidebar + auth guard
├── dashboard/          # Analytics dashboard
├── my-listing/         # View/manage existing listing
├── create-listing/     # Create new listing form
└── profile/            # User profile
```

### Authentication Flow

1. **Middleware Protection**: All `/user/*` routes are protected by `middleware.ts`
2. **Client-Side Guard**: `ClientAuthGuard` component provides fallback for SPA navigation
3. **Auth Redirect Popup**: Unauthenticated users see a 3-second countdown popup before redirect to home
4. **Session Management**: Firebase ID tokens stored in HTTP-only cookies

### Layout Components

- **LayoutUser** (`components/user/LayoutUser.tsx`): Custom sidebar layout
  - Mobile: Sheet drawer with hamburger menu
  - Desktop: Fixed sidebar navigation
  - Navigation items: Dashboard, My Listing, Create Listing, Profile
  - Actions: Back to Site, Sign Out

## Required Firestore Collections

The user area requires the following Firestore collections. If any are missing, the app will gracefully handle errors and log warnings in development mode:

### 1. `users`
Stores authenticated user data.
```
/users/{uid}
├── email: string
├── displayName: string
├── createdAt: timestamp
└── role: string (optional)
```

### 2. `listings`
Core listing data for each business.
```
/listings/{listingId}
├── ownerUid: string
├── businessName: string
├── categorySlug: string (references /config/directory.ts)
├── isPublic: boolean
├── address: map
├── googleData: map
├── monetization: map
│   ├── planId: string (references /config/directory.ts)
│   ├── expiresAt: timestamp
│   └── ...
└── createdAt: timestamp
```

### 3. `listingStats`
Pre-aggregated analytics for dashboard display.
```
/listingStats/{listingId}
├── totalImpressions: number
├── totalClicks: number
├── views_total: number
├── clicks_total: number
├── topKeywords: array
└── lastAggregated: timestamp
```

### 4. `listingEvents`
Event subcollections for detailed analytics.
```
/listingEvents/{listingId}/events/{eventId}
├── type: string ("view" | "click")
├── ts: number (timestamp)
├── listingId: string
└── path: string (optional)
```

### 5. `search`
Sharded search index (managed by backend, not directly modified by user area).

## Static Configuration

All categories and monetization plans are defined in `/config/directory.ts` to eliminate unnecessary database reads. This file is the single source of truth for:

- **Categories**: Available business categories (hotels, restaurants, healthcare, etc.)
- **Monetization Plans**: Free, Featured, and Sponsored listing plans with pricing

## Key Features

### Dashboard (`/user/dashboard`)
- **Analytics Overview**: Today, 7-day, 14-day, and all-time stats
- **Charts**: Sparkline visualizations for views and clicks
- **Trend Indicators**: Delta comparisons for weekly performance
- **Empty State**: CTA to create listing if none exists
- **Error Handling**: Graceful degradation if analytics collections missing

### My Listing (`/user/my-listing`)
- **Listing Display**: Business name, category, address, contact info
- **Status Badges**: Public/Draft, Featured/Sponsored
- **Plan Information**: Current plan and expiration date
- **Actions**: View public page, view analytics
- **Empty State**: CTA to create listing

### Create Listing (`/user/create-listing`)
- **Google Places Integration**: Fetch business data from Google Maps URL or Place ID
- **Form Validation**: Required fields marked with red asterisks
- **Auto-Draft Saving**: Form data saved to localStorage
- **Plan Selection**: Choose Free, Featured, or Sponsored plan
- **Payment Flow**: Paid plans route to payment page (future implementation)
- **Free Plan**: Direct submission to Firestore
- **One Listing Limit**: Users can only have one listing per account

### Profile (`/user/profile`)
- **Account Information**: Email, display name, creation date
- **Status Badges**: Email verification, account type
- **User ID**: Firebase UID for debugging

## Error Handling

### Missing Collections

When Firestore collections are missing:
1. **No Crashes**: App continues to function with empty states
2. **Console Logging**: Development mode logs missing collection names
3. **User Feedback**: Yellow warning cards explain limited data availability
4. **Helper Messages**: Suggests creating missing collections in Firebase Console

### Error Utility (`lib/firebase/errorHandling.ts`)

- `isNotFoundError()`: Detects NOT_FOUND errors (code 5)
- `isPermissionDeniedError()`: Detects PERMISSION_DENIED errors (code 7)
- `logFirestoreError()`: Logs errors with context in development
- `safeQuery()`: Wraps queries with error handling
- `getRequiredCollections()`: Returns list of required collections

## Legacy Route Redirects

Old auth routes redirect to new `/user/*` routes:

- `/dashboard` → `/user/dashboard`
- `/create-listing` → `/user/create-listing`
- `/my-listing` → `/user/my-listing`
- `/profile` → `/user/profile`

These redirects ensure backward compatibility with existing links and bookmarks.

## Development

### Adding New User Pages

1. Create page in `/app/user/{page-name}/page.tsx`
2. Add route to `menuItems` in `components/user/LayoutUser.tsx`
3. Update `AUTH_REQUIRED_PATHS` in `middleware.ts` if needed
4. Follow error handling patterns from existing pages

### Testing Auth Protection

1. Sign out and attempt to access `/user/*` routes
2. Verify redirect popup appears with 3-second countdown
3. Verify redirect to home page
4. Sign in and verify access granted

### Local Storage Draft Key

Create listing drafts are saved with key: `create_listing_draft`

## Production Checklist

Before deploying:

- [ ] All required Firestore collections created
- [ ] Firestore security rules deployed (see `/context/Firebase Setup & Services.md`)
- [ ] Firebase Admin SDK credentials configured
- [ ] Environment variables set (see `.env.local.example`)
- [ ] Test auth flow end-to-end
- [ ] Verify error handling for missing collections
- [ ] Test mobile responsive layouts
- [ ] Verify all redirects from legacy routes

## Troubleshooting

### "5 NOT_FOUND" Errors

**Cause**: Firestore collections don't exist yet  
**Solution**: Create collections in Firebase Console or let app create them on first write

### Dashboard Shows No Data

**Cause**: `listingEvents` or `listingStats` collections missing  
**Solution**: Collections will be created when analytics events are tracked

### Can't Create Listing

**Cause**: User already has a listing  
**Solution**: One listing per account limit - edit existing listing instead

### Auth Redirect Loop

**Cause**: Session cookie not being set  
**Solution**: Check `/api/auth/session` endpoint and Firebase Admin credentials

## Maintainer Notes

- All user pages are server components by default
- Client components used only where needed (forms, interactive elements)
- Analytics queries use safe wrappers to prevent crashes
- Mobile-first responsive design throughout
- Accessibility: ARIA labels, keyboard navigation, screen reader support
