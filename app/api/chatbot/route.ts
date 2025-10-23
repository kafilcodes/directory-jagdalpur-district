import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import nlp from "compromise"
import { getAdminDb } from "@/lib/firebase/admin"

// Dynamic configuration
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dial Dhamtari";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "odhamtari@gmail.com";
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91-9340897799";
const OFFICE_ADDRESS = process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "NEAR CIVIL COURT RUDRI DISTRICT DHAMTARI C.G. 493776";

/**
 * Custom RAG (Retrieval-Augmented Generation) Chatbot API
 * 
 * Architectural Purpose:
 * This endpoint provides intelligent business search with comprehensive
 * multi-field matching and popularity-based ranking.
 * 
 * Flow:
 * 1. Query Breakdown: Extract multiple searchable terms from user input
 * 2. Multi-Field Search: Query listings and search collections simultaneously
 * 3. Smart Matching: Search across name, category, tags, description, contact fields
 * 4. Ranking: Sort by views (popularity) and return top 3
 * 5. Generation: Use Gemini to synthesize natural response with details
 * 
 * Security:
 * - No authentication required (public chatbot)
 * - Firebase Admin SDK for server-side database access
 * - Gemini API key stored in environment variables
 * 
 * Search Fields:
 * - name, category, categorySlug, tags[], description, website, phone, email
 */

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * Typo Correction Map
 * 
 * Common misspellings of business categories.
 * Automatically corrects user typos before search.
 */
const typoCorrections: { [key: string]: string } = {
    // Restaurant variations
    'restuarant': 'restaurant',
    'restraunt': 'restaurant',
    'resturant': 'restaurant',
    'restarant': 'restaurant',
    'restaurent': 'restaurant',
    'resteraunt': 'restaurant',
    'resaurant': 'restaurant',

    // Hotel variations
    'hotl': 'hotel',
    'hotell': 'hotel',
    'hotle': 'hotel',

    // Shop variations
    'shoop': 'shop',
    'shopp': 'shop',

    // Hospital variations
    'hospitl': 'hospital',
    'hospitel': 'hospital',
    'hospitol': 'hospital',

    // School variations
    'scool': 'school',
    'schol': 'school',
    'shool': 'school',

    // Pharmacy variations
    'farmacy': 'pharmacy',
    'pharmecy': 'pharmacy',
    'pharmcy': 'pharmacy',

    // Clinic variations
    'clinc': 'clinic',
    'klinic': 'clinic',

    // Cafe variations
    'caffe': 'cafe',
    'caffee': 'cafe',
    'coffe': 'coffee',
    'cofee': 'coffee',

    // General typos
    'servic': 'service',
    'servies': 'services',
    'shoping': 'shopping',
    'shoppng': 'shopping',
}

/**
 * Detect if message is asking for contact information
 * Returns true if user wants contact details
 */
function isContactQuery(message: string): boolean {
    const messageLower = message.toLowerCase().trim()

    const contactPatterns = [
        'contact', 'reach', 'get in touch', 'email', 'phone', 'call',
        'office', 'address', 'location', 'support', 'help desk',
        'customer service', 'reach out', 'contact you', 'contact us',
        'how to contact', 'where to contact', 'contact details',
        'contact info', 'contact information'
    ]

    return contactPatterns.some(pattern => messageLower.includes(pattern))
}

/**
 * Detect if message is asking how to list a business
 * Returns true if user wants to know how to add/list their business
 */
function isListingGuideQuery(message: string): boolean {
    const messageLower = message.toLowerCase().trim()

    const listingPatterns = [
        'how to list', 'how to add', 'list my business', 'add my business',
        'submit business', 'register business', 'add listing', 'create listing',
        'list business', 'add business', 'how do i list', 'how can i list',
        'steps to list', 'process to list', 'how to register'
    ]

    return listingPatterns.some(pattern => messageLower.includes(pattern))
}

/**
 * Detect if query is asking for multiple results (plural)
 * Returns true if user wants multiple options (e.g., "restaurants", "best hotels")
 */
