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

    // Electronics variations
    'eletronics': 'electronics',
    'eletronic': 'electronic',
    'elektronics': 'electronics',
    'elektronic': 'electronic',

    // General typos
    'servic': 'service',
    'servies': 'services',
    'shoping': 'shopping',
    'shoppng': 'shopping',
}

/**
 * Detect explicit, sexual, or unethical content
 * Returns true if message contains inappropriate content
 */
function isInappropriateContent(message: string): boolean {
    const messageLower = message.toLowerCase().trim()

    // Explicit/sexual keywords
    const explicitKeywords = [
        'sex', 'porn', 'xxx', 'nude', 'naked', 'adult content',
        'erotic', 'nsfw', 'explicit', 'sexual', 'prostitute',
        'escort', 'strip club', 'adult entertainment'
    ]

    // Unethical/harmful keywords
    const unethicalKeywords = [
        'drug', 'drugs', 'weed', 'cocaine', 'marijuana',
        'weapon', 'gun', 'bomb', 'explosive', 'illegal',
        'hack', 'crack', 'pirate', 'steal', 'scam',
        'fraud', 'fake id', 'counterfeit'
    ]

    const allInappropriateKeywords = [...explicitKeywords, ...unethicalKeywords]

    return allInappropriateKeywords.some(keyword =>
        messageLower.includes(keyword)
    )
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
function isConversationalMessage(message: string, conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []): boolean {
    const messageLower = message.toLowerCase().trim()

    // Check conversation context - if user previously searched, this might be a follow-up
    const hasRecentSearchContext = conversationHistory.slice(-4).some(msg =>
        msg.role === 'bot' && (
            msg.message.includes('found') ||
            msg.message.includes('located at') ||
            msg.message.includes('restaurant') ||
            msg.message.includes('hotel') ||
            msg.message.includes('shop')
        )
    )

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
        'near', 'close', 'around', 'best', 'good', 'top',
        'electronics', 'grocery', 'medical', 'show me', 'give me'
    ]

    const hasBusinessKeyword = businessKeywords.some(keyword =>
        messageLower.includes(keyword)
    )

    // If has business keyword, it's NOT conversational
    if (hasBusinessKeyword) {
        return false
    }

    // If user has recent search context and asks follow-up, treat as search
    if (hasRecentSearchContext && (messageLower.includes('more') || messageLower.includes('other') || messageLower.includes('another'))) {
        return false
    }

    // If message contains potential business name patterns (capitalized words, specific terms)
    // Examples: "Deepak Electronics", "Gupta Medical", "Ram Hotel"
    const hasCapitalizedWords = /[A-Z][a-z]+/.test(message) // Has capitalized words
    const wordCount = messageLower.split(' ').length

    // If it's 2-4 words with capitalized letters and no casual patterns, likely a business name
    if (hasCapitalizedWords && wordCount >= 2 && wordCount <= 4) {
        // Not a greeting, likely a business name search
        return false
    }

    // Default: treat short messages without business context as conversational
    return messageLower.length < 30
}/**
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

    // Detect if user is being specific (e.g., "electronics shops" = specific category)
    const specificCategories = ['electronics', 'electronic', 'grocery', 'medical', 'pharmacy', 'clinic', 'hospital', 'school', 'hotel', 'restaurant', 'salon', 'gym', 'fitness', 'bakery', 'cafe', 'coffee']
    const hasSpecificCategory = specificCategories.some(cat => correctedMessage.includes(cat))

    // Category synonym mapping for better search
    const categoryMap: { [key: string]: string[] } = {
        // Electronics - SPECIFIC CATEGORY (only electronics terms)
        'electronics': ['electronics', 'electronic'],
        'electronic': ['electronic', 'electronics'],

        // Grocery - SPECIFIC CATEGORY
        'grocery': ['grocery', 'groceries', 'supermarket'],
        'groceries': ['grocery', 'groceries', 'supermarket'],

        // Medical - SPECIFIC CATEGORY
        'medical': ['medical', 'clinic', 'hospital', 'pharmacy', 'health'],
        'pharmacy': ['pharmacy', 'medical', 'chemist', 'drugstore'],
        'clinic': ['clinic', 'medical', 'health', 'doctor'],
        'hospital': ['hospital', 'medical', 'health', 'clinic'],

        // Restaurant - SPECIFIC CATEGORY
        'restaurant': ['restaurant', 'dining', 'food', 'eatery'],
        'restaurants': ['restaurant', 'dining', 'food', 'eatery'],

        // Hotel - SPECIFIC CATEGORY
        'hotel': ['hotel', 'lodging', 'accommodation', 'resort'],
        'hotels': ['hotel', 'lodging', 'accommodation', 'resort'],

        // Generic terms (only used when NO specific category)
        'shop': ['shop', 'store'],
        'shops': ['shop', 'store'],
        'store': ['store', 'shop'],
        'stores': ['store', 'shop'],
    }

    // Extract nouns (from corrected message)
    const nouns = doc.nouns().out('array') as string[]
    nouns.forEach((noun: string) => {
        const nounLower = noun.toLowerCase().trim()

        // Check if noun has category synonyms
        if (categoryMap[nounLower]) {
            // If user specified a specific category, SKIP all generic terms
            if (hasSpecificCategory && ['shop', 'shops', 'store', 'stores', 'shopping', 'market', 'retail'].includes(nounLower)) {
                // Skip completely - don't add generic terms when specific category present
                return
            }
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
                // If user specified a specific category, SKIP all generic terms
                if (hasSpecificCategory && ['shop', 'shops', 'store', 'stores', 'shopping', 'market', 'retail'].includes(word)) {
                    // Skip completely
                    return
                }
                categoryMap[word].forEach(synonym => terms.add(synonym))
            }
        })
    })

    // Extract verbs related to actions - ONLY if no specific category
    if (!hasSpecificCategory) {
        const verbs = doc.verbs().out('array') as string[]
        verbs.forEach((verb: string) => {
            const v = verb.toLowerCase()
            if (v.includes('eat') || v.includes('dine')) {
                terms.add('restaurant')
                terms.add('food')
            }
            if (v.includes('stay') || v.includes('sleep')) {
                terms.add('hotel')
            }
            if (v.includes('shop') || v.includes('buy')) {
                terms.add('shop')
                terms.add('store')
            }
        })
    }

    // Check full message for category keywords
    const messageLower = message.toLowerCase()
    Object.keys(categoryMap).forEach(keyword => {
        if (messageLower.includes(keyword)) {
            // If user specified a specific category, SKIP all generic terms
            if (hasSpecificCategory && ['shop', 'shops', 'store', 'stores', 'shopping', 'market', 'retail'].includes(keyword)) {
                // Skip completely
                return
            }
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
        const exactNameMatches = new Map<string, any>() // Separate map for exact name matches
        const exactCategoryMatches = new Map<string, any>() // Separate map for exact category matches

        // Known category keywords - these should NEVER be treated as business names
        const knownCategories = [
            'restaurant', 'restaurants', 'hotel', 'hotels', 'shop', 'shops', 'store', 'stores',
            'electronics', 'electronic', 'grocery', 'groceries', 'medical', 'pharmacy', 'clinic',
            'hospital', 'school', 'cafe', 'coffee', 'bakery', 'salon', 'gym', 'fitness',
            'service', 'services', 'food', 'dining', 'eatery', 'retail', 'market'
        ]

        // First, check for exact category matches (high priority for single-word category queries)
        for (const term of searchTerms) {
            const termLower = term.toLowerCase().trim()

            // Skip if this is a known category (don't treat as business name)
            if (knownCategories.includes(termLower)) {
                // Get all active listings
                const listingsSnapshot = await db
                    .collection('listings')
                    .where('status', '==', 'active')
                    .where('approved', '==', true)
                    .get()

                for (const doc of listingsSnapshot.docs) {
                    const data = doc.data()
                    const listing: any = { id: doc.id, ...data }
                    const listingCategory = (listing.category || '').toLowerCase()
                    const listingCategorySlug = (listing.categorySlug || '').toLowerCase()

                    // Check for exact category match
                    if (listingCategory === termLower ||
                        listingCategorySlug === termLower ||
                        listingCategory.includes(termLower) ||
                        listingCategorySlug.includes(termLower)) {
                        exactCategoryMatches.set(listing.id, { ...listing, matchScore: 90 })
                    }
                }
            }
        }

        // If we found exact category matches, prioritize them
        if (exactCategoryMatches.size > 0) {
            console.log(`[Chatbot] Found ${exactCategoryMatches.size} exact category matches, prioritizing these`)
            const results = Array.from(exactCategoryMatches.values())
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, limit)
            return results
        }

        // Second, check for exact name matches (for multi-word business names)
        for (const term of searchTerms) {
            const termLower = term.toLowerCase().trim()

            // Skip known categories
            if (knownCategories.includes(termLower)) {
                continue
            }

            // Get all active listings
            const listingsSnapshot = await db
                .collection('listings')
                .where('status', '==', 'active')
                .where('approved', '==', true)
                .get()

            for (const doc of listingsSnapshot.docs) {
                const data = doc.data()
                const listing: any = { id: doc.id, ...data }
                const listingName = (listing.name || '').toLowerCase()

                // Check for exact or very close name match
                if (listingName === termLower || listingName.includes(termLower) || termLower.includes(listingName)) {
                    // If searching term has multiple words (likely a business name), prioritize exact matches
                    if (termLower.split(' ').length >= 2) {
                        exactNameMatches.set(listing.id, { ...listing, matchScore: 100 })
                    }
                }
            }
        }

        // If we found exact name matches, return those ONLY (user searched for specific business)
        if (exactNameMatches.size > 0) {
            console.log(`[Chatbot] Found ${exactNameMatches.size} exact name matches, prioritizing these`)
            const results = Array.from(exactNameMatches.values())
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, limit)
            return results
        }

        // Otherwise, do broader search across all fields with smart scoring
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

                // Prioritized matching with scores
                let matchScore = 0
                const listingName = (listing.name || '').toLowerCase()
                const listingCategory = (listing.category || '').toLowerCase()
                const listingCategorySlug = (listing.categorySlug || '').toLowerCase()
                const listingDescription = (listing.description || '').toLowerCase()
                const listingTags = Array.isArray(listing.tags) ? listing.tags.map((t: string) => t.toLowerCase()) : []

                // Exact category match = highest priority (score: 100)
                if (listingCategory === termLower || listingCategorySlug === termLower) {
                    matchScore = 100
                }
                // Partial category match = high priority (score: 80)
                else if (listingCategory.includes(termLower) || listingCategorySlug.includes(termLower)) {
                    matchScore = 80
                }
                // Name match = medium-high priority (score: 70)
                else if (listingName.includes(termLower)) {
                    matchScore = 70
                }
                // Tags match = medium priority (score: 50)
                else if (listingTags.some((tag: string) => tag.includes(termLower))) {
                    matchScore = 50
                }
                // Description match = low priority (score: 20)
                else if (listingDescription.includes(termLower)) {
                    matchScore = 20
                }

                if (matchScore > 0) {
                    // Store with match score, update if higher score or higher views
                    const existingListing = allMatches.get(listing.id)
                    if (!existingListing || matchScore > (existingListing.matchScore || 0)) {
                        allMatches.set(listing.id, { ...listing, matchScore })
                    } else if (matchScore === (existingListing.matchScore || 0) && (listing.views || 0) > (existingListing.views || 0)) {
                        allMatches.set(listing.id, { ...listing, matchScore })
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

        // Convert Map to array and sort by match score first, then by views (popularity)
        const results = Array.from(allMatches.values())
            .sort((a, b) => {
                // Sort by match score first (higher is better)
                const scoreA = a.matchScore || 0
                const scoreB = b.matchScore || 0
                if (scoreB !== scoreA) {
                    return scoreB - scoreA
                }
                // If same score, sort by popularity (views)
                return (b.views || 0) - (a.views || 0)
            })
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
async function generateConversationalResponse(userMessage: string, conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        // Build conversation context
        const historyContext = conversationHistory.length > 0
            ? conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.message}`).join('\n')
            : 'No previous conversation'

        const prompt = `You are the Directory AI Chatbot for ${CITY_NAME} district business directory website.

Previous Conversation:
${historyContext}

Current User Query: "${userMessage}"

Context:
- This is a business directory website for ${CITY_NAME} district, ${STATE_NAME}, India
- Users can search for local businesses, shops, restaurants, hotels, services
- The user is having a casual conversation or greeting (NOT searching for a business)
- You have context of previous messages to provide better responses

Instructions:
- Provide a SHORT, FORMAL, and FRIENDLY response (1-2 sentences maximum)
- Use previous conversation context if relevant
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

        return text || `Hello! I'm here to help you find businesses in ${CITY_NAME} district. What are you looking for?`
    } catch (error: any) {
        console.error("Conversational generation error:", error)

        // Return context-aware fallback based on error type
        if (error.message && error.message.includes('fetch failed')) {
            console.error("[Chatbot] Network error - returning fallback response")
        }

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
 * @param conversationHistory - Previous messages for context
 * @returns AI-generated conversational response with details
 */
