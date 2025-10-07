# **Database Modeling**

Version: 9.0 (Final & Hyper-Optimized Architecture)  
Purpose: Defines the definitive, scalable Firestore architecture. This model uses an aggregated, sharded, and denormalized index to unify search and analytics, and moves static data to the local codebase to maximize performance and minimize cost.

## **1\. Core Dynamic Collections**

The final architecture relies on only **four essential, dynamic collections**.

### **1.1. Collection: listings**

The comprehensive source of truth for business listings with full Google Places API integration.

* **Document ID**: auto-generated  
* **Fields**:  
  * **Core Identification**
    * ownerUid (string) - Firebase Auth UID of listing owner
    * placeId (string) - Google Places API Place ID (required, unique)
    * title (string) - Business name from Places API
    * businessName (string) - Alias for title (backwards compatibility)
  
  * **Categories & Classification**
    * categories (array of strings) - Multiple category tags from Places API types
    * categorySlug (string) - Primary category slug for search indexing
    * primaryType (string) - Main Google Places type
  
  * **Description & Content**
    * description (string) - Business description (from Places API editorialSummary or custom)
    * tags (array of strings) - Additional searchable tags
  
  * **Location Data**
    * address (map) - Structured address object
      * formattedAddress (string) - Full formatted address
      * line1 (string) - Street address
      * city (string) - City name (extracted from address components)
      * state (string) - State/province (defaults to "Chhattisgarh")
      * postalCode (string) - Postal/ZIP code (must contain 493773 for Dhamtari)
      * country (string) - Country name
    * location (geopoint) - Firebase GeoPoint with lat/lng coordinates
    * addressComponents (array of maps) - Raw Google Places address components
  
  * **Contact Information**
    * phone (string) - Business phone number from Places API
    * email (string) - Contact email (optional, not from Places API)
    * website (string) - Business website URL from Places API
  
  * **Media & Images**
    * images (array of objects) - User-uploaded custom images stored in Firebase Storage
      * Each image object contains:
        ```typescript
        {
          url: string              // Firebase Storage CDN URL
          filename: string         // Original filename
          size: number            // File size in bytes
          width: number           // Image width in pixels (optional)
          height: number          // Image height in pixels (optional)
          uploadedAt: timestamp   // Upload timestamp
        }
        ```
    * primaryImageIndex (number) - Index of primary image in images array (default: 0)
    * photos (array of strings) - Google Places photo references (for display only, not stored as blobs)
  
  * **Operating Hours**
    * openingHours (array of strings) - Weekday descriptions from Places API
    * currentOpeningHours (map) - Structured hours data
      * openNow (boolean)
      * weekdayDescriptions (array of strings)
  
  * **Ratings & Reviews**
    * rating (number) - Average rating from Google Places (1-5)
    * userRatingCount (number) - Total number of ratings
    * reviews (array of objects) - Google Places reviews
      * Each review object contains:
        ```typescript
        {
          authorName: string           // Reviewer display name
          authorPhoto: string          // Reviewer photo URL (optional)
          rating: number              // Review rating (1-5)
          relativeTime: string        // "2 months ago"
          time: timestamp             // Review timestamp
          text: string                // Review content
        }
        ```
  
  * **Monetization & Plans**
    * monetization (map) - Current active plan details
      * planId (string) - References plan in /config/directory.ts
      * type (string) - "free" | "sponsored" | "featured"
      * startAt (timestamp)
      * endAt (timestamp)
    * activePlan (map) - Alias for monetization (backwards compatibility)
    * orderId (string) - Razorpay order ID for paid plans
    * paymentId (string) - Razorpay payment ID for paid plans
    * receipts (array of objects) - Payment transaction history
      * Each receipt contains:
        ```typescript
        {
          orderId: string
          paymentId: string
          amount: number
          currency: string
          plan: string
          timestamp: number
          status: string
        }
        ```
  
  * **Status & Metadata**
    * status (string) - "creating" | "active" | "failed" | "pending" | "draft"
    * isPublic (boolean) - Visibility flag (default: true)
    * approved (boolean) - Admin approval status (default: true)
    * expiryDate (timestamp) - Plan expiration date (null for free plan)
  
  * **Google Places Metadata**
    * googleData (map) - Full raw Google Places API response (optional, for reference)
    * googleMapsUri (string) - Google Maps URL for the business
    * businessStatus (string) - "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY"
  
  * **Analytics & Engagement**
    * views (number) - Total listing views
    * clicks (number) - Total click-throughs
    * impressions (number) - Total search impressions
  
  * **Timestamps**
    * createdAt (timestamp) - Listing creation timestamp
    * updatedAt (timestamp) - Last update timestamp
    * publishedAt (timestamp) - When listing went live (optional)