function isRequestingMultipleResults(message: string): boolean {
    const messageLower = message.toLowerCase().trim()
    const doc = nlp(messageLower)

    // Check for plural nouns
    const pluralNouns = doc.nouns().isPlural().out('array') as string[]
    if (pluralNouns.length > 0) {
        console.log('[Chatbot] Detected plural nouns:', pluralNouns)
        return true
    }

    // Check for quantity/comparison keywords
    const multipleKeywords = [
        'best', 'top', 'some', 'all', 'multiple', 'several', 'few',
        'many', 'list', 'options', 'choices', 'compare', 'which'
    ]

    const hasMultipleKeyword = multipleKeywords.some(keyword =>
        messageLower.includes(keyword)
    )

    if (hasMultipleKeyword) {
        console.log('[Chatbot] Detected multiple results keyword')
        return true
    }

    return false
}

/**
 * Detect if message is conversational (greeting/casual chat)
 * Returns true if message is NOT a search query
 */
function isConversationalMessage(message: string): boolean {
    const messageLower = message.toLowerCase().trim()

    // Greeting patterns
    const greetings = [
        'hi', 'hello', 'hey', 'good morning', 'good afternoon',
        'good evening', 'good night', 'greetings', 'howdy',
        'what\'s up', 'whats up', 'whatsupsup', 'wassup',
        'sup', 'yo', 'hiya', 'heya'
    ]

    // Casual conversation patterns
    const casualPatterns = [
        'how are you', 'how r u', 'how are u', 'how r you',
        'what are you doing', 'what r u doing', 'whatcha doing',
        'who are you', 'who r you', 'what is this',
        'what can you do', 'what do you do', 'help me',
        'how does this work', 'what is your name', 'your name',
        'tell me about', 'what is', 'why', 'when', 'where are you',
        'thank you', 'thanks', 'thx', 'ty', 'ok', 'okay',
        'bye', 'goodbye', 'see you', 'later', 'cya',
        'nice', 'cool', 'great', 'awesome', 'good'
    ]

    // Question words without business context
    const questionWords = ['why', 'when', 'who', 'whose', 'whom']

    // Check if it's a short message (likely greeting)
    if (messageLower.length < 15) {
        // Check greetings
        if (greetings.some(g => messageLower === g || messageLower.startsWith(g))) {
            return true
        }

        // Check standalone question words
        if (questionWords.some(q => messageLower === q)) {
            return true
        }
    }

    // Check casual patterns
    if (casualPatterns.some(pattern => messageLower.includes(pattern))) {
        return true
    }

    // Check if message has business-related keywords (NOT conversational)
    const businessKeywords = [
        'find', 'search', 'looking for', 'need', 'want',
        'shop', 'store', 'restaurant', 'hotel', 'hospital',
        'school', 'pharmacy', 'clinic', 'service', 'food',
        'eat', 'buy', 'purchase', 'book', 'reserve',
        'near', 'close', 'around', 'best', 'good', 'top'
    ]

    const hasBusinessKeyword = businessKeywords.some(keyword =>
        messageLower.includes(keyword)
    )

    // If has business keyword, it's NOT conversational
    if (hasBusinessKeyword) {
        return false
    }

    // Default: treat short messages without business context as conversational
    return messageLower.length < 30
}

/**
 * Stage 1: Query Breakdown
 * 
 * Breaks down user query into multiple searchable terms with category understanding.
 * Uses compromise.js for intelligent NLP parsing.
 * Includes category synonyms and related terms.
 * Automatically corrects common typos.
 * 
 * Examples:
 * - "shops" → ["shop", "store", "retail", "shopping"]
 * - "Find pizza places" → ["pizza", "restaurant", "food"]
 * - "I need a good restaurant for dinner" → ["restaurant", "dinner", "food", "dining"]
 * - "restuarant" → ["restaurant", "dining", "food"] (typo corrected)
 * 
 * @param message - User's raw input
 * @returns Array of search terms with synonyms
 */
