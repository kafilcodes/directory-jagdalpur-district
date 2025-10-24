"use client"

/**
 * Action Provider for React Chatbot Kit
 * 
 * Handles user messages and connects to our Custom RAG API.
 * Implements comprehensive error handling, loading states, and listing display.
 * 
 * Features:
 * - Network error detection
 * - Offline status handling
 * - Animated typing indicator
 * - Formatted listing cards with images
 * - Retry functionality
 * - Rate limiting (10 requests per session)
 * 
 * Architecture:
 * - Calls /api/chatbot (our bespoke RAG implementation)
 * - Displays listings with images from photos[0]
 * - Uses Gemini 2.0 Flash for natural language generation
 */
class ActionProvider {
    createChatBotMessage: any
    setState: any
    createClientMessage: any
    private requestCount: number = 0
    private readonly MAX_REQUESTS: number = 10
    private conversationHistory: Array<{ role: 'user' | 'bot', message: string }> = []

    constructor(
        createChatBotMessage: any,
        setStateFunc: any,
        createClientMessage: any
    ) {
        this.createChatBotMessage = createChatBotMessage
        this.setState = setStateFunc
        this.createClientMessage = createClientMessage
    }

    /**
     * Check if user is online
     */
    private isOnline(): boolean {
        return typeof navigator !== 'undefined' && navigator.onLine
    }

    /**
     * Play response sound for better UX feedback
     */
    private playResponseSound() {
        try {
            if (typeof window !== 'undefined') {
                const audio = new Audio('/response.mp3')
                audio.volume = 0.7 // Increased volume to 70% for better audibility
                audio.play().catch(error => {
                    // Silently fail if audio can't play (browser restrictions, missing file, etc.)
                    console.warn('[ActionProvider] Could not play response sound:', error)
                })
            }
        } catch (error) {
            // Silently fail - don't disrupt user experience
            console.warn('[ActionProvider] Audio playback error:', error)
        }
    }

    /**
     * Handles user messages with comprehensive error handling and listing display
     */
    async handleUserMessage(message: string) {
        // Validate message
        if (!message || message.trim().length === 0) {
            console.warn('[ActionProvider] Empty message ignored')
            return
        }

        // Check rate limit
        if (this.requestCount >= this.MAX_REQUESTS) {
            const { toastRateLimit } = await import('@/lib/toastUtils')
            toastRateLimit('chatbot')
            const errorMessage = this.createChatBotMessage(
                "You've reached the request limit for this session. Please refresh the page to continue chatting.",
                { delay: 300 }
            )
            this.setState((prev: any) => ({
                ...prev,
                messages: [...prev.messages, errorMessage]
            }))
            return
        }

        // Check if offline
        if (!this.isOnline()) {
            this.showOfflineError()
            return
        }

        // Increment request count
        this.requestCount++

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            message: message.trim()
        })

        // Keep only last 10 messages (5 exchanges) for context
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10)
        }

        // Show "thinking..." indicator
        const thinkingMessage = this.createChatBotMessage(
            "thinking...",
            {
                delay: 100,
                withAvatar: true
            }
        )

        this.setState((prev: any) => ({
            ...prev,
            messages: [...prev.messages, thinkingMessage]
        }))

        try {
            // Call our custom RAG API with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message.trim(),
                    conversationHistory: this.conversationHistory.slice(0, -1) // Send history without current message
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[Chatbot] API error:', response.status, errorData)
                throw new Error(errorData.error || `API error: ${response.status}`)
            }

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || "API returned unsuccessful response")
            }

            // Extract data
            const aiResponse = data.reply || "I received your message but couldn't generate a response."
            const listings = data.results || []
            const isContactQuery = data.isContactQuery || false
            const isListingGuideQuery = data.isListingGuideQuery || false

            console.log(`[Chatbot] Received ${listings.length} results, contact=${isContactQuery}, guide=${isListingGuideQuery}`)

            // Add bot response to history
            this.conversationHistory.push({
                role: 'bot',
                message: aiResponse
            })

            // Play response sound for feedback
            this.playResponseSound()

            // Remove "thinking..." and add responses
            this.setState((prev: any) => {
                // Remove the thinking message
                const messagesWithoutThinking = prev.messages.filter(
                    (msg: any) => msg.message !== "thinking..."
                )

                const messages = [...messagesWithoutThinking]

                // Add formatted text response directly in the message (NOT as widget)
                // This ensures it gets the red bubble styling
                const textMessage = this.createChatBotMessage(aiResponse, {
                    delay: 0
                })
                messages.push(textMessage)

                // Add listing cards ONLY if listings found (and not contact/guide query)
                if (listings.length > 0 && !isContactQuery && !isListingGuideQuery) {
                    const listingsMessage = this.createChatBotMessage("", {
                        widget: "listingCards",
                        payload: { listings },
                        loading: false,
                        delay: 0
                    })
                    messages.push(listingsMessage)
                }

                return {
                    ...prev,
                    messages,
                }
            })

        } catch (error: any) {
            console.error("[Chatbot] Error:", error)

            // Remove "thinking..." message
            this.setState((prev: any) => {
                const messagesWithoutThinking = prev.messages.filter(
                    (msg: any) => msg.message !== "thinking..."
                )

                // Determine error type
                let errorMessage = "I'm having trouble right now. Please try again."

                if (error.name === 'AbortError') {
                    errorMessage = "Request timed out. Please try again."
                } else if (error.message.includes('fetch') || error.message.includes('network')) {
                    errorMessage = "Network error. Check your connection and try again."
                } else if (!this.isOnline()) {
                    errorMessage = "You're offline. Please check your internet connection."
                } else if (error.message) {
                    // Use the actual error message from API
                    errorMessage = `Error: ${error.message}`
                }

                // Show error
                const errorWidget = this.createChatBotMessage("", {
                    widget: "errorMessage",
                    payload: {
                        message: errorMessage,
                        onRetry: () => this.handleUserMessage(message)
                    }
                })

                return {
                    ...prev,
                    messages: [...messagesWithoutThinking, errorWidget],
                }
            })
        }
    }

    /**
     * Shows offline error immediately
     */
    private showOfflineError() {
        const errorWidget = this.createChatBotMessage("", {
            widget: "errorMessage",
            payload: {
                message: "You're offline. Please check your internet connection and try again.",
                onRetry: null
            }
        })

        this.setState((prev: any) => ({
            ...prev,
            messages: [...prev.messages, errorWidget],
        }))
    }
}

export default ActionProvider