### **1.2. Collection: search**

The heart of the system. This is a sharded index where each document represents a "shard" (e.g., index\_a for words starting with 'a'). It unifies search data with raw analytics counters.

* **Collection ID**: search  
* **Document IDs**: index\_a, index\_b, ..., index\_z, index\_other  
* **Fields (within each shard document)**:  
  * **index (map)**: A map where each key is a search term. The value is another map of listingIds to their unified search and analytics data.  
  * **lastUpdatedAt (timestamp)**

**Example structure for index\_p:**

{  
  "index": {  
    "pizza": {  
      "listingId123": {  
        "score": 10,  
        "name": "Nirmal Pizza Place",  
        "cat": "restaurants",  
        "imp": 1250,  
        "clk": 85  
      }  
    }  
  }  
}

### **1.3. Collection: listingStats**

Stores pre-aggregated, denormalized stats for each provider, enabling instant dashboard loads.

* **Collection ID**: listingStats  
* **Document ID**: listingId (Matches the ID in the listings collection)  
* **Fields**:  
  * totalImpressions (number)  
  * totalClicks (number)  
  * topKeywords (array of maps): A sorted list of the most impactful keywords.  
    \[  
      { "term": "pizza", "imp": 1250, "clk": 85 },  
      { "term": "nirmal", "imp": 800, "clk": 60 }  
    \]

  * lastAggregated (timestamp)

### **1.4. Collection: users**

Stores data for authenticated providers who manage listings.

* **Document ID**: Firebase Authentication UID  
* **Fields**:  
  * email (string)  
  * displayName (string)  
  * createdAt (timestamp)

## **2\. Static Data (Local Configuration)**

To eliminate unnecessary database reads and maximize performance, the following data is **not** stored in Firestore. It is managed as a static configuration file within the Next.js project (e.g., in /config/directory.ts).

* **Categories**: The full list of available provider categories.  
* **Monetization Plans**: The definitions for all available featured listing plans.

## **3\. Media Storage Architecture**

### **3.1. Firebase Storage Structure**

All user-uploaded media is stored in Firebase Storage following a strict hierarchical structure with sequence-based naming:

**Storage Path Pattern**: `/images/{userId}/{listingId}/{sequenceIndex}_{filename}`

**Example Paths**:
```
/images/abc123uid/listing789/0_storefront.jpg       # Primary image (first in order)
/images/abc123uid/listing789/1_interior.jpg         # Second image
/images/abc123uid/listing789/2_menu.jpg             # Third image
```

**Key Changes**:
- **sequenceIndex** (0-19): Replaces timestamp prefix, preserves user-defined display order
- **Purpose**: Enables drag-drop reordering without file renames
- **Primary Image**: Identified by `primaryImageIndex` field (default: 0) or `isPrimary` flag

### **3.2. Image Upload Requirements**

* **Minimum**: 1 image (required for listing creation)
* **Maximum**: 20 images per listing
* **File Types**: JPEG, PNG, WebP only (validated client-side)
* **Size Limit**: 3MB per image (enforced in ImageUploadEnhanced component)
* **Total Session Limit**: 60MB (20 images × 3MB max)
* **Primary Image**: User-selected via "Set Primary" button, or defaults to first image (sequenceIndex=0)
* **Sequence Numbers**: Displayed on thumbnails (1...20) for user clarity
* **Reordering**: Drag-drop or arrow buttons (↑↓) update Firestore only, no file moves

