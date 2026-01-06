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
    'restrant': 'restaurant',
    'restruant': 'restaurant',

    // Hotel variations
    'hotl': 'hotel',
    'hotell': 'hotel',
    'hotle': 'hotel',
    'hottel': 'hotel',

    // Lodge variations
    'logde': 'lodge',
    'logdes': 'lodge',
    'logge': 'lodge',
    'logges': 'lodge',
    'loge': 'lodge',
    'loges': 'lodge',
    'lodges': 'lodge',
    'lodg': 'lodge',

    // Motel variations
    'motl': 'motel',
    'motell': 'motel',
    'motle': 'motel',

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

    // SERVICE CATEGORIES - Common typos
    // Carpenter variations
    'carpanter': 'carpenter',
    'carpeter': 'carpenter',
    'carpnter': 'carpenter',
    'carpinter': 'carpenter',
    'carpentar': 'carpenter',
    'carpantar': 'carpenter',
    'carpentor': 'carpenter',
    'carpenetr': 'carpenter',
    'carpneter': 'carpenter',
    'carperter': 'carpenter',
    'carpenteer': 'carpenter',
    'carptner': 'carpenter',

    // Electrician variations
    'electrican': 'electrician',
    'electritian': 'electrician',
    'electician': 'electrician',
    'electricain': 'electrician',
    'electrisan': 'electrician',
    'electrishan': 'electrician',
    'eletrician': 'electrician',
    'electricin': 'electrician',

    // Plumber variations
    'plumer': 'plumber',
    'plomber': 'plumber',
    'plumbar': 'plumber',
    'plamber': 'plumber',
    'plumeber': 'plumber',

    // Painter variations
    'paintar': 'painter',
    'panter': 'painter',
    'paiter': 'painter',
    'paniter': 'painter',

    // Mechanic variations
    'mechnic': 'mechanic',
    'mechenik': 'mechanic',
    'mecanic': 'mechanic',
    'mechanik': 'mechanic',
    'mekanic': 'mechanic',

    // Beautician variations
    'beauticion': 'beautician',
    'beautisan': 'beautician',
    'bewtician': 'beautician',
    'beauticain': 'beautician',

    // Tailor variations
    'talor': 'tailor',
    'tailer': 'tailor',
    'taylor': 'tailor',
    'tailar': 'tailor',

    // Barber variations
    'barbar': 'barber',
    'barbor': 'barber',
    'berber': 'barber',
    'barbaar': 'barber',

    // Mason variations
    'masan': 'mason',
    'masson': 'mason',
    'masen': 'mason',

    // Driver variations
    'drivar': 'driver',
    'drever': 'driver',
    'diver': 'driver',

    // Tutor variations
    'tutar': 'tutor',
    'tuter': 'tutor',
    'tutir': 'tutor',

    // Guard/Security variations
    'gaurd': 'guard',
    'gard': 'guard',
    'secuirty': 'security',
    'securty': 'security',

    // General typos
    'servic': 'service',
    'servies': 'services',
    'shoping': 'shopping',
    'shoppng': 'shopping',
}

/**
 * All known category keywords for fuzzy matching
 */
const allKnownCategories = [
    // Business categories
    'restaurant', 'hotel', 'lodge', 'motel', 'inn', 'dhaba', 'shop', 'store',
    'electronics', 'grocery', 'medical', 'pharmacy', 'clinic', 'hospital',
    'school', 'cafe', 'bakery', 'salon', 'gym', 'fitness', 'bank', 'atm',
    'supermarket', 'mall', 'market', 'college', 'university', 'petrol',
    'clothing', 'jewellery', 'furniture', 'hardware', 'stationery', 'books',
    // Service categories
    'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
    'photographer', 'beautician', 'cook', 'chef', 'babysitter', 'gardener',
    'tailor', 'cleaner', 'security', 'guard', 'caregiver', 'tutor', 'teacher',
    'musician', 'dj', 'trainer', 'nurse', 'lawyer', 'advocate', 'accountant',
    'potter', 'barber', 'mason', 'welder', 'milkman', 'priest', 'pandit',
    'rickshaw', 'auto', 'mistri', 'karigar', 'rajmistri', 'nai', 'gwala'
]

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching typos
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
        }
    }
    return dp[m][n]
}

/**
 * Find closest matching category for a potentially misspelled word
 * Returns the suggested category if within acceptable distance, null otherwise
 */
