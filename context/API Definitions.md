# **API Definitions (Server Actions & API Routes)**

Version: 9.0 (Final Architecture)  
Purpose: Outlines the key server-side endpoints for the hyper-optimized search and analytics architecture.

## **1\. Server Actions (/app/.../actions.ts)**

### **searchListings(searchTerm: string)**

* **Purpose**: Performs a search ranked by both static relevance and real-time popularity.  
* **Cost**: **1 document read** per search term word. (e.g., "pizza place" \= 2 reads). This is the lowest possible cost for this level of functionality.  
* **Logic**:  
  1. Sanitizes and splits the searchTerm into unique words.  
  2. Determines the correct shard(s) to query (e.g., "pizza", "place" \-\> index\_p).  
  3. Reads the required shard document(s) in parallel.  
  4. In memory, merges the results and calculates a **dynamic relevance score** for each listing: finalScore \= staticScore \+ (impressions \* popularityBoost) \+ (clicks \* engagementBoost).  
  5. Sorts the results by finalScore.  
  6. Returns the top-ranked results, including the denormalized name and cat for instant UI rendering.  
  7. **Asynchronously (fire-and-forget)**, triggers a batched write to increment the imp (impression) counter for the returned listings within their respective shard documents.

### **trackClick({ listingId: string, searchTerm: string })**

* **Purpose**: Tracks a user click on a listing.  
* **Cost**: **1 batched document write**.  
* **Logic**:  
  1. Receives listingId and the original searchTerm.  
  2. Determines the correct shard document(s).  
  3. Uses a batched write to increment the clk (click) counter for that listing under each relevant keyword.

### **submitListing(formData: FormData)**

* **Purpose**: Integrates new/updated listings into the search index.  
* **Logic**:  
  1. Writes core data to the listings collection.  
  2. Generates the weighted search keywords and initial data (score, imp:0, clk:0).  
  3. Uses a **Firestore Transaction** for each affected shard to safely read the shard, merge the new listing's search data, and write the shard back.

## **2\. API Routes (/app/api/.../route.ts)**

### **/api/aggregate-stats**

* **Purpose**: A secure endpoint to aggregate raw stats from the search collection into the listingStats collection for fast dashboard reads.  
* **Trigger**: Must be triggered periodically by an external cron job service (e.g., GitHub Actions schedule, Vercel Cron Jobs). This replaces the need for Firebase Functions.  
* **Logic**:  
  1. Reads all documents in the search collection.  
  2. Aggregates the raw imp and clk data for each unique listingId.  
  3. Writes the final summary to the corresponding document in the listingStats collection.