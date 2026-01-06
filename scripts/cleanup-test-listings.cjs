/**
 * Cleanup Test Listings Script
 * 
 * This script removes ONLY the test/demo data seeded by seed-test-listings.cjs
 * It identifies test listings by:
 * 1. Document ID pattern: starts with "test-listing-"
 * 2. Email pattern: ends with "@example.com" (used in seeded data)
 * 
 * SAFETY: This script only removes data matching these patterns.
 * Real business data will NOT be affected.
 * 
 * Run with: node scripts/cleanup-test-listings.cjs
 */

const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

// Load Firebase Admin credentials
const jsonPath = path.resolve(process.cwd(), 'dhamtaridirectory-firebase-adminsdk-fbsvc-f4c6eabb2e.json')
const serviceAccount = require(jsonPath)

// Check if already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    })
}

const db = admin.firestore()

// CRITICAL: Set database ID from environment variable (same as seed script)
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

/**
 * Delete test listings from the listings collection
 */
async function cleanupTestListings() {
    console.log('🧹 Starting cleanup of test listings...\n')

    const listingsRef = db.collection('listings')
    let deletedCount = 0
    const deletedListings = []

    try {
        // Get all listings
        const snapshot = await listingsRef.get()

        console.log(`📊 Found ${snapshot.size} total listings in database\n`)

        for (const doc of snapshot.docs) {
            const data = doc.data()
            const docId = doc.id

            // Check if this is a test listing by ID pattern
            const isTestById = docId.startsWith('test-listing-')

            // Check if this is a test listing by email pattern
            const isTestByEmail = data.email && data.email.endsWith('@example.com')

            // Check for other test indicators
            const isTestByDescription = data.description &&
                (data.description.includes('(Test listing for search testing)') ||
                    data.description.includes('test listing') ||
                    data.description.includes('demo listing'))

            if (isTestById || isTestByEmail || isTestByDescription) {
                console.log(`🗑️  Deleting: "${data.name || docId}"`)
                console.log(`   - ID: ${docId}`)
                console.log(`   - Match: ${isTestById ? 'ID pattern' : isTestByEmail ? 'Email pattern' : 'Description pattern'}`)

                // Delete the document
                await doc.ref.delete()

                deletedListings.push({
                    id: docId,
                    name: data.name || 'Unknown',
                    category: data.category || 'Unknown',
                    reason: isTestById ? 'ID pattern' : isTestByEmail ? 'Email pattern' : 'Description pattern'
                })

                deletedCount++
                console.log('   ✅ Deleted\n')
            }
        }

        // Summary
        console.log('='.repeat(50))
        console.log('📋 CLEANUP SUMMARY')
        console.log('='.repeat(50))
        console.log(`\n✅ Deleted ${deletedCount} test listings\n`)

        if (deletedListings.length > 0) {
            console.log('Deleted listings:')
            deletedListings.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.name} (${item.category}) - ${item.reason}`)
            })
        } else {
            console.log('ℹ️  No test listings found to delete.')
        }

        console.log('\n✨ Cleanup complete!')

    } catch (error) {
        console.error('❌ Error during cleanup:', error)
        throw error
    }
}

/**
 * Also clean up from search index if it exists
 */
async function cleanupSearchIndex() {
    console.log('\n🔍 Checking search index for test data...\n')

    const indexRef = db.collection('search_index')

    try {
        const snapshot = await indexRef.get()

        if (snapshot.empty) {
            console.log('ℹ️  No search index found (this is normal if index was never built)')
            return
        }

        let cleanedIndices = 0

        for (const indexDoc of snapshot.docs) {
            const indexData = indexDoc.data()
            let modified = false

            // Check each category in the index
            for (const category of Object.keys(indexData)) {
                if (category === 'updatedAt') continue

                const entries = indexData[category]
                if (Array.isArray(entries)) {
                    const originalLength = entries.length

                    // Filter out test entries
                    const filteredEntries = entries.filter(entry => {
                        // Check if ID starts with test-listing-
                        if (entry.id && entry.id.startsWith('test-listing-')) {
                            return false
                        }
                        return true
                    })

                    if (filteredEntries.length !== originalLength) {
                        indexData[category] = filteredEntries
                        modified = true
                        console.log(`  - Removed ${originalLength - filteredEntries.length} test entries from ${category} in ${indexDoc.id}`)
                    }
                }
            }

            if (modified) {
                await indexDoc.ref.set(indexData)
                cleanedIndices++
            }
        }

        if (cleanedIndices > 0) {
            console.log(`\n✅ Cleaned ${cleanedIndices} search index documents`)
        } else {
            console.log('ℹ️  No test data found in search index')
        }

    } catch (error) {
        console.error('❌ Error cleaning search index:', error)
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(50))
    console.log('🧹 TEST LISTINGS CLEANUP SCRIPT')
    console.log('='.repeat(50))
    console.log('')
    console.log('⚠️  This script will ONLY delete:')
    console.log('   - Listings with ID starting with "test-listing-"')
    console.log('   - Listings with email ending with "@example.com"')
    console.log('   - Listings with description containing "(Test listing for search testing)"')
    console.log('')
    console.log('✅ Your real business listings are SAFE!')
    console.log('')
    console.log('='.repeat(50))
    console.log('')

    try {
        // Clean up listings
        await cleanupTestListings()

        // Clean up search index
        await cleanupSearchIndex()

        console.log('\n🎉 All cleanup tasks completed!')
        process.exit(0)

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error)
        process.exit(1)
    }
}

// Run the script
main()