function extractSearchTerms(message: string): string[] {
    // Step 1: Auto-correct typos
    let correctedMessage = message.toLowerCase()
    Object.entries(typoCorrections).forEach(([typo, correction]) => {
        const regex = new RegExp(`\\b${typo}\\b`, 'gi')
        correctedMessage = correctedMessage.replace(regex, correction)
    })

    console.log(`[Chatbot] Original: "${message}", Corrected: "${correctedMessage}"`)

    const doc = nlp(correctedMessage)
    const terms: Set<string> = new Set()

    // Category synonym mapping for better search
    const categoryMap: { [key: string]: string[] } = {
        // Shopping related
        'shop': ['shop', 'store', 'shopping', 'retail', 'market', 'mart'],
        'shops': ['shop', 'store', 'shopping', 'retail', 'market', 'mart'],
        'store': ['store', 'shop', 'retail', 'shopping'],
        'stores': ['store', 'shop', 'retail', 'shopping'],
        'shopping': ['shopping', 'shop', 'store', 'retail', 'market'],
        'market': ['market', 'shopping', 'store', 'shop', 'bazaar'],
        'retail': ['retail', 'store', 'shop', 'shopping'],

        // Food related
        'restaurant': ['restaurant', 'dining', 'food', 'eatery', 'cafe'],
        'restaurants': ['restaurant', 'dining', 'food', 'eatery', 'cafe'],
        'food': ['food', 'restaurant', 'dining', 'eatery', 'cafe'],
        'eat': ['restaurant', 'food', 'dining', 'eatery'],
        'dining': ['dining', 'restaurant', 'food', 'eatery'],
        'cafe': ['cafe', 'coffee', 'restaurant', 'food'],
        'pizza': ['pizza', 'restaurant', 'food', 'italian'],

        // Accommodation
        'hotel': ['hotel', 'lodging', 'accommodation', 'stay', 'resort'],
        'hotels': ['hotel', 'lodging', 'accommodation', 'stay', 'resort'],
        'stay': ['hotel', 'lodging', 'accommodation', 'resort'],
        'lodging': ['lodging', 'hotel', 'accommodation', 'stay'],

        // Services
        'service': ['service', 'services', 'repair', 'maintenance'],
        'services': ['service', 'repair', 'maintenance', 'professional'],
        'repair': ['repair', 'service', 'fix', 'maintenance'],

        // Healthcare
        'health': ['health', 'medical', 'clinic', 'hospital', 'doctor'],
        'medical': ['medical', 'health', 'clinic', 'hospital', 'healthcare'],
        'doctor': ['doctor', 'medical', 'clinic', 'health', 'physician'],
        'hospital': ['hospital', 'medical', 'health', 'clinic', 'healthcare'],

        // Education
        'school': ['school', 'education', 'learning', 'institute', 'academy'],
        'education': ['education', 'school', 'learning', 'training', 'institute'],
        'college': ['college', 'education', 'university', 'institute'],
    }

    // Extract nouns (from corrected message)
    const nouns = doc.nouns().out('array') as string[]
    nouns.forEach((noun: string) => {
        const nounLower = noun.toLowerCase().trim()

        // Check if noun has category synonyms
        if (categoryMap[nounLower]) {
            categoryMap[nounLower].forEach(synonym => terms.add(synonym))
        } else {
            // Only add meaningful nouns (not too short)
            if (nounLower.length > 2) {
                terms.add(nounLower)
            }
        }
    })

    // Extract adjectives + nouns (e.g., "italian restaurant")
    const phrases = doc.match('#Adjective? #Noun').out('array') as string[]
    phrases.forEach((phrase: string) => {
        const phraseLower = phrase.toLowerCase().trim()
        terms.add(phraseLower)

        // Also add individual words from phrase
        phraseLower.split(' ').forEach(word => {
            if (categoryMap[word]) {
                categoryMap[word].forEach(synonym => terms.add(synonym))
            }
        })
    })

    // Extract verbs related to actions
    const verbs = doc.verbs().out('array') as string[]
    verbs.forEach((verb: string) => {
        const v = verb.toLowerCase()
        if (v.includes('eat') || v.includes('dine')) {
            terms.add('restaurant')
            terms.add('food')
            terms.add('dining')
        }
        if (v.includes('stay') || v.includes('sleep')) {
            terms.add('hotel')
            terms.add('lodging')
        }
        if (v.includes('shop') || v.includes('buy')) {
            terms.add('shop')
            terms.add('store')
            terms.add('shopping')
        }
    })

    // Check full message for category keywords
    const messageLower = message.toLowerCase()
    Object.keys(categoryMap).forEach(keyword => {
        if (messageLower.includes(keyword)) {
            categoryMap[keyword].forEach(synonym => terms.add(synonym))
        }
    })

    // Add full message as fallback if no terms found
    if (terms.size === 0) {
        terms.add(messageLower.trim())
    }

    return Array.from(terms).slice(0, 10) // Increased to 10 terms for better matching
}

