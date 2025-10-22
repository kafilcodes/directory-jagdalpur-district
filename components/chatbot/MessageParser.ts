/**
 * Message Parser for React Chatbot Kit
 * 
 * Processes user messages and determines which action to trigger.
 * In our implementation, all messages are passed to the AI for processing.
 */
class MessageParser {
    actionProvider: any

    constructor(actionProvider: any) {
        this.actionProvider = actionProvider
    }

    parse(message: string) {
        // Pass all messages to the AI handler
        this.actionProvider.handleUserMessage(message)
    }
}

export default MessageParser
