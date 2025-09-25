# **Design System & Principles**

Version: 9.0  
Purpose: This document defines the comprehensive visual design system for the Dhamtari Directory project, inspired by modern, clean, and user-friendly directory platforms.

## **1\. Design Philosophy**

The design is guided by four core principles:

1. **Clarity First**: The UI must be intuitive and easy to navigate. Every element must have a clear purpose, eliminating ambiguity.  
2. **Modern & Minimalist**: We will use generous white space, clean lines, and a focused color palette to create a professional and uncluttered aesthetic.  
3. **Trustworthy & Professional**: The design will inspire confidence. This is achieved through consistency, high-quality typography, and a polished user experience.  
4. **Content-Focused**: The design's primary role is to showcase the listings and services effectively. The UI elements support the content, never overshadow it.

## **2\. Color Palette**

The color scheme is intentionally limited to create a calm, focused experience.

| Role | Name | Hex | Tailwind Class | Usage |
| :---- | :---- | :---- | :---- | :---- |
| **Primary** | Accent Red | \#EF4444 | red-500 | Primary buttons, active links, highlights |
| **Text** | Main Text | \#1F2937 | gray-800 | Headings and primary body text |
| **Text** | Muted Text | \#6B7280 | gray-500 | Secondary text, labels, placeholders |
| **Background** | Main BG | \#F9FAFB | gray-50 | Main page background |
| **Background** | Card BG | \#FFFFFF | white | Cards, modals, slide-out sheets |
| **Borders** | Border | \#E5E7EB | gray-200 | Card borders, dividers, inputs |
| **Feedback** | Success | \#10B981 | emerald-500 | Success messages, validation |

## **3\. Typography**

We will use the **Inter** font family for its excellent readability on screens.

| Element | Font Weight | Font Size (Tailwind) | Line Height |
| :---- | :---- | :---- | :---- |
| **Heading 1** | Bold | text-4xl / text-5xl | Tight |
| **Heading 2** | Bold | text-2xl / text-3xl | Tight |
| **Heading 3** | Semibold | text-xl | Normal |
| **Body Text** | Regular | text-base | Relaxed |
| **Labels/Small** | Medium | text-sm | Normal |

## **4\. Layout & Spacing**

* **8-Point Grid System**: All spacing (margins, padding, gaps) and sizing must be a multiple of 8px. This is enforced via Tailwind's default spacing scale.  
* **Mobile-First**: All layouts will be designed for mobile first, then adapted for larger screens using Tailwind's responsive prefixes (sm:, md:, lg:).  
* **Contained Width**: The main content area will have a maximum width and be centered on the page to ensure readability on large screens.

## **5\. Global CSS (/app/globals.css)**

The following CSS will be added to the global stylesheet to set up the base theme and apply custom styles for shadcn/ui components, ensuring a consistent look and feel.

@tailwind base;  
@tailwind components;  
@tailwind utilities;

@layer base {  
  :root {  
    \--background: 0 0% 100%; /\* \#FFFFFF \*/  
    \--foreground: 222.2 84% 4.9%; /\* \#1F2937 \*/

    \--card: 0 0% 100%;  
    \--card-foreground: 222.2 84% 4.9%;

    \--popover: 0 0% 100%;  
    \--popover-foreground: 222.2 84% 4.9%;

    \--primary: 346.8 77.2% 49.8%; /\* \#EF4444 \*/  
    \--primary-foreground: 355.7 100% 97.3%;

    \--muted: 210 40% 96.1%; /\* \#F1F5F9 \*/  
    \--muted-foreground: 215.4 16.3% 46.9%; /\* \#6B7280 \*/

    \--accent: 210 40% 96.1%;  
    \--accent-foreground: 222.2 47.4% 11.2%;

    \--border: 214.3 31.8% 91.4%; /\* \#E5E7EB \*/  
    \--input: 214.3 31.8% 91.4%;

    \--ring: 222.2 84% 4.9%;

    \--radius: 0.5rem; /\* Default border radius for components \*/  
  }

  body {  
    @apply bg-gray-50 text-gray-800;  
    font-family: 'Inter', sans-serif;  
  }  
}  
