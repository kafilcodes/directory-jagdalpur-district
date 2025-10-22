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
     * Handles user messages with comprehensive error handling and listing display
     */
    async handleUserMessage(message: string) {
        // Check if offline
        if (!this.isOnline()) {
            this.showOfflineError()
            return
        }

        try {
            // Call our custom RAG API with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
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

            // Add responses (text response always, listing cards only if listings > 0)
            this.setState((prev: any) => {
                const messages = [...prev.messages]

                // Add text response (this will show built-in "..." while rendering)
                const textMessage = this.createChatBotMessage(aiResponse, {})
                messages.push(textMessage)

                // Add listing cards ONLY if listings found (and not contact/guide query)
                if (listings.length > 0 && !isContactQuery && !isListingGuideQuery) {
                    // Add listing cards without built-in loading indicator
                    const listingsMessage = this.createChatBotMessage("", {
                        widget: "listingCards",
                        payload: { listings },
                        loading: false,  // Disable built-in loading for listing widget
                        delay: 0         // Show immediately with text response
                    })
                    messages.push(listingsMessage)
                }

                return {
                    ...prev,
                    messages,
                }
            })

        } catch (error: any) {
            console.error("Chatbot error:", error)

            // Determine error type
            let errorType = "general"
            let errorMessage = "I'm having trouble right now. Please try again."

            if (error.name === 'AbortError') {
                errorType = "timeout"
                errorMessage = "Request timed out. Please try again."
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
                errorType = "network"
                errorMessage = "Network error. Check your connection and try again."
            } else if (!this.isOnline()) {
                errorType = "offline"
                errorMessage = "You're offline. Please check your internet connection."
            }

            // Show error
            this.setState((prev: any) => {
                // Show error widget with retry option
                const errorWidget = this.createChatBotMessage("", {
                    widget: "errorMessage",
                    payload: {
                        message: errorMessage,
                        onRetry: () => this.handleUserMessage(message) // Retry with same message
                    }
                })

                return {
                    ...prev,
                    messages: [...prev.messages, errorWidget],
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
