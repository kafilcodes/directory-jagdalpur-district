import { createChatBotMessage } from "react-chatbot-kit"
import { BotAvatar } from "./BotAvatar"
import { ListingCard } from "./ListingCard"
import { ErrorMessage } from "./ErrorMessage"
import { TypingIndicator } from "./TypingIndicator"
import React from "react"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";

/**
 * React Chatbot Kit Configuration
 * 
 * Defines the bot's personality, initial messages, and styling.
 * Adheres to our Design System & Principles.md color palette.
 */
const config = {
    // Bot configuration
    botName: "Directory AI Chatbot",

    // Initial message shown when chat opens
    initialMessages: [
        createChatBotMessage(
            `Hi! I'm your Directory AI Chatbot. I can help you find local businesses in ${CITY_NAME}. Try asking me about restaurants, hotels, shops, or any service you're looking for!`,
            {}
        ),
    ],

    // Custom styles matching our design system
    customStyles: {
        // Bot message styling - uses our Accent Red
        botMessageBox: {
            backgroundColor: "#EF4444", // red-500
            maxWidth: "85%", // Ensure proper width
        },
        chatButton: {
            backgroundColor: "#EF4444", // red-500
        },
        // Fix for user message width
        userMessageBox: {
            backgroundColor: "#ffffff", // white
            color: "#1F2937", // gray-800 text
            maxWidth: "85%", // Ensure proper width
            border: "1px solid #e5e7eb", // gray-200 border
        },
    },

    // Widget configuration
    customComponents: {
        // Custom bot avatar
        botAvatar: (props: any) => React.createElement(BotAvatar, props),

        // Widgets for listing cards
        listingCard: (props: any) => React.createElement(ListingCard, { listing: props.payload.listing }),

        // Multiple listings widget
        listingCards: (props: any) => React.createElement('div', { className: 'space-y-2' },
            props.payload.listings.map((listing: any) =>
                React.createElement(ListingCard, { key: listing.id, listing })
            )
        ),

        // Error widget
        errorMessage: (props: any) => React.createElement(ErrorMessage, {
            message: props.payload.message,
            onRetry: props.payload.onRetry
        }),

        // Typing indicator
        typingIndicator: (props: any) => React.createElement(TypingIndicator, props),
    },
}

export default config
