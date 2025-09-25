# **Project Requirements Document (PRD): Dhamtari Business Directory**

Version: 9.0 (Final Architecture)  
Date: 2025-09-25

## **1\. Objective**

To create the definitive, modern, and high-performance digital directory for the city of Dhamtari. The platform will serve as a public utility to connect residents with local businesses and service providers, support the local economy through enhanced visibility, and generate revenue through featured listings, banner ads, and provider analytics.

## **2\. Target Audience**

* **Public Users**: Residents and visitors of Dhamtari seeking local businesses, gig workers, and service providers.  
* **Providers**: Local business owners and individual service providers (e.g., plumbers, electricians, tutors) in Dhamtari who want to list their services to reach a targeted local audience.

## **3\. Core Features & Functionality**

### **3.1. Public User Features**

* **Dynamic Homepage**: A clean, modern landing page featuring a prominent hero-section search bar. The page will also include sections for "Featured Providers," "Popular Categories," and dynamically updated search results displayed as cards.  
* **Hyper-Optimized Search**: Users can search for providers by name, category, or service. The search will be near-instantaneous, typo-tolerant (basic), and ranked by a combination of relevance and popularity.  
* **Side-Sheet Details**: Clicking on a search result card will open a non-intrusive side-sheet from the right, displaying the provider's full details without navigating away from the search results.  
* **Dedicated Search Page (/search)**: A full-page search experience with more advanced filtering options (e.g., filter by category, open now).  
* **Ad Placements**: Strategically placed, unobtrusive ad slots for monetization via Google Ads and direct banner sales.

### **3.2. Provider Features (Dashboard)**

* **Auth & Onboarding**: Secure registration and login for providers. A simple multi-step process for submitting their listing for approval.  
* **Listing Management**: A dashboard for providers to view and edit their active listings.  
* **Analytics Dashboard**: A dedicated page showing key performance statistics for their listing, including:  
  * Total impressions (how many times they appeared in search results).  
  * Total clicks (how many times their detail sheet was opened).  
  * A list of the top keywords that led users to their listing.  
* **Monetization**: Options to purchase "Featured Listing" plans to appear on the homepage.

## **4\. Technical Stack & Architecture**

* **Framework**: Next.js (Latest Stable Version, App Router)  
* **Styling**: Tailwind CSS with shadcn/ui and Aceternity UI.  
* **Backend & Database**: Firebase (Firestore)  
* **Architecture**: "Aggregated Sharded Index with Denormalized Analytics" for hyper-optimized, low-cost search and analytics.  
* **Deployment**: Vercel