### **3.3. Enhanced Image Object Structure**

The `listings` collection now stores **rich image objects** (not plain URL strings):

```typescript
{
  id: "listing789",
  ownerUid: "abc123uid",
  businessName: "Sample Business",
  
  // Enhanced images array with metadata
  images: [
    {
      url: "https://storage.googleapis.com/.../0_storefront.jpg",
      filename: "storefront.jpg",
      size: 245000,              // bytes
      width: 1920,               // pixels (optional)
      height: 1080,              // pixels (optional)
      uploadedAt: Timestamp(...)
    },
    {
      url: "https://storage.googleapis.com/.../1_interior.jpg",
      filename: "interior.jpg",
      size: 182000,
      uploadedAt: Timestamp(...)
    }
  ],
  
  // Primary image tracking
  primaryImageIndex: 0,          // Points to first object in images[] array
  
  // Google Places photos (separate from custom uploads)
  photos: [
    "places/ChIJ.../photos/Aaw_E...",  // Photo references only, not stored in Storage
    "places/ChIJ.../photos/ATpl..."
  ]
}
```

**Backwards Compatibility**: Existing listings with `images: string[]` are supported. New listings use object format.

### **3.4. Image Upload Workflow**

**Step 1: Client-Side Selection (ImageUploadEnhanced component)**
1. User selects 1-20 images via file input or drag-drop
2. Client validates each file:
   - Format check: JPEG/PNG/WebP only
   - Size check: < 3MB per file
   - Count check: max 20 images
3. Display preview grid with:
   - Sequence numbers (1, 2, 3, ...)
   - Drag-drop reordering capability
   - Arrow buttons (↑↓) for manual reordering
   - "Set Primary" button with star icon
4. Store validated images in Zustand store (`createListingStore.uploadedImages`)

**Step 2: Listing Creation (POST /api/listings)**
1. Create listing document with status="creating"
2. Store Google Places data (placeId, name, address, etc.)
3. Validate postal code: must contain "493773" or "Dhamtari"
4. Return listingId to client

**Step 3: Image Upload (POST /api/upload-images)**
1. Receive FormData with:
   - images (File objects)
   - userId (Firebase Auth UID)
   - listingId (from step 2)
   - sequenceIndices (array of numbers: [0, 1, 2, ...])
   - primaryImageId (optional, identifies primary image)
2. For each image:
   - Generate path: `/images/{userId}/{listingId}/{sequenceIndex}_{filename}`
   - Upload to Firebase Storage with metadata:
     ```javascript
     {
       uploadedBy: userId,
       uploadedAt: new Date().toISOString(),
       listingId: listingId,
       sequenceIndex: index,
       isPrimary: (imageId === primaryImageId),
       originalFilename: file.originalname
     }
     ```
   - Get public CDN URL
   - Track upload progress (0-100%) per file
3. Return structured response:
   ```javascript
   {
     success: true,
     images: [
       { url: "https://...", sequenceIndex: 0, filename: "storefront.jpg", size: 245000 },
       { url: "https://...", sequenceIndex: 1, filename: "interior.jpg", size: 182000 }
     ]
   }
   ```

**Step 4: Finalize Listing**
1. Update listing document:
   ```javascript
   await db.collection("listings").doc(listingId).update({
     images: uploadResponse.images,
     primaryImageIndex: primaryImageId ? findIndex(primaryImageId) : 0,
     status: "active",
     updatedAt: FieldValue.serverTimestamp()
   })
   ```
2. Create search index entry via `safeCreateSearchIndex()`
3. Create analytics document via `safeCreateListingStats()`
4. Redirect user to `/user/my-listings`

### **3.5. Image Security Rules**

