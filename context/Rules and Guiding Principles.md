# **Rules and Guiding Principles**

Version: 9.0  
Canonical Document: All development must adhere to these principles without exception.

## **1\. Architecture & Modularity**

* **Feature-Based Structure**: The /app directory will be organized by features/routes.  
* **Server Components by Default**: The "use client" directive is only for components requiring client-side interactivity.  
* **Utility-First Modularity**: Shared logic, hooks, types, etc., must be in top-level directories (/lib, /hooks).  
* **API Cost Control**: All Google Places API calls **must** be proxied and aggressively cached.
* **Server Components by Default: Client-side interactivity ("use client") is an optimization, not a default. All components will be Server Components unless state or event listeners are required.

* **Minimize Database Operations: The entire application architecture is designed to minimize Firebase reads and writes. All high-frequency operations, especially search, must adhere to the "single read per search word" principle.

* **Asynchronous Analytics: All analytics tracking (impressions, clicks) must be handled asynchronously using a "fire-and-forget" pattern that does not block the UI or slow down the user's experience.

* **Local-First Configuration: All static configuration data (filter options, category lists, ad placement rules) must be stored locally in the codebase, not in Firebase, to avoid unnecessary database calls.

## **2\. UI/UX & Design Philosophy**

* **UI Kit Mandate**: All UI will be built with **shadcn/ui**. **Aceternity UI** for high-impact animations.  
* **Loading States**: All data-fetching components **must** use **shimmer/skeleton loaders**.  
* **Typography & Grid System**: **Inter** font and a strict **8-point grid system** are mandatory.  
* **Mobile-First Mandate**: Styles must be written for mobile screens first.

## **3\. Performance & SEO**

* **Rendering Strategy**: Homepage (SSR), Static Pages (SSG), Listing Detail Pages (ISR) for SEO.  
* **Image Optimization**: The Next.js \<Image\> component is mandatory.  
* **Metadata & Structured Data**: Mandatory for all listing pages to maximize SEO.

## **4\. Analytics & Tracking**

* **Asynchronous Event Logging**: All tracking events must be "fire-and-forget" to avoid blocking the UI.  
* **Decoupled Analytics Data**: Raw events are written to a separate collection and aggregated in the background by a Cloud Function.

## **5\. Advertising & Performance**

* **Performance is Paramount**: Ads **must not** degrade Core Web Vitals. Specifically, they must not cause Cumulative Layout Shift (CLS).  
* **Asynchronous Loading**: Ad scripts (e.g., Google AdSense) **must** be loaded asynchronously using the Next.js Script component with a lazyOnload strategy.  
* **Dedicated Ad Components**: All ad units will be encapsulated in their own React components. These components will be responsible for loading the ad script and handling viewability.  
* **Fixed Ad Slot Dimensions**: To prevent layout shift, all ad slots **must** have a defined min-height styled via Tailwind CSS, which acts as a placeholder before the ad content loads.  
* **Non-Intrusive Placement**: Ads should be clearly distinguishable from organic content and placed in a way that does not disrupt the primary user journey.

## **6\. State Management & Error Handling**

* **Minimal Client-Side State**: Use URL state for search. **Zustand** is approved for complex client state.  
* **Error Boundaries & Validation**: A root error.tsx and **Zod** for validation are mandatory.