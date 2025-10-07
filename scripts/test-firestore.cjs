#!/usr/bin/env node

/**
 * Firebase Firestore Diagnostic Script
 * Tests Firebase Admin SDK and Firestore connectivity
 * 
 * Run: node scripts/test-firestore.js
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

console.log('🔍 Firebase Firestore Diagnostic Tool\n')
console.log('=' .repeat(60))

// Step 1: Check service account file
console.log('\n📁 Step 1: Checking service account file...')
const jsonPath = path.resolve(process.cwd(), 'dhamtaridirectory-firebase-adminsdk-fbsvc-f4c6eabb2e.json')

if (!fs.existsSync(jsonPath)) {
    console.error('❌ Service account JSON not found!')
    console.error(`   Expected path: ${jsonPath}`)
    process.exit(1)
}

console.log('✅ Service account JSON found')

// Step 2: Initialize Firebase Admin
console.log('\n🔧 Step 2: Initializing Firebase Admin SDK...')
try {
    const serviceAccount = require(jsonPath)
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    })
    
    console.log('✅ Firebase Admin initialized')
    console.log(`   Project ID: ${serviceAccount.project_id}`)
    console.log(`   Client Email: ${serviceAccount.client_email}`)
} catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:')
    console.error(`   ${err.message}`)
    process.exit(1)
}

// Step 3: Test Firestore connection
console.log('\n🔥 Step 3: Testing Firestore connection...')

async function testFirestore() {
    try {
        const db = admin.firestore()
        console.log('✅ Firestore instance obtained')
        
        // Try to get a non-existent collection (should NOT throw NOT_FOUND)
        console.log('\n📖 Step 4: Testing read operation...')
        const testRef = db.collection('_diagnostic_test').doc('test')
        const testSnap = await testRef.get()
        
        console.log('✅ Read operation successful')
        console.log(`   Document exists: ${testSnap.exists}`)
        
        // Try to write a test document
        console.log('\n✍️  Step 5: Testing write operation...')
        const writeTestRef = db.collection('_diagnostic_test').doc('test_' + Date.now())
        await writeTestRef.set({
            test: true,
            timestamp: Date.now(),
            message: 'Diagnostic test document'
        })
        
        console.log('✅ Write operation successful')
        console.log(`   Document ID: ${writeTestRef.id}`)
        
        // Clean up
        console.log('\n🧹 Step 6: Cleaning up test document...')
        await writeTestRef.delete()
        console.log('✅ Test document deleted')
        
        console.log('\n' + '='.repeat(60))
        console.log('🎉 SUCCESS! Firestore is working correctly!')
        console.log('='.repeat(60))
        console.log('\n✅ Your Firebase project has Firestore enabled')
        console.log('✅ Firebase Admin SDK is configured correctly')
        console.log('✅ You can create and delete documents')
        console.log('\nThe listing creation issue must be something else.')
        console.log('Check the API route for other potential errors.\n')
        
    } catch (err) {
        console.error('\n' + '='.repeat(60))
        console.error('❌ FIRESTORE ERROR DETECTED!')
        console.error('='.repeat(60))
        
        if (err.code === 5 || err.message?.includes('NOT_FOUND') || err.message?.includes('not found')) {
            console.error('\n🚨 ERROR: Firestore database NOT enabled!\n')
            console.error('This error means your Firebase project does NOT have Firestore enabled.')
            console.error('\nSOLUTION:')
            console.error('1. Go to: https://console.firebase.google.com/project/dhamtaridirectory')
            console.error('2. Click "Firestore Database" in the left sidebar')
            console.error('3. If you see "Create database" button, click it:')
            console.error('   - Choose "Production mode"')
            console.error('   - Select region: "asia-south1" (Mumbai) for India')
            console.error('   - Click "Enable"')
            console.error('\n4. Wait for database creation (usually takes 1-2 minutes)')
            console.error('5. Re-run this script to verify')
        } else {
            console.error('\n❌ Unexpected error:')
            console.error(`   Code: ${err.code}`)
            console.error(`   Message: ${err.message}`)
            console.error(`   Details: ${JSON.stringify(err.details || 'No details', null, 2)}`)
        }
        
        console.error('\n' + '='.repeat(60) + '\n')
        process.exit(1)
    }
}

testFirestore()
