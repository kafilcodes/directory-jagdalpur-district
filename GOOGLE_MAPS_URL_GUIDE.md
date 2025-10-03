# Google Maps URL Integration Guide

## Overview
The Create Listing form now uses **Google Maps URL input** instead of autocomplete search. Business owners paste their Google Business Profile URL to auto-fill their listing details.

---

## How It Works

### For Business Owners:

1. **Get Your Google Maps URL:**
   - Open Google Maps (https://maps.google.com)
   - Search for your business name
   - Click on your business listing
   - Click the "Share" button
   - Copy the link

2. **Paste URL in Create Listing Form:**
   - Go to `/user/create-listing`
   - Paste the URL in the "Google Business Profile URL" field
   - Click "Fetch Details"
   - All business information will be auto-filled

3. **Supported URL Formats:**
   - `https://maps.app.goo.gl/xxxxx` (Short link)
   - `https://www.google.com/maps/place/Business+Name/...` (Full link)
   - `https://goo.gl/maps/xxxxx` (Old short link)

---

## Technical Implementation

### Place ID Extraction

The system extracts Place IDs from Google Maps URLs using pattern matching:

```typescript
// Supported patterns:
- !1s(ChIJ...) → Direct Place ID
- cid=123456 → Customer ID
- ftid=0x... → Feature ID
```

### API Flow

1. **User pastes URL** → Frontend
2. **Extract Place ID** → `extractPlaceIdFromUrl()`
3. **Fetch details** → `/api/google-places/details`
4. **Validate location** → Check if in Dhamtari district
5. **Auto-fill form** → Pre-populate business data

---

## Location Restriction

Only businesses in **Dhamtari district** are allowed:

- **Latitude:** 20.9 to 21.9
- **Longitude:** 81.0 to 82.2

If a business is outside these bounds, the user sees:
> ⚠️ "This business is outside Dhamtari district. Only businesses located in Dhamtari are allowed."

---

## Example URLs

### Valid Dhamtari Business URLs:

```
https://maps.app.goo.gl/abcd1234
https://www.google.com/maps/place/Hotel+Dhamtari/@21.4416,81.5979,15z
https://goo.gl/maps/xyz789
```

### Place ID Formats:

```
ChIJxxxxxxxxxxxxxxxxxxxx  (Standard Place ID)
0x3a31f22:0x5c2b8d4       (Encoded Place ID)
1234567890                (CID format)
```

---

## Error Handling

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid Google Maps URL" | URL doesn't contain Place ID | Use the Share button in Google Maps |
| "Location restricted" | Business outside Dhamtari | Only Dhamtari businesses allowed |
| "Failed to fetch place details" | API error or invalid Place ID | Check URL is from verified Google Business |

---

## Manual Entry Fallback

If Google Maps URL doesn't work, users can still:
- Enter business name manually
- Fill in address, phone, website
- Upload their own photos
- Complete the listing without Google data

---

## Testing

### Test with a Dhamtari Business:

1. Search "restaurant dhamtari" on Google Maps
2. Open any result
3. Click Share → Copy link
4. Paste in Create Listing form
5. Verify details auto-fill

### Test Location Restriction:

1. Search "hotel mumbai" on Google Maps
2. Copy the URL
3. Paste in Create Listing form
4. Verify error: "Location restricted to Dhamtari district"

---

## Benefits Over Autocomplete

1. ✅ **More Reliable** - No autocomplete API quota limits
2. ✅ **Better UX** - One-click auto-fill instead of search/select
3. ✅ **Accurate Data** - Direct from verified Google Business Profile
4. ✅ **No Suggestions Needed** - Business owner knows their exact URL
5. ✅ **Verified Businesses Only** - Only claimed Google Business Profiles have shareable URLs

---

## API Endpoints Used

### `/api/google-places/details`

**POST** Request:
```json
{
  "placeId": "places/ChIJxxxxxxxxxxxxxxxxxxxx"
}
```

**Response (Success):**
```json
{
  "success": true,
  "placeDetails": {
    "name": "Business Name",
    "address": "Full Address",
    "location": { "lat": 21.44, "lng": 81.59 },
    "phone": "+91 1234567890",
    "website": "https://example.com",
    "photos": [...],
    "rating": 4.5,
    ...
  }
}
```

**Response (Location Restricted):**
```json
{
  "success": false,
  "error": "This business is outside Dhamtari district...",
  "locationRestricted": true
}
```

---

## Firestore Collection Issue (Fixed)

The console errors about "listings collection not found" are normal for new Firebase projects. The collection will be automatically created when the first listing is submitted.

**Current Errors (Can Be Ignored):**
```
Server [Firestore Error] Collection/Document not found: listings
ℹ️ This collection may need to be created in Firestore
```

**Status:** ✅ This is expected behavior. Collection will be created on first write.

---

## Next Steps

1. **Test the flow** with a real Dhamtari business URL
2. **Complete a test listing** to create the Firestore collection
3. **Make a test payment** with Razorpay test card
4. **Verify listing appears** in Firestore console

---

## Support

If Place ID extraction fails:
- Check the URL is from Google Maps/Business
- Verify the business has a claimed Google Business Profile
- Use manual entry as fallback
- Contact support with the URL for debugging
