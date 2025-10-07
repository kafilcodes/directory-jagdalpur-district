#!/usr/bin/env node

/**
 * DEEP Firebase Firestore Diagnostic
 * Tests actual listing creation workflow
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

console.log('🔬 DEEP Firestore Diagnostic - Testing Actual Listing Creation\n')
console.log('='.repeat(70))

// Initialize
const jsonPath = path.resolve(process.cwd(), 'dhamtaridirectory-firebase-adminsdk-fbsvc-f4c6eabb2e.json')
const serviceAccount = require(jsonPath)

console.log('\n📋 Configuration:')
console.log(`   Project ID: ${serviceAccount.project_id}`)
console.log(`   Client Email: ${serviceAccount.client_email}`)
console.log(`   Private Key ID: ${serviceAccount.private_key_id}`)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
})

// CRITICAL: Set custom database ID (default is "(default)")
const databaseId = 'dhamtaridirectory' // Your custom database ID
const db = admin.firestore()
db.settings({
    ignoreUndefinedProperties: true,
    databaseId: databaseId
})

console.log('✅ Firebase Admin initialized')
console.log(`   Database ID: ${databaseId}`)

async function testListingCreation() {
    try {
        // Test 1: Read existing collections
        console.log('\n' + '='.repeat(70))
        console.log('TEST 1: Reading Existing Collections')
        console.log('='.repeat(70))

        const collections = await db.listCollections()
        console.log(`\n✅ Found ${collections.length} collections:`)
        collections.forEach(col => console.log(`   - ${col.id}`))

        // Test 2: Try to read from listings collection
        console.log('\n' + '='.repeat(70))
        console.log('TEST 2: Reading from "listings" collection')
        console.log('='.repeat(70))

        const listingsSnapshot = await db.collection('listings').limit(1).get()
        console.log(`✅ Successfully queried listings collection`)
        console.log(`   Documents found: ${listingsSnapshot.size}`)

        // Test 3: Try to CREATE a test listing document (the actual issue)
        console.log('\n' + '='.repeat(70))
        console.log('TEST 3: Creating a test listing document')
        console.log('='.repeat(70))

        const testListingId = 'test_diagnostic_' + Date.now()
        const testData = {
            id: testListingId,
            name: 'Test Diagnostic Listing',
            category: 'test',
            address: 'Test Address',
            status: 'active',
            createdAt: Date.now(),
            test: true
        }

        console.log(`\n📝 Attempting to create document: listings/${testListingId}`)
        console.log(`   Data:`, JSON.stringify(testData, null, 2))

        const ref = db.collection('listings').doc(testListingId)
        await ref.set(testData)

        console.log(`\n✅ SUCCESS! Document created: listings/${testListingId}`)

        // Test 4: Verify the document exists
        console.log('\n' + '='.repeat(70))
        console.log('TEST 4: Verifying document was created')
        console.log('='.repeat(70))

        const verifySnap = await ref.get()
        if (verifySnap.exists) {
            console.log('✅ Document verified exists')
            console.log('   Data:', JSON.stringify(verifySnap.data(), null, 2))
        } else {
            console.log('❌ Document was not found after creation!')
        }

        // Test 5: Clean up
        console.log('\n' + '='.repeat(70))
        console.log('TEST 5: Cleaning up test document')
        console.log('='.repeat(70))

        await ref.delete()
        console.log('✅ Test document deleted')

        // SUCCESS
        console.log('\n' + '='.repeat(70))
        console.log('🎉 ALL TESTS PASSED!')
        console.log('='.repeat(70))
        console.log('\n✅ Firestore is working correctly')
        console.log('✅ Firebase Admin SDK has proper permissions')
        console.log('✅ Can create documents in "listings" collection')
        console.log('\n⚠️  If listing creation still fails in your app, the issue is in:')
        console.log('    - API route code (/app/api/listings/route.ts)')
        console.log('    - Data validation (Zod schema)')
        console.log('    - Or other application logic')
        console.log('\nThe Firebase/Firestore setup itself is CORRECT.\n')

        process.exit(0)

    } catch (error) {
        console.error('\n' + '='.repeat(70))
        console.error('❌ TEST FAILED!')
        console.error('='.repeat(70))
        console.error('\n🚨 Error Details:')
        console.error(`   Code: ${error.code}`)
        console.error(`   Message: ${error.message}`)

        if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
            console.error('\n💡 DIAGNOSIS: NOT_FOUND Error (Code 5)')
            console.error('\nPossible causes:')
            console.error('1. Firestore database ID mismatch')
            console.error('2. Service account lacks Firestore permissions')
            console.error('3. Firestore API not enabled in project')
            console.error('\n🔧 SOLUTIONS:')
            console.error('\n1. Check Firebase Console:')
            console.error('   https://console.firebase.google.com/project/dhamtaridirectory/firestore')
            console.error('   - Verify Firestore is enabled')
            console.error('   - Check database ID (should be "(default)")')
            console.error('\n2. Check Service Account Permissions:')
            console.error('   https://console.firebase.google.com/project/dhamtaridirectory/settings/serviceaccounts/adminsdk')
            console.error('   - Role should be: "Firebase Admin SDK Administrator Service Agent"')
            console.error('   - Or: "Cloud Datastore User" + "Firebase Admin"')
            console.error('\n3. Enable Firestore API:')
            console.error('   https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=dhamtaridirectory')
            console.error('   - Click "ENABLE" if not already enabled')
        } else if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
            console.error('\n💡 DIAGNOSIS: Permission Denied (Code 7)')
            console.error('\nThe service account lacks permissions.')
            console.error('\n🔧 SOLUTION:')
            console.error('Go to: https://console.firebase.google.com/project/dhamtaridirectory/settings/serviceaccounts/adminsdk')
            console.error('Generate a NEW service account key with proper permissions')
        } else {
            console.error('\n💡 Unexpected error. Full details:')
            console.error(error)
        }

        console.error('\n' + '='.repeat(70) + '\n')
        process.exit(1)
    }
}

testListingCreation()
