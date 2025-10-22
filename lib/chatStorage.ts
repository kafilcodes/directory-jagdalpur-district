/**
 * Chat History Storage Utility
 * 
 * Handles local storage operations for chat persistence
 * with error handling and validation
 */

const CHAT_STORAGE_KEY = 'directory_chatbot_history'
const CHAT_SESSION_KEY = 'directory_chatbot_session'

export interface ChatMessage {
    id: string | number
    type: 'bot' | 'user'
    message: string
    widget?: string
    payload?: any
    loading?: boolean
    timestamp?: number
}

export interface ChatSession {
    messages: ChatMessage[]
    lastUpdated: number
    sessionId: string
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get current session ID or create new one
 */
export function getSessionId(): string {
    try {
        if (typeof window === 'undefined') return generateSessionId()

        let sessionId = sessionStorage.getItem(CHAT_SESSION_KEY)
        if (!sessionId) {
            sessionId = generateSessionId()
            sessionStorage.setItem(CHAT_SESSION_KEY, sessionId)
        }
        return sessionId
    } catch (error) {
        console.error('[ChatStorage] Error getting session ID:', error)
        return generateSessionId()
    }
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(messages: ChatMessage[]): boolean {
    try {
        if (typeof window === 'undefined') return false

        const session: ChatSession = {
            messages: messages.filter(msg => !msg.loading), // Don't save loading messages
            lastUpdated: Date.now(),
            sessionId: getSessionId()
        }

        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(session))
        console.log('[ChatStorage] Saved chat history:', messages.length, 'messages')
        return true
    } catch (error) {
        console.error('[ChatStorage] Error saving chat history:', error)
        return false
    }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): ChatMessage[] | null {
    try {
        if (typeof window === 'undefined') return null

        const stored = localStorage.getItem(CHAT_STORAGE_KEY)
        if (!stored) return null

        const session: ChatSession = JSON.parse(stored)

        // Validate session structure
        if (!session.messages || !Array.isArray(session.messages)) {
            console.warn('[ChatStorage] Invalid session structure')
            return null
        }

        // Check if session is from current browsing session
        const currentSessionId = getSessionId()
        if (session.sessionId !== currentSessionId) {
            console.log('[ChatStorage] Different session detected, starting fresh')
            clearChatHistory() // Clear old session
            return null
        }

        // Session age check (optional: clear after 24 hours)
        const MAX_SESSION_AGE = 24 * 60 * 60 * 1000 // 24 hours
        const age = Date.now() - session.lastUpdated
        if (age > MAX_SESSION_AGE) {
            console.log('[ChatStorage] Session expired, starting fresh')
            clearChatHistory()
            return null
        }

        console.log('[ChatStorage] Loaded chat history:', session.messages.length, 'messages')
        return session.messages
    } catch (error) {
        console.error('[ChatStorage] Error loading chat history:', error)
        return null
    }
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): boolean {
    try {
        if (typeof window === 'undefined') return false

        localStorage.removeItem(CHAT_STORAGE_KEY)
        console.log('[ChatStorage] Cleared chat history')
        return true
    } catch (error) {
        console.error('[ChatStorage] Error clearing chat history:', error)
        return false
    }
}

/**
 * Get chat history size in bytes
 */
export function getChatHistorySize(): number {
    try {
        if (typeof window === 'undefined') return 0

        const stored = localStorage.getItem(CHAT_STORAGE_KEY)
        return stored ? new Blob([stored]).size : 0
    } catch (error) {
        console.error('[ChatStorage] Error getting chat history size:', error)
        return 0
    }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
    try {
        if (typeof window === 'undefined') return false

        const test = '__storage_test__'
        localStorage.setItem(test, test)
        localStorage.removeItem(test)
        return true
    } catch (error) {
        console.warn('[ChatStorage] Storage not available:', error)
        return false
    }
}
