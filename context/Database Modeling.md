# **Database Modeling**

Version: 9.0 (Final & Hyper-Optimized Architecture)  
Purpose: Defines the definitive, scalable Firestore architecture. This model uses an aggregated, sharded, and denormalized index to unify search and analytics, and moves static data to the local codebase to maximize performance and minimize cost.

## **1\. Core Dynamic Collections**

The final architecture relies on only **four essential, dynamic collections**.

### **1.1. Collection: listings**

The lean source of truth for core provider data. Contains no search or aggregated analytics fields.

* **Document ID**: auto-generated  
* **Fields**:  
  * ownerUid (string)  
  * businessName (string)  
  * categorySlug (string) \- *References a slug in the local /config/directory.ts file.*  
  * isPublic (boolean)  
  * address (map)  
  * googleData (map)  
  * monetization (map) \- *The planId within this map references a plan in /config/directory.ts.*  
  * createdAt (timestamp)

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