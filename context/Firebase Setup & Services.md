# **Firebase Setup & Services**

Version: 9.0 (Final Architecture)  
Purpose: Defines the Firebase project setup, modular service architecture, and production-ready security rules.

## **1\. Firebase Configuration**

* **Environment Variables**: All Firebase SDK keys and sensitive credentials must be stored in .env.local and accessed via process.env. A .env.local.example file will be maintained in the repository.  
* **Initialization**: Firebase will be initialized in a central configuration file.  
  * **Admin SDK (Server-Side)**: For use in Server Actions and API Routes.  
  * **Client SDK (Client-Side)**: For client-side services like Authentication.

## **2\. Modular Service Architecture**

All direct Firebase SDK calls must be abstracted into utility functions located in /lib/firebase/. UI components should never directly import or call the Firebase SDK.

* /lib/firebase/config.ts: Exports initialized db, auth, storage instances.  
* /lib/firebase/firestoreService.ts: Contains functions for interacting with core data collections (e.g., getListingDetails(id)). This service will **not** contain search logic.  
* /lib/firebase/authService.ts: Wraps Firebase Authentication methods.

## **3\. Security Rules (Production-Ready)**

These rules are hardened for production and enforce the application's specific access patterns based on our final data model.

### **3.1. Firestore Rules (firestore.rules)**

rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {

    // Public data is readable by anyone.  
    match /listings/{listingId} {  
      allow read: if resource.data.isPublic \== true;  
      allow write: if request.auth \!= null && request.auth.uid \== resource.data.ownerUid;  
    }  
    match /categories/{categoryId} {  
      allow read: if true;  
      allow write: if false; // Admin only  
    }  
    match /plans/{planId} {  
        allow read: if true;  
        allow write: if false; // Admin only  
    }

    // Search index is publicly readable for search functionality.  
    // Writes are denied at the rule level; they MUST only be performed by trusted Server Actions.  
    match /search/{shardId} {  
        allow read: if true;  
        allow write: if false;  
    }

    // Listing stats are only readable by the owner of the corresponding listing.  
    // Writes are denied at the rule level; they MUST only be performed by the trusted aggregation job.  
    match /listingStats/{listingId} {  
        allow read: if request.auth \!= null && get(/databases/$(database)/documents/listings/$(listingId)).data.ownerUid \== request.auth.uid;  
        allow write: if false;  
    }

    // Users can only access their own document.  
    match /users/{userId} {  
      allow read, write: if request.auth \!= null && request.auth.uid \== userId;  
    }  
  }  
}

### **3.2. Firebase Storage Rules (storage.rules)**

rules\_version \= '2';  
service firebase.storage {  
  match /b/{bucket}/o {  
    // Anyone can read images.  
    match /images/{allPaths=\*\*} {  
      allow read: if true;  
    }  
    // Only authenticated users can upload into a folder matching their UID.  
    match /images/{userId}/{listingId}/{fileName} {  
      allow write: if request.auth \!= null && request.auth.uid \== userId;  
    }  
  }  
}  
