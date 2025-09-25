# **Database Modeling**

Version: 9.0 (Final Architecture)  
Purpose: Defines the hyper-optimized, scalable Firestore architecture using an aggregated, sharded, and denormalized index to unify search and analytics at the lowest possible cost.

## **1\. Core Collections**

### **1.1. Collection: listings**

The lean source of truth for core provider data. Contains no search or aggregated analytics fields.

* **Document ID**: auto-generated  
* **Fields**:  
  * ownerUid (string)  
  * businessName (string)  
  * categorySlug (string)  
  * isPublic (boolean)  
  * address (map)  
  * googleData (map)  
  * monetization (map)  
  * createdAt (timestamp)

### **1.2. Collection: search**

The heart of the system. This is a sharded index where each document represents a "shard" (e.g., index\_a for words starting with 'a'). It unifies search data with raw analytics counters.

* **Collection ID**: search  
* **Document IDs**: index\_a, index\_b, ..., index\_z, index\_other  
* **Fields (within each shard document)**:  
  * **index (map)**: A map where each key is a search term. The value is another map of listingIds to their unified search and analytics data.  
  * **lastUpdatedAt (timestamp)**

**Example structure for index\_p:**{  
  "index": {  
    "pizza": {  
      "listingId123": {  
        "score": 10,                 // Static relevance score  
        "name": "Nirmal Pizza Place",  // Denormalized for UI speed  
        "cat": "restaurants",        // Denormalized for UI speed  
        "imp": 1250,                 // Impressions counter  
        "clk": 85                    // Clicks counter  
      }  
    }  
  }  
}

### **1.3. Collection: listingStats (NEW)**

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

## **2\. Other Collections**

users, categories, and plans remain as previously defined.