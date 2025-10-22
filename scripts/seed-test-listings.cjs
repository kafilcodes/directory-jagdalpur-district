#!/usr/bin/env node

/**
 * Seed Test Listings for Search Page
 * Creates 15 test listings with approved=true and status='active'
 */

const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

console.log('🌱 Seeding Test Listings for Search Page\n')

// Initialize Firebase Admin
const jsonPath = path.resolve(process.cwd(), 'dhamtaridirectory-firebase-adminsdk-fbsvc-f4c6eabb2e.json')
const serviceAccount = require(jsonPath)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
})

const db = admin.firestore()

// CRITICAL: Set database ID from environment variable
const databaseId = process.env.FIREBASE_DATABASE_ID
if (!databaseId) {
    console.error('❌ ERROR: FIREBASE_DATABASE_ID environment variable is required')
    console.error('Please set it in .env.local file')
    process.exit(1)
}

db.settings({
    ignoreUndefinedProperties: true,
    databaseId: databaseId,
})

console.log(`📊 Using Firestore database: ${databaseId}\n`)
const now = Date.now()

// Test listings with various categories
const testListings = [
    { name: "Sharma Restaurant", categorySlug: "restaurants", category: "Restaurants", address: "Main Road, Dhamtari", rating: 4.5, phone: "+91 9876543210" },
    { name: "City Medical Store", categorySlug: "pharmacy", category: "Pharmacies", address: "Station Road, Dhamtari", rating: 4.2, phone: "+91 9876543211" },
    { name: "Gupta Electronics", categorySlug: "electronics", category: "Electronics Shops", address: "Market Square, Dhamtari", rating: 4.0, phone: "+91 9876543212" },
    { name: "Golden Fitness Gym", categorySlug: "gyms", category: "Gyms & Fitness", address: "Ring Road, Dhamtari", rating: 4.7, phone: "+91 9876543213" },
    { name: "Dr. Patel Clinic", categorySlug: "healthcare", category: "Healthcare", address: "Civil Lines, Dhamtari", rating: 4.8, phone: "+91 9876543214" },
    { name: "New Fashion Boutique", categorySlug: "shopping", category: "Shopping", address: "Gandhi Chowk, Dhamtari", rating: 4.3, phone: "+91 9876543215" },
    { name: "Quick Cab Services", categorySlug: "transport", category: "Transport", address: "Bus Stand, Dhamtari", rating: 4.1, phone: "+91 9876543216" },
    { name: "Sunshine Hotel", categorySlug: "hotels", category: "Hotels", address: "Highway Road, Dhamtari", rating: 4.6, phone: "+91 9876543217" },
    { name: "Smart Coaching Classes", categorySlug: "education", category: "Education", address: "School Road, Dhamtari", rating: 4.9, phone: "+91 9876543218" },
    { name: "Fresh Grocery Mart", categorySlug: "grocery", category: "Food & Grocery", address: "Nehru Nagar, Dhamtari", rating: 4.4, phone: "+91 9876543219" },
    { name: "Beauty Parlour & Spa", categorySlug: "beauty", category: "Beauty & Spa", address: "Market Road, Dhamtari", rating: 4.5, phone: "+91 9876543220" },
    { name: "Kumar Hardware Store", categorySlug: "home", category: "Home Services", address: "Industrial Area, Dhamtari", rating: 4.0, phone: "+91 9876543221" },
    { name: "Kids Play Zone", categorySlug: "entertainment", category: "Entertainment", address: "Mall Road, Dhamtari", rating: 4.7, phone: "+91 9876543222" },
    { name: "Real Estate Agency", categorySlug: "realestate", category: "Real Estate", address: "Main Chowk, Dhamtari", rating: 4.2, phone: "+91 9876543223" },
    { name: "Auto Repair Workshop", categorySlug: "automotive", category: "Automotive", address: "Service Road, Dhamtari", rating: 4.3, phone: "+91 9876543224" },
]

async function seedListings() {
    try {
        console.log('📝 Creating test listings...\n')

        const batch = db.batch()

        testListings.forEach((listing, index) => {
            const id = `test-listing-${index + 1}-${Date.now()}`
            const ref = db.collection('listings').doc(id)

            const listingData = {
                id,
                name: listing.name,
                businessName: listing.name,
                categorySlug: listing.categorySlug,
                category: listing.category,
                address: listing.address,
                phone: listing.phone,
                description: `A trusted ${listing.category.toLowerCase()} in Dhamtari.`,
                email: `${listing.categorySlug}@example.com`,
                website: `https://example.com/${listing.categorySlug}`,

                // Critical fields for search API
                approved: true,
                status: 'active',

                // Timestamps
                createdAt: now - (index * 3600000), // Stagger by 1 hour each
                updatedAt: now,

                // Stats
                rating: listing.rating,
                views: Math.floor(Math.random() * 1000),
                clicks: Math.floor(Math.random() * 100),

                // Plan
                plan: index % 3 === 0 ? 'sponsored' : 'free',

                // Media
                photos: [],
                images: [],
                thumbnail: '',
                googlePhotos: [],

                // Location
                city: 'Dhamtari',
                state: 'Chhattisgarh',
                location: null,

                // Additional
                isPublic: true,
                tags: [listing.category, 'Dhamtari', listing.categorySlug],
            }

            batch.set(ref, listingData)
            console.log(`✅ ${index + 1}. ${listing.name} (${listing.category})`)
        })

        await batch.commit()

        console.log(`\n🎉 Successfully seeded ${testListings.length} test listings!`)
        console.log('\n📊 Summary:')
        console.log(`   - All listings have: approved=true, status='active'`)
        console.log(`   - Timestamps staggered for proper sorting`)
        console.log(`   - Mix of sponsored (${testListings.filter((_, i) => i % 3 === 0).length}) and free plans`)
        console.log('\n✅ You can now test the search page at: http://localhost:3000/search')
        console.log('\n')

    } catch (error) {
        console.error('❌ Error seeding listings:', error)
        process.exit(1)
    } finally {
        process.exit(0)
    }
}

seedListings()