async function generateResponse(userMessage: string, searchTerms: string[], listings: any[], conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        // Build conversation context
        const historyContext = conversationHistory.length > 0
            ? conversationHistory.slice(-6).map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.message}`).join('\n')
            : 'No previous conversation'

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

Previous Conversation:
${historyContext}

Current User Query: "${userMessage}"
Search Terms Used: ${searchTerms.join(', ')}

Top Businesses Found (sorted by popularity/views):
${context}

Instructions:
- Use previous conversation context to provide better, contextual responses
- Provide a friendly, helpful response based ONLY on the listings above
- If listings found, mention the top 2-3 with their NAME, LOCATION, and CONTACT details
- Format properly with line breaks and bullet points for readability
- Use proper formatting like **bold** for names, line breaks for clarity
- Be conversational and warm in tone
- If no listings found, suggest trying different keywords or browsing categories
- Keep response 3-5 sentences maximum
- Do NOT use external knowledge or web search
- Reference previous conversation if user asked follow-up question

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
        const { message, conversationHistory = [] } = body

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

        console.log(`[Chatbot] Processing query: "${message}" with ${conversationHistory.length} history messages`)

        // **Priority 0: Block inappropriate content**
        if (isInappropriateContent(message)) {
            console.log(`[Chatbot] Blocked inappropriate content`)
            return NextResponse.json({
                reply: "I can't help with that. I'm designed to help you find businesses and services in our directory. Please ask about restaurants, shops, hotels, or other local businesses.",
                results: [],
                searchTerms: [],
                totalFound: 0,
                isContactQuery: false,
                isListingGuideQuery: false,
                conversational: false,
                blocked: true,
                success: true
            })
        }

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
        if (isConversationalMessage(message, conversationHistory)) {
            console.log(`[Chatbot] Detected conversational message (no search needed)`)

            const reply = await generateConversationalResponse(message, conversationHistory)
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

        // **Stage 3: AI Response Generation with conversation history**
        const reply = await generateResponse(message, searchTerms, listings, conversationHistory)
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

    } catch (error: any) {
        console.error("[Chatbot API] Error:", error)

        // Detailed error logging for debugging
        if (error.message) {
            console.error("[Chatbot API] Error message:", error.message)
        }
        if (error.stack) {
            console.error("[Chatbot API] Error stack:", error.stack)
        }

        // Determine user-friendly error message based on error type
        let userMessage = "I'm having trouble processing your request right now. Please try again in a moment."

        if (error.message && error.message.includes('fetch failed')) {
            userMessage = "I'm experiencing network connectivity issues. Please check your internet connection and try again."
        } else if (error.message && error.message.includes('timeout')) {
            userMessage = "The request took too long to process. Please try again with a simpler query."
        } else if (error.message && error.message.includes('Gemini') || error.message && error.message.includes('API')) {
            userMessage = "Our AI service is temporarily unavailable. Please try again in a few moments."
        }

        return NextResponse.json(
            {
                error: "Internal server error",
                message: userMessage,
                success: false,
                reply: userMessage,
                results: [],
                searchTerms: [],
                totalFound: 0
            },
            { status: 500 }
        )
    }
}