function findClosestCategory(word: string): { suggested: string, distance: number } | null {
    const wordLower = word.toLowerCase().trim()

    // Skip very short words (less than 3 chars)
    if (wordLower.length < 3) return null

    // Skip common words that are not categories
    const commonWords = ['the', 'and', 'for', 'any', 'some', 'find', 'show', 'get', 'need', 'want',
        'best', 'good', 'near', 'nearby', 'around', 'please', 'help', 'looking']
    if (commonWords.includes(wordLower)) return null

    // Check if it's already a known category
    if (allKnownCategories.includes(wordLower)) return null

    // Check if it's already in typo corrections
    if (typoCorrections[wordLower]) return null

    let bestMatch: { suggested: string, distance: number } | null = null

    for (const category of allKnownCategories) {
        const distance = levenshteinDistance(wordLower, category)
        // Allow max 2 character differences for words > 4 chars, 1 for shorter
        const maxDistance = category.length > 4 ? 2 : 1

        if (distance <= maxDistance && distance > 0) {
            if (!bestMatch || distance < bestMatch.distance) {
                bestMatch = { suggested: category, distance }
            }
        }
    }

    return bestMatch
}

/**
 * Detect if user is confirming a previous suggestion
 */
function isConfirmationResponse(message: string): boolean {
    const confirmWords = ['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'okay', 'ok', 'sure', 'y']
    const messageLower = message.toLowerCase().trim()
    return confirmWords.includes(messageLower)
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
 * Detect if query is asking for a SPECIFIC business/person
 * Returns true if user is looking for a specific entity (name, phone number)
 */
function isSpecificQuery(message: string): boolean {
    const messageLower = message.toLowerCase().trim()

    // Check for phone number patterns (Indian format)
    const phonePattern = /\d{10}|\+91\s?\d{10}|\d{5}\s?\d{5}/
    if (phonePattern.test(message)) {
        console.log('[Chatbot] Detected phone number in query - specific search')
        return true
    }

    // Check if query starts with specific name patterns
    // Examples: "Ravi Kumar", "Deepak Electronics", "Sharma Medical"
    const words = messageLower.split(/\s+/).filter(w => w.length > 0)

    // If 2-4 capitalized words and no generic search terms, likely a specific name
    const hasCapitalizedName = /[A-Z][a-z]+\s+[A-Z]?[a-z]*/.test(message)

    // Generic search keywords that indicate NOT a specific search
    const genericSearchTerms = [
        'find', 'search', 'show', 'give', 'need', 'want', 'looking',
        'best', 'top', 'good', 'near', 'nearby', 'around', 'closest',
        'any', 'some', 'all', 'list', 'recommend', 'suggest'
    ]

    const hasGenericTerm = genericSearchTerms.some(term => messageLower.includes(term))

    // If it looks like a proper name (capitalized) and no generic terms, it's specific
    if (hasCapitalizedName && !hasGenericTerm && words.length >= 2 && words.length <= 5) {
        console.log('[Chatbot] Detected proper name pattern - specific search')
        return true
    }

    return false
}

/**
 * Detect if query is asking for multiple results (plural/general)
 * Returns true if user wants multiple options (e.g., "restaurants", "best hotels")
 * Returns false for single-word service queries (should show 3 by default for discovery)
 */
function isRequestingMultipleResults(message: string): boolean {
    const messageLower = message.toLowerCase().trim()
    const doc = nlp(messageLower)

    // FIRST: Check if it's a specific query (should return 1)
    if (isSpecificQuery(message)) {
        console.log('[Chatbot] Specific query detected - returning single result')
        return false
    }

    // Single-word service queries should return MULTIPLE (3) for discovery
    const words = messageLower.split(/\s+/).filter(w => w.length > 0)
    if (words.length === 1) {
        // Single word like "plumber", "electrician" - show 3 results for discovery
        console.log('[Chatbot] Single-word query - showing multiple results for discovery')
        return true
    }

    // Check for plural nouns
    const pluralNouns = doc.nouns().isPlural().out('array') as string[]
    if (pluralNouns.length > 0) {
        console.log('[Chatbot] Detected plural nouns:', pluralNouns)
        return true
    }

    // Check for quantity/comparison keywords
    const multipleKeywords = [
        'best', 'top', 'some', 'all', 'multiple', 'several', 'few',
        'many', 'list', 'options', 'choices', 'compare', 'which',
        'show me', 'give me', 'find me', 'any', 'nearby', 'around',
        'near', 'in area', 'close to'
    ]

    const hasMultipleKeyword = multipleKeywords.some(keyword =>
        messageLower.includes(keyword)
    )

    if (hasMultipleKeyword) {
        console.log('[Chatbot] Detected multiple results keyword')
        return true
    }

    // Default: For general queries (2-3 words without specific names), show multiple
    // This ensures better discovery experience
    if (words.length >= 2 && words.length <= 4) {
        // Check if contains a service/business type word
        const serviceWords = [
            'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
            'photographer', 'beautician', 'cook', 'chef', 'babysitter', 'gardener',
            'tailor', 'cleaner', 'guard', 'tutor', 'nurse', 'lawyer', 'accountant',
            'potter', 'barber', 'mason', 'welder', 'milkman', 'priest',
            'restaurant', 'hotel', 'shop', 'store', 'pharmacy', 'hospital', 'clinic'
        ]

        const hasServiceWord = words.some(w => serviceWords.includes(w))
        if (hasServiceWord) {
            console.log('[Chatbot] Query contains service/business type - showing multiple')
            return true
        }
    }

    return false
}

/**
 * Detect if message is conversational (greeting/casual chat)
 * Returns true if message is NOT a search query
 */
function isConversationalMessage(message: string, conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []): boolean {
    const messageLower = message.toLowerCase().trim()

    // PRIORITY CHECK: Single-word or short service keywords should ALWAYS trigger search
    // This handles cases like "plumber", "electrician", "barber", "lodge" etc.
    const singleWordServiceTerms = [
        // Direct service names (singular)
        'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
        'photographer', 'beautician', 'cook', 'chef', 'babysitter', 'gardener',
        'tailor', 'cleaner', 'security', 'guard', 'caregiver', 'tutor', 'teacher',
        'musician', 'dj', 'trainer', 'nurse', 'lawyer', 'advocate', 'accountant',
        // New categories
        'potter', 'barber', 'mason', 'welder', 'milkman', 'priest', 'pandit',
        // Hindi/local terms
        'mistri', 'karigar', 'rajmistri', 'nai', 'gwala', 'lohar', 'kumhar', 'pujari',
        // Business types (singular)
        'restaurant', 'hotel', 'lodge', 'motel', 'inn', 'dhaba', 'shop', 'store',
        'pharmacy', 'hospital', 'clinic', 'cafe', 'bakery', 'salon', 'gym',
        'school', 'college', 'bank', 'atm', 'petrol', 'gas', 'grocery', 'market',
        'electronics', 'mobile', 'computer', 'laptop', 'clothing', 'jewellery',
        'furniture', 'hardware', 'stationery', 'books', 'toys', 'sports',
        // Plural forms
        'electricians', 'plumbers', 'carpenters', 'painters', 'mechanics', 'drivers',
        'photographers', 'beauticians', 'cooks', 'chefs', 'babysitters', 'gardeners',
        'tailors', 'cleaners', 'guards', 'tutors', 'teachers', 'nurses', 'lawyers',
        'potters', 'barbers', 'masons', 'welders', 'restaurants', 'hotels', 'lodges',
        'motels', 'inns', 'dhabas', 'shops', 'stores', 'pharmacies', 'hospitals',
        'clinics', 'cafes', 'bakeries', 'salons', 'gyms', 'schools', 'colleges', 'banks'
    ]

    // If the message is EXACTLY a service keyword (single word), treat as search query
    if (singleWordServiceTerms.includes(messageLower)) {
        console.log(`[Chatbot] Single-word service keyword detected: "${messageLower}" - treating as search query`)
        return false // NOT conversational - it's a search
    }

    // If the message contains only 1-3 words and includes a service keyword, treat as search
    const words = messageLower.split(/\s+/).filter(w => w.length > 0)
    if (words.length <= 3 && words.some(word => singleWordServiceTerms.includes(word))) {
        console.log(`[Chatbot] Short message with service keyword detected: "${messageLower}" - treating as search query`)
        return false // NOT conversational - it's a search
    }

    // Check conversation context - if user previously searched, this might be a follow-up
    // More comprehensive check for search context
    const hasRecentSearchContext = conversationHistory.slice(-6).some(msg =>
        msg.role === 'bot' && (
            msg.message.includes('found') ||
            msg.message.includes('located at') ||
            msg.message.includes('couldn\'t find') ||
            msg.message.includes('no results') ||
            msg.message.includes('help you find') ||
            // Check for category names in bot messages (indicates search happened)
            msg.message.toLowerCase().includes('restaurant') ||
            msg.message.toLowerCase().includes('hotel') ||
            msg.message.toLowerCase().includes('lodge') ||
            msg.message.toLowerCase().includes('shop') ||
            msg.message.toLowerCase().includes('electrician') ||
            msg.message.toLowerCase().includes('plumber') ||
            msg.message.toLowerCase().includes('service')
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
    // Words like "any", "all", "yes", "show", "list" etc. are follow-ups
    const followUpWords = ['more', 'other', 'another', 'any', 'all', 'yes', 'yep', 'yeah',
        'show', 'list', 'ok', 'okay', 'sure', 'please', 'now', 'these', 'those']
    if (hasRecentSearchContext && followUpWords.some(w => messageLower === w || messageLower.includes(w))) {
        console.log(`[Chatbot] Follow-up detected after search context: "${messageLower}"`)
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

    // IMPORTANT: Check if any word in the message could be a typo of a known category
    // If so, don't treat as conversational - let the fuzzy matching handle it
    const messageWords = messageLower.split(/\s+/).filter(w => w.length >= 3)
    for (const word of messageWords) {
        // Check if word is a known typo
        if (typoCorrections[word]) {
            console.log(`[Chatbot] Known typo detected: "${word}" → "${typoCorrections[word]}" - treating as search`)
            return false
        }

        // Check if word is close to a known category (fuzzy match)
        const fuzzyMatch = findClosestCategory(word)
        if (fuzzyMatch) {
            console.log(`[Chatbot] Potential typo detected: "${word}" ≈ "${fuzzyMatch.suggested}" - treating as search`)
            return false
        }

        // Check if word is a known category
        if (allKnownCategories.includes(word)) {
            return false
        }
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

    // STRICT MODE: Only add exact category/service terms, NO synonyms
    // This prevents showing unrelated categories like "food" when searching for "restaurant"

    // All known categories (business + service)
    const knownCategories = [
        // Business categories
        'restaurant', 'restaurants', 'hotel', 'hotels', 'lodge', 'lodges', 'motel', 'motels',
        'inn', 'inns', 'dhaba', 'dhabas', 'shop', 'shops', 'store', 'stores',
        'electronics', 'electronic', 'grocery', 'groceries', 'medical', 'pharmacy', 'clinic',
        'hospital', 'school', 'cafe', 'bakery', 'salon', 'gym', 'fitness', 'bank',
        'supermarket', 'mall', 'market', 'college', 'university', 'petrol', 'atm',
        'clothing', 'jewellery', 'furniture', 'hardware', 'stationery', 'books', 'toys',
        // Service categories
        'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
        'photographer', 'beautician', 'cook', 'chef', 'babysitter', 'gardener',
        'tailor', 'cleaner', 'security', 'guard', 'caregiver', 'tutor', 'teacher',
        'musician', 'dj', 'trainer', 'nurse', 'lawyer', 'advocate', 'accountant',
        'potter', 'barber', 'mason', 'welder', 'milkman', 'priest', 'pandit',
        'rickshaw', 'auto', 'mistri', 'karigar', 'rajmistri', 'nai', 'gwala', 'lohar', 'kumhar', 'pujari'
    ]

    // First, check for known category keywords in the message
    for (const category of knownCategories) {
        if (correctedMessage.includes(category)) {
            terms.add(category)
        }
    }

    // Extract nouns using NLP (for proper names like "Sharma Restaurant")
    const nouns = doc.nouns().out('array') as string[]
    nouns.forEach((noun: string) => {
        const nounLower = noun.toLowerCase().trim()
        // Only add meaningful nouns (not too short, not generic words)
        if (nounLower.length > 2 && !['the', 'for', 'and', 'any', 'some'].includes(nounLower)) {
            terms.add(nounLower)
        }
    })

    // Add full message as fallback if no terms found
    if (terms.size === 0) {
        // Add individual words from the corrected message
        const words = correctedMessage.split(/\s+/).filter(w => w.length > 2)
        words.forEach(word => terms.add(word))

        // If still empty, add the whole message
        if (terms.size === 0) {
            terms.add(correctedMessage.trim())
        }
    }

    console.log(`[Chatbot] Extracted terms (STRICT mode):`, Array.from(terms))
    return Array.from(terms).slice(0, 5) // Limit to 5 terms for focused search
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
            'restaurant', 'restaurants', 'hotel', 'hotels', 'lodge', 'lodges', 'motel', 'motels',
            'inn', 'inns', 'dhaba', 'dhabas', 'shop', 'shops', 'store', 'stores',
            'electronics', 'electronic', 'grocery', 'groceries', 'medical', 'pharmacy', 'clinic',
            'hospital', 'school', 'cafe', 'coffee', 'bakery', 'salon', 'gym', 'fitness',
            'service', 'services', 'food', 'dining', 'eatery', 'retail', 'market',
            'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
            'barber', 'tailor', 'mason', 'welder', 'tutor', 'nurse', 'guard'
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

        // Otherwise, do STRICT search - only match category, name, or tags (NO description fallback)
        // This prevents showing unrelated categories
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

                // STRICT matching - only category, name, or exact tag match
                let matchScore = 0
                const listingName = (listing.name || '').toLowerCase()
                const listingCategory = (listing.category || '').toLowerCase()
                const listingCategorySlug = (listing.categorySlug || '').toLowerCase()
                const listingTags = Array.isArray(listing.tags) ? listing.tags.map((t: string) => t.toLowerCase()) : []

                // Exact category match = highest priority (score: 100)
                if (listingCategory === termLower || listingCategorySlug === termLower) {
                    matchScore = 100
                }
                // Partial category match = high priority (score: 80)
                else if (listingCategory.includes(termLower) || listingCategorySlug.includes(termLower)) {
                    matchScore = 80
                }
                // Category contains term (e.g., "Restaurants" contains "restaurant")
                else if (termLower.includes(listingCategorySlug) || termLower.includes(listingCategory.split(' ')[0])) {
                    matchScore = 75
                }
                // Name match = medium-high priority (score: 70)
                else if (listingName.includes(termLower)) {
                    matchScore = 70
                }
                // STRICT: Only exact tag match (not partial) (score: 50)
                else if (listingTags.some((tag: string) => tag === termLower)) {
                    matchScore = 50
                }
                // NO DESCRIPTION MATCHING - this was causing unrelated results

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
 * Service-related keywords for detection
 */
const serviceKeywords = [
    // Direct service names
    'electrician', 'plumber', 'carpenter', 'painter', 'mechanic', 'driver',
    'photographer', 'beautician', 'cook', 'chef', 'babysitter', 'gardener',
    'tailor', 'cleaner', 'security', 'guard', 'caregiver', 'tutor', 'teacher',
    'musician', 'dj', 'trainer', 'nurse', 'lawyer', 'advocate', 'accountant',
    // NEW service categories
    'potter', 'barber', 'basket maker', 'mason', 'water supply', 'data entry',
    'welder', 'rickshaw', 'auto driver', 'milkman', 'priest', 'pandit',
    // Service keywords
    'ac technician', 'ac repair', 'computer technician', 'mobile repair',
    'pet care', 'pet sitter', 'fitness trainer', 'home tutor', 'house cleaner',
    // Generic service terms
    'gig', 'worker', 'service provider', 'freelancer', 'handyman', 'helper',
    'repair', 'fix', 'install', 'maintenance', 'home service', 'local worker',
    // Hindi/local terms
    'mistri', 'karigar', 'beldaar', 'rajmistri', 'electrician wala', 'plumber wala',
    'nai', 'doodh wala', 'gwala', 'lohar', 'kumhar', 'pujari'
]

/**
 * Check if query is asking for services (gig workers)
 */
function isServiceQuery(message: string): boolean {
    const messageLower = message.toLowerCase()

    // Check for direct service keywords
    for (const keyword of serviceKeywords) {
        if (messageLower.includes(keyword)) {
            return true
        }
    }

    // Check for patterns like "need a plumber", "find electrician", "looking for carpenter"
    const servicePatterns = [
        /need\s+(?:a|an)?\s*(electrician|plumber|carpenter|painter|mechanic|driver)/i,
        /find\s+(?:a|an)?\s*(electrician|plumber|carpenter|painter|mechanic|driver)/i,
        /looking\s+for\s+(?:a|an)?\s*(electrician|plumber|carpenter|painter|mechanic|driver)/i,
        /(?:ac|air\s*conditioner)\s*(repair|service|technician)/i,
        /(?:home|house)\s*(cleaning|repair|service)/i,
        /(?:mobile|phone)\s*repair/i,
        /(?:computer|laptop)\s*repair/i,
    ]

    for (const pattern of servicePatterns) {
        if (pattern.test(messageLower)) {
            return true
        }
    }

    return false
}

/**
 * Comprehensive search for services in Firestore
 * Similar to searchListingsComprehensive but for gig workers/services
 */
async function searchServicesComprehensive(searchTerms: string[], limit: number = 3) {
    try {
        const db = getAdminDb()
        const allMatches = new Map<string, any>()

        // Service category keywords for matching
        const serviceCategoryKeywords: Record<string, string[]> = {
            'electrician': ['electric', 'wiring', 'voltage', 'power', 'switch', 'fan', 'light'],
            'plumber': ['pipe', 'water', 'tap', 'bathroom', 'toilet', 'leak', 'drainage'],
            'carpenter': ['wood', 'furniture', 'door', 'window', 'cabinet', 'repair'],
            'painter': ['paint', 'wall', 'color', 'polish', 'texture', 'whitewash'],
            'ac-technician': ['ac', 'air conditioner', 'cooling', 'refrigerator', 'fridge', 'cooler'],
            'mechanic': ['car', 'bike', 'vehicle', 'engine', 'motor', 'service'],
            'driver': ['drive', 'transport', 'taxi', 'delivery', 'pickup', 'drop'],
            'computer-technician': ['computer', 'laptop', 'software', 'hardware', 'network', 'printer'],
            'mobile-repair': ['mobile', 'phone', 'screen', 'battery', 'smartphone'],
            'photographer': ['photo', 'video', 'camera', 'wedding', 'event', 'shoot'],
            'beautician': ['hair', 'makeup', 'facial', 'beauty', 'parlor', 'salon', 'bridal'],
            'cook': ['cook', 'chef', 'food', 'catering', 'party', 'tiffin', 'meal'],
            'babysitter': ['baby', 'child', 'nanny', 'care', 'daycare', 'sitter'],
            'pet-care': ['pet', 'dog', 'cat', 'grooming', 'walking', 'sitting'],
            'gardener': ['garden', 'plant', 'lawn', 'landscape', 'tree', 'flower'],
            'tailor': ['stitch', 'tailor', 'cloth', 'dress', 'alteration', 'fitting'],
            'cleaner': ['clean', 'maid', 'housekeeping', 'sweep', 'mop', 'wash', 'domestic'],
            'security': ['security', 'guard', 'watchman', 'protection', 'safety'],
            'caregiver': ['care', 'elderly', 'patient', 'nurse', 'health', 'medical'],
            'tutor': ['tuition', 'teach', 'coaching', 'study', 'exam', 'class'],
            'musician': ['music', 'dj', 'band', 'singer', 'wedding', 'party'],
            'fitness-trainer': ['gym', 'fitness', 'trainer', 'yoga', 'exercise', 'workout'],
            'nurse': ['nurse', 'medical', 'injection', 'dressing', 'patient', 'healthcare'],
            'lawyer': ['lawyer', 'advocate', 'legal', 'court', 'case', 'documentation'],
            'accountant': ['account', 'tax', 'gst', 'itr', 'ca', 'finance', 'audit'],
            // NEW categories
            'potter': ['potter', 'pottery', 'clay', 'mitti', 'matka', 'earthenware', 'ceramic', 'kulhad', 'kumhar'],
            'barber': ['barber', 'haircut', 'shave', 'shaving', 'grooming', 'nai', 'beard', 'trim'],
            'basket-maker': ['basket', 'bamboo', 'weaving', 'tokri', 'dalia', 'handicraft', 'cane'],
            'mason': ['mason', 'rajmistri', 'brick', 'cement', 'construction', 'building', 'wall', 'plastering', 'tiles'],
            'water-supply': ['water', 'jal', 'vitaran', 'tanker', 'supply', 'paani', 'pipeline', 'pump', 'boring'],
            'data-entry': ['data', 'entry', 'typing', 'operator', 'digitization', 'document', 'excel', 'form'],
            'welder': ['welder', 'welding', 'metal', 'iron', 'gate', 'grill', 'fabrication', 'steel', 'lohar'],
            'rickshaw-driver': ['rickshaw', 'auto', 'tempo', 'e-rickshaw', 'toto', 'local transport'],
            'milkman': ['milk', 'milkman', 'dairy', 'doodh', 'gwala', 'paneer', 'curd'],
            'priest': ['priest', 'pandit', 'pujari', 'puja', 'ceremony', 'religious', 'brahmin', 'pooja', 'astrology']
        }

        // Get all live services
        const servicesSnapshot = await db
            .collection('services')
            .where('status', '==', 'live')
            .get()

        for (const doc of servicesSnapshot.docs) {
            const data = doc.data()
            const service: any = { id: doc.id, ...data }

            // STRICT matching - only match category and name, no address/description fallback
            let matchScore = 0
            const serviceCategory = (service.service || service.category || '').toLowerCase()
            const serviceCategorySlug = serviceCategory.replace(/\s+/g, '-')
            const serviceName = (service.name || '').toLowerCase()
            const serviceTags = Array.isArray(service.tags) ? service.tags.map((t: string) => t.toLowerCase()) : []

            for (const term of searchTerms) {
                const termLower = term.toLowerCase()
                const termSlug = termLower.replace(/\s+/g, '-')

                // Check for EXACT category match (highest priority)
                if (serviceCategory === termLower || serviceCategorySlug === termSlug) {
                    matchScore = Math.max(matchScore, 100)
                }
                // Partial category match (service category contains search term)
                else if (serviceCategory.includes(termLower) || serviceCategorySlug.includes(termSlug)) {
                    matchScore = Math.max(matchScore, 90)
                }
                // Reverse partial (search term contains category - e.g., "electrician" contains "electric")
                else if (termLower.includes(serviceCategory) || termSlug.includes(serviceCategorySlug)) {
                    matchScore = Math.max(matchScore, 85)
                }
                // Check category keywords ONLY for the matching category
                else {
                    for (const [category, keywords] of Object.entries(serviceCategoryKeywords)) {
                        const categorySlug = category.toLowerCase()
                        // Only match if BOTH: (1) term matches a keyword AND (2) service is that category
                        if (keywords.some(kw => termLower === kw || termLower.includes(kw))) {
                            if (serviceCategory === categorySlug || serviceCategorySlug === categorySlug ||
                                serviceCategory.includes(categorySlug.replace('-', ' ')) ||
                                serviceCategorySlug.includes(categorySlug)) {
                                matchScore = Math.max(matchScore, 80)
                            }
                        }
                    }
                }

                // Check name match (provider name)
                if (serviceName.includes(termLower) && matchScore < 70) {
                    matchScore = Math.max(matchScore, 60)
                }

                // STRICT: Only EXACT tag match (not partial)
                if (serviceTags.some((tag: string) => tag === termLower)) {
                    matchScore = Math.max(matchScore, 50)
                }

                // NO ADDRESS MATCHING - this was causing unrelated results
            }

            if (matchScore > 0) {
                const existingService = allMatches.get(service.id)
                if (!existingService || matchScore > (existingService.matchScore || 0)) {
                    allMatches.set(service.id, { ...service, matchScore })
                }
            }
        }

        // Convert Map to array and sort by match score, then by quality rating
        const results = Array.from(allMatches.values())
            .sort((a, b) => {
                const scoreA = a.matchScore || 0
                const scoreB = b.matchScore || 0
                if (scoreB !== scoreA) {
                    return scoreB - scoreA
                }
                // If same score, sort by quality rating
                return (b.qualityRating || 0) - (a.qualityRating || 0)
            })
            .slice(0, limit)

        console.log(`[Chatbot] Found ${allMatches.size} service matches, returning top ${results.length} (limit: ${limit})`)
        return results

    } catch (error) {
        console.error("Service search error:", error)
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
 * @param services - Retrieved services from database (optional)
 * @param conversationHistory - Previous messages for context
 * @returns AI-generated conversational response with details
 */
async function generateResponse(
    userMessage: string,
    searchTerms: string[],
    listings: any[],
    services: any[] = [],
    conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []
) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        // Build conversation context
        const historyContext = conversationHistory.length > 0
            ? conversationHistory.slice(-6).map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.message}`).join('\n')
            : 'No previous conversation'

        // Craft detailed context from business listings
        const listingsContext = listings.length > 0
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
            : "No business listings found matching your search."

        // Craft detailed context from services
        const servicesContext = services.length > 0
            ? services.map((service, idx) => {
                return `${idx + 1}. **${service.name || 'Unknown'}** (${service.service || service.category || 'Service'})
   Service: ${service.service || 'N/A'}
   Location: ${service.address || 'Not provided'}
   WhatsApp: ${service.whatsapp || 'Not provided'}
   Phone: ${service.contact || 'Not provided'}
   Charges: ₹${service.chargesPerHour || 'N/A'}/hr ${service.negotiable ? '(Negotiable)' : ''}
   Quality Rating: ${'⭐'.repeat(Math.min(service.qualityRating || 0, 5))} (${service.qualityRating || 0}/5)
   Working Hours: ${service.workingHours || 'Not specified'}
   Experience: ${service.experienceYears ? `${service.experienceYears} years` : 'Not specified'}`
            }).join('\n\n')
            : ""

        // Determine response type based on what was found
        const hasListings = listings.length > 0
        const hasServices = services.length > 0

        let resultsSection = ''
        if (hasListings && hasServices) {
            resultsSection = `**Businesses Found:**
${listingsContext}

**Service Providers Found:**
${servicesContext}`
        } else if (hasServices) {
            resultsSection = `**Service Providers Found:**
${servicesContext}`
        } else if (hasListings) {
            resultsSection = `**Businesses Found:**
${listingsContext}`
        } else {
            resultsSection = "No listings or service providers found matching your search."
        }

        // Engineer the prompt for detailed responses
        const prompt = `You are the Directory AI Chatbot for ${CITY_NAME} district, ${STATE_NAME}, India.

Previous Conversation:
${historyContext}

Current User Query: "${userMessage}"
Search Terms Used: ${searchTerms.join(', ')}

${resultsSection}

CRITICAL Instructions:
1. NEVER ask follow-up questions like "What area?" or "Any specific requirements?" - just show the results directly
2. If results are found: List them immediately with details (name, location, phone/charges)
3. If NO results found: Say "Sorry, I couldn't find any [category] in ${CITY_NAME} right now. Try browsing our categories or check back later."
4. For BUSINESSES: mention NAME, LOCATION, and CONTACT (phone)
5. For SERVICE PROVIDERS: mention NAME, SERVICE TYPE, LOCATION, WHATSAPP/PHONE, CHARGES, and QUALITY RATING
6. Format with line breaks and bullet points for readability
7. Use **bold** for names
8. Keep response 2-4 sentences maximum - be concise
9. Do NOT use external knowledge
10. NEVER reset or forget context - use previous conversation history

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

        // **Priority 2.5: Check if user is confirming a previous suggestion**
        // Look for patterns like bot asking "Are you searching for 'X'?" and user responding with confirmation
        const lastBotMessage = conversationHistory.slice(-2).find((msg: { role: string, message: string }) => msg.role === 'bot')
        if (lastBotMessage && lastBotMessage.message.includes('Are you searching for')) {
            // Extract the suggested category from the previous bot message
            const suggestionMatch = lastBotMessage.message.match(/Are you searching for ['"]([^'"]+)['"]/)
            if (suggestionMatch && isConfirmationResponse(message)) {
                const suggestedCategory = suggestionMatch[1]
                console.log(`[Chatbot] User confirmed suggestion: "${suggestedCategory}"`)

                // Use the suggested category for search
                const searchTerms = [suggestedCategory]
                const searchingForService = isServiceQuery(suggestedCategory)

                let listings: any[] = []
                let services: any[] = []

                if (searchingForService) {
                    services = await searchServicesComprehensive(searchTerms, 3)
                } else {
                    listings = await searchListingsComprehensive(searchTerms, 3)
                }

                const reply = await generateResponse(suggestedCategory, searchTerms, listings, services, conversationHistory)

                return NextResponse.json({
                    reply,
                    results: listings,
                    services: services,
                    searchTerms,
                    totalFound: listings.length + services.length,
                    isContactQuery: false,
                    isListingGuideQuery: false,
                    conversational: false,
                    isServiceQuery: searchingForService,
                    confirmedSuggestion: true,
                    success: true
                })
            }
        }

        // **Priority 2.6: Check for fuzzy match / typo detection for unrecognized words**
        // If the word doesn't match any known category, check for close matches
        const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 2)
        let fuzzyMatchFound: { word: string, suggested: string } | null = null

        for (const word of words) {
            // First check if word is already corrected via typoCorrections
            if (typoCorrections[word]) {
                // Typo correction will handle this automatically, continue to search
                break
            }

            // Check if word is a known category
            if (allKnownCategories.includes(word)) {
                break // It's a valid category, proceed to search
            }

            // Try fuzzy matching for unknown words
            const match = findClosestCategory(word)
            if (match) {
                fuzzyMatchFound = { word, suggested: match.suggested }
                break
            }
        }

        // If fuzzy match found and word isn't already being corrected, ask for confirmation
        if (fuzzyMatchFound && !typoCorrections[fuzzyMatchFound.word]) {
            console.log(`[Chatbot] Fuzzy match detected: "${fuzzyMatchFound.word}" → "${fuzzyMatchFound.suggested}"`)

            const reply = `I noticed you searched for "${fuzzyMatchFound.word}". Are you searching for "${fuzzyMatchFound.suggested}"? Please confirm by typing "yes" or enter the correct keyword.`

            return NextResponse.json({
                reply,
                results: [],
                services: [],
                searchTerms: [fuzzyMatchFound.word],
                totalFound: 0,
                isContactQuery: false,
                isListingGuideQuery: false,
                conversational: false,
                fuzzyMatch: true,
                suggestedCategory: fuzzyMatchFound.suggested,
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

        // **Priority 4: Business and/or Service search query**

        // Detect if requesting multiple results (plural)
        const requestingMultiple = isRequestingMultipleResults(message)
        const resultLimit = requestingMultiple ? 3 : 1

        // Check if this is a service-related query
        const searchingForService = isServiceQuery(message)

        console.log(`[Chatbot] Search query - Type: ${searchingForService ? 'SERVICE' : 'BUSINESS'}, Requesting ${requestingMultiple ? 'MULTIPLE' : 'SINGLE'} result(s) (limit: ${resultLimit})`)

        // **Stage 1: Query Breakdown (with typo correction)**
        const searchTerms = extractSearchTerms(message)
        console.log(`[Chatbot] Extracted search terms:`, searchTerms)

        // **Stage 2: Comprehensive Multi-Field Search with dynamic limit**
        let listings: any[] = []
        let services: any[] = []

        if (searchingForService) {
            // For service queries, search services primarily
            services = await searchServicesComprehensive(searchTerms, resultLimit)
            console.log(`[Chatbot] Found ${services.length} services (limit: ${resultLimit})`)

            // NO FALLBACK TO LISTINGS - strict category matching only
            // If no services found for the category, that's okay - AI will explain
        } else {
            // For business queries, search listings primarily
            listings = await searchListingsComprehensive(searchTerms, resultLimit)
            console.log(`[Chatbot] Found ${listings.length} listings (limit: ${resultLimit})`)

            // NO FALLBACK TO OTHER CATEGORIES - strict category matching only
        }

        // **Stage 3: AI Response Generation with conversation history**
        const reply = await generateResponse(message, searchTerms, listings, services, conversationHistory)
        console.log(`[Chatbot] Generated response: ${reply.substring(0, 100)}...`)

        // Return comprehensive response
        return NextResponse.json({
            reply,
            results: listings,
            services: services,
            searchTerms,
            totalFound: listings.length + services.length,
            isContactQuery: false,
            isListingGuideQuery: false,
            conversational: false,
            isServiceQuery: searchingForService,
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