/**
 * Stage 2: Comprehensive Multi-Field Search
 * 
 * Searches across both listings and search collections.
 * Matches against: name, category, categorySlug, tags, description, website, phone, email
 * 
 * @param searchTerms - Array of terms to search for
 * @param limit - Maximum number of results to return (default: 3)
 * @returns All matching listings with full details
 */
async function searchListingsComprehensive(searchTerms: string[], limit: number = 3) {
    try {
        const db = getAdminDb()
        const allMatches = new Map<string, any>() // Use Map to deduplicate by listing ID

        // Search in listings collection
        for (const term of searchTerms) {
            const termLower = term.toLowerCase()

            // Get all active listings
            const listingsSnapshot = await db
                .collection('listings')
                .where('status', '==', 'active')
                .where('approved', '==', true)
                .get()

            for (const doc of listingsSnapshot.docs) {
                const data = doc.data()
                const listing: any = { id: doc.id, ...data }

                // Multi-field matching
                const matchFields = [
                    listing.name?.toLowerCase() || '',
                    listing.category?.toLowerCase() || '',
                    listing.categorySlug?.toLowerCase() || '',
                    listing.description?.toLowerCase() || '',
                    listing.website?.toLowerCase() || '',
                    listing.phone?.toLowerCase() || '',
                    listing.email?.toLowerCase() || '',
                    ...(Array.isArray(listing.tags) ? listing.tags.map((t: string) => t.toLowerCase()) : [])
                ]

                // Check if any field contains the search term
                const hasMatch = matchFields.some((field: string) => field.includes(termLower))

                if (hasMatch) {
                    // Store or update with higher views if duplicate
                    const existingListing = allMatches.get(listing.id)
                    if (!existingListing || (existingListing.views || 0) < (listing.views || 0)) {
                        allMatches.set(listing.id, listing)
                    }
                }
            }
        }

        // Also search in search collection (sharded index)
        for (const term of searchTerms) {
            const firstChar = term.charAt(0).toLowerCase()
            const indexDoc = `index_${firstChar}`

            try {
                const searchDoc = await db.collection('search').doc(indexDoc).get()
                if (searchDoc.exists) {
                    const searchData = searchDoc.data()
                    if (searchData && typeof searchData === 'object') {
                        // Find matching entries in the index
                        Object.entries(searchData).forEach(([word, entries]) => {
                            if (word.toLowerCase().includes(term.toLowerCase())) {
                                if (Array.isArray(entries)) {
                                    entries.forEach((entry: any) => {
                                        if (entry.id && !allMatches.has(entry.id)) {
                                            allMatches.set(entry.id, {
                                                id: entry.id,
                                                name: entry.name || '',
                                                category: entry.cat || '',
                                                views: entry.imp || 0,
                                                clicks: entry.clk || 0,
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            } catch (error) {
                console.error(`Error searching index ${indexDoc}:`, error)
            }
        }

        // Convert Map to array and sort by views (popularity)
        const results = Array.from(allMatches.values())
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit) // Dynamic limit based on query type

        console.log(`[Chatbot] Found ${allMatches.size} total matches, returning top ${results.length} (limit: ${limit})`)
        return results

    } catch (error) {
        console.error("Comprehensive search error:", error)
        return []
    }
}

/**
 * Generate contact information response
 */
async function generateContactResponse() {
    const contactInfo = `📞 **Contact Information**

Here's how you can reach us:

📧 **Email:** ${CONTACT_EMAIL}
We respond to all emails within 72 hours.

📍 **Office Address:** 
${OFFICE_ADDRESS}
Drop by our office for a chat.

☎️ **Phone:** ${CONTACT_PHONE}
We're available Mon-Fri, 9am-5pm.

💬 **Live Chat:** 
You can use this chatbot for instant assistance!

Feel free to contact us for any questions, feedback, or support!`

    return contactInfo
}

/**
 * Generate "how to list my business" guide response
 */
async function generateListingGuideResponse() {
    const guideInfo = `📝 **How to List Your Business**

Follow these simple steps to list your business on ${APP_NAME}:

**Step 1:** Sign in to your account (click Sign In at the top right)

**Step 2:** Navigate to "Submit Listing" from the menu

**Step 3:** Fill in your business details:
   • Business Name
   • Category
   • Address
   • Phone & Email
   • Website (optional)
   • Upload a photo

**Step 4:** Choose your plan:
   • **Free** - Basic listing
   • **Featured** - Premium placement & homepage highlight

**Step 5:** Submit for admin approval

⚠️ **Important:** Your business must be registered on Google Maps first to be listed here.

📍 You can use the Google Places URL autofill feature on the submission form to quickly fill your business details.

✅ Once approved by our team, your listing will go live!

Need help? Feel free to ask me any questions!`

    return guideInfo
}

/**
 * Generate conversational response (greetings, help, etc.)
 * WITHOUT searching listings
 */
async function generateConversationalResponse(userMessage: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        const prompt = `You are the Directory AI Chatbot for ${CITY_NAME} district business directory website.

User Query: "${userMessage}"

Context:
- This is a business directory website for ${CITY_NAME} district, ${STATE_NAME}, India
- Users can search for local businesses, shops, restaurants, hotels, services
- The user is having a casual conversation or greeting (NOT searching for a business)

Instructions:
- Provide a SHORT, FORMAL, and FRIENDLY response (1-2 sentences maximum)
- For greetings: Greet back and briefly mention you can help find businesses
- For questions about the chatbot: Briefly explain you help find local businesses in ${CITY_NAME}
- For "thank you": Acknowledge politely
- For "goodbye": Say goodbye politely
- DO NOT search or mention specific businesses
- DO NOT offer services outside chatbot scope (only finding businesses)
- Keep it professional and concise
- If unsure, say: "I'm here to help you find businesses in ${CITY_NAME}. What are you looking for?"

Your Response:`

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error("Conversational generation error:", error)
        return `Hello! I'm here to help you find businesses in ${CITY_NAME} district. What are you looking for?`
    }
}

/**
 * Stage 3: AI Response Generation
 * 
 * Uses Gemini 2.0 Flash to synthesize a natural response with full listing details.
 * Includes: Name, Location (address), Contact (phone)
 * 
 * @param userMessage - Original user query
 * @param searchTerms - Extracted search terms
 * @param listings - Retrieved results from database (top 3 by views)
 * @returns AI-generated conversational response with details
 */
async function generateResponse(userMessage: string, searchTerms: string[], listings: any[]) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        // Craft detailed context from search results
        const context = listings.length > 0
            ? listings.map((listing, idx) => {
                const address = typeof listing.address === 'string'
                    ? listing.address
                    : listing.address?.formattedAddress || 'Address not available'

                return `${idx + 1}. **${listing.name || 'Unknown'}**
   Category: ${listing.category || 'N/A'}
   Location: ${address}
   Phone: ${listing.phone || 'Not provided'}
   Views: ${listing.views || 0}
   ${listing.description ? `Description: ${listing.description.substring(0, 100)}...` : ''}`
            }).join('\n\n')
            : "No listings found matching your search."

        // Engineer the prompt for detailed responses
        const prompt = `You are the Directory AI Chatbot for ${CITY_NAME} district, ${STATE_NAME}, India.

User Query: "${userMessage}"
Search Terms Used: ${searchTerms.join(', ')}

Top Businesses Found (sorted by popularity/views):
${context}

Instructions:
- Provide a friendly, helpful response based ONLY on the listings above
- If listings found, mention the top 2-3 with their NAME, LOCATION, and CONTACT details
- Format like: "I found [Business Name] located at [Address]. You can reach them at [Phone]."
- Be conversational and warm in tone
- If no listings found, suggest trying different keywords or browsing categories
- Keep response 3-4 sentences maximum
- Do NOT use external knowledge or web search

Your Response:`

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error("Generation error:", error)
        return "I apologize, but I'm having trouble right now. Please try again in a moment or try different search terms."
    }
}

/**
 * POST /api/chatbot
 * 
 * Main endpoint handler for comprehensive chatbot search.
 * 
 * Request Body:
 * {
 *   "message": "Find food places" or "I want to eat pizza"
 * }
 * 
 * Response:
 * {
 *   "reply": "I found [Business Name] located at...",
 *   "results": [...],              // Listings (1 for singular, max 3 for plural)
 *   "searchTerms": ["food", "pizza"], // Terms used for search
 *   "isContactQuery": false,
 *   "isListingGuideQuery": false,
 *   "success": true
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        const { message } = body

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: "Invalid message format" },
                { status: 400 }
            )
        }

        // Validate Gemini API key
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY not configured")
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 }
            )
        }

        console.log(`[Chatbot] Processing query: "${message}"`)

        // **Priority 1: Check if asking for contact information**
        if (isContactQuery(message)) {
            console.log(`[Chatbot] Detected contact query`)
            const reply = await generateContactResponse()

            return NextResponse.json({
                reply,
                results: [],
                searchTerms: [],
                totalFound: 0,
                isContactQuery: true,
                isListingGuideQuery: false,
                conversational: false,
                success: true
            })
        }

        // **Priority 2: Check if asking how to list business**
        if (isListingGuideQuery(message)) {
            console.log(`[Chatbot] Detected listing guide query`)
            const reply = await generateListingGuideResponse()

            return NextResponse.json({
                reply,
                results: [],
                searchTerms: [],
                totalFound: 0,
                isContactQuery: false,
                isListingGuideQuery: true,
                conversational: false,
                success: true
            })
        }

        // **Priority 3: Check if conversational message (greeting/casual chat)**
        if (isConversationalMessage(message)) {
            console.log(`[Chatbot] Detected conversational message (no search needed)`)

            const reply = await generateConversationalResponse(message)
            console.log(`[Chatbot] Conversational response: ${reply}`)

            return NextResponse.json({
                reply,
                results: [],
                searchTerms: [],
                totalFound: 0,
                isContactQuery: false,
                isListingGuideQuery: false,
                conversational: true,
                success: true
            })
        }

        // **Priority 4: Business search query**

        // Detect if requesting multiple results (plural)
        const requestingMultiple = isRequestingMultipleResults(message)
        const resultLimit = requestingMultiple ? 3 : 1

        console.log(`[Chatbot] Business search query - Requesting ${requestingMultiple ? 'MULTIPLE' : 'SINGLE'} result(s) (limit: ${resultLimit})`)

        // **Stage 1: Query Breakdown (with typo correction)**
        const searchTerms = extractSearchTerms(message)
        console.log(`[Chatbot] Extracted search terms:`, searchTerms)

        // **Stage 2: Comprehensive Multi-Field Search with dynamic limit**
        const listings = await searchListingsComprehensive(searchTerms, resultLimit)
        console.log(`[Chatbot] Found ${listings.length} listings (limit: ${resultLimit})`)

        // **Stage 3: AI Response Generation**
        const reply = await generateResponse(message, searchTerms, listings)
        console.log(`[Chatbot] Generated response: ${reply.substring(0, 100)}...`)

        // Return comprehensive response
        return NextResponse.json({
            reply,
            results: listings,
            searchTerms,
            totalFound: listings.length,
            isContactQuery: false,
            isListingGuideQuery: false,
            conversational: false,
            requestingMultiple,
            resultLimit,
            success: true
        })

    } catch (error) {
        console.error("[Chatbot API] Error:", error)
        return NextResponse.json(
            {
                error: "Internal server error",
                reply: "I'm sorry, something went wrong. Please try again in a moment.",
                success: false
            },
            { status: 500 }
        )
    }
}
