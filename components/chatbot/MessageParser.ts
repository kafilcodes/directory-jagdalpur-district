/**
 * Message Parser for React Chatbot Kit
 * 
 * Processes user messages and determines which action to trigger.
 * In our implementation, all messages are passed to the AI for processing.
 * Validates messages to prevent empty submissions.
 */
class MessageParser {
    actionProvider: any

    constructor(actionProvider: any) {
        this.actionProvider = actionProvider
    }

    parse(message: string) {
        // Validate message is not empty or just whitespace
        if (!message || message.trim().length === 0) {
            console.warn('[MessageParser] Empty message ignored')
            return
        }

        // Pass all valid messages to the AI handler
        this.actionProvider.handleUserMessage(message.trim())
    }
}

export default MessageParser