Firebase Storage security rules enforce ownership and file constraints:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read for all images (directory is public)
    match /images/{allPaths=**} {
      allow read: if true;
    }
    
    // Authenticated write with validation
    match /images/{userId}/{listingId}/{fileName} {
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 3 * 1024 * 1024  // 3MB max
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }
  }
}
```

### **3.6. Image Reordering & Primary Selection**

**Reordering Process**:
1. User drags image from position 3 to position 1
2. Client updates local state: `images.splice(1, 0, images.splice(3, 1)[0])`
3. Client updates Firestore **only**:
   ```javascript
   await db.collection("listings").doc(listingId).update({
     images: reorderedImagesArray,
     updatedAt: FieldValue.serverTimestamp()
   })
   ```
4. **No file renames or moves in Storage** (sequenceIndex in filename becomes a snapshot)

**Primary Image Selection**:
1. User clicks "Set Primary" on image 3
2. Client updates Firestore:
   ```javascript
   await db.collection("listings").doc(listingId).update({
     primaryImageIndex: 3,  // Now image 3 is primary
     updatedAt: FieldValue.serverTimestamp()
   })
   ```
3. UI shows star badge on newly selected primary image

**Why This Works**:
- Firestore `images[]` array is source of truth for display order
- Storage filenames preserve original upload order (immutable)
- Reordering is instant (no file I/O)
- Primary selection is metadata-only change

### **3.7. Google Places Photos Handling**

**Critical Separation**: Google Places photos are **NOT** stored in Firebase Storage.

**Storage Pattern**:
```typescript
{
  // Custom user uploads (Firebase Storage)
  images: [
    { url: "https://firebasestorage.googleapis.com/.../0_photo.jpg", ... }
  ],
  
  // Google Places photos (reference-only)
  photos: [
    "places/ChIJ.../photos/Aaw_E...",
    "places/ChIJ.../photos/ATpl..."
  ]
}
```

**Display Implementation**:
```tsx
{/* Custom uploads - optimized */}
<Image src={listing.images[0].url} width={400} height={300} alt="Business" />

{/* Google Places photos - unoptimized (API proxy) */}
<Image 
  src={`/api/google-places/photo?name=${photoReference}`} 
  unoptimized 
  width={400} 
  height={300} 
  alt="Business" 
/>
```

**Why `unoptimized`**: 
- Google Places API URLs contain query strings not configured in `images.localPatterns`
- Images already optimized by Google's CDN
- Prevents Next.js 15+ warnings

### **3.8. Image Cleanup & Management**

**On Listing Deletion**:
```javascript
// Delete all images in folder
const folderPath = `images/${userId}/${listingId}/`;
const files = await storage.bucket().getFiles({ prefix: folderPath });
await Promise.all(files[0].map(file => file.delete()));

// Delete Firestore document
await db.collection("listings").doc(listingId).delete();
```

**On Image Removal** (partial delete):
```javascript
// Remove from Firestore
const updatedImages = listing.images.filter((_, i) => i !== removedIndex);
await db.collection("listings").doc(listingId).update({ images: updatedImages });

// Delete from Storage
await storage.bucket().file(imageStoragePath).delete();
```

**Orphaned Images Cleanup** (scheduled job):
```javascript
// Run weekly via Cloud Scheduler
exports.cleanupOrphanedImages = functions.pubsub
  .schedule('every sunday 03:00')
  .onRun(async () => {
    const allImages = await storage.bucket().getFiles({ prefix: 'images/' });
    const allListings = await db.collection("listings").get();
    
    // Compare and delete unreferenced images
    // (Implementation details omitted for brevity)
  });
```

### **3.9. Performance & CDN Optimization**

**Benefits of Current Architecture**:
- ✅ Firestore documents stay lean (< 100KB each with metadata)
- ✅ Firebase Storage provides automatic global CDN
- ✅ Images cached at edge locations (low latency)
- ✅ No bandwidth costs for Firestore reads
- ✅ Parallel uploads (up to 6 concurrent via HTTP/2)

**Image Display Optimization**:
```tsx
// Next.js Image component with responsive sizing
<Image
  src={listing.images[0].url}
  alt={listing.businessName}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

**Upload Progress Tracking**:
- Client displays circular progress indicators (0-100%) per image
- Uses Firebase Storage `uploadBytesResumable()` with progress callbacks
- Shows overall progress: "Uploading 3 of 5 images..."

This enhanced architecture provides production-grade media management with user-friendly reordering, primary selection, and robust error handling.