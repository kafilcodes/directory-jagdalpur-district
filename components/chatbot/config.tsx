import React from "react"
import { createChatBotMessage } from "react-chatbot-kit"
import { Bot } from "lucide-react"
import { TypingIndicator } from "./TypingIndicator"
import { ListingCard } from "./ListingCard"
import { ErrorMessage } from "./ErrorMessage"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";

/**
 * React Chatbot Kit Configuration
 * 
 * Defines the bot's personality, initial messages, widgets, and styling.
 * 100% Tailwind CSS - NO external CSS files
 */

// Custom bot avatar component using Lucide Bot icon
const BotAvatar = () => {
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-md flex-shrink-0">
            <Bot
                className="w-5 h-5"
                strokeWidth={2.5}
                color="white"
                stroke="white"
                style={{
                    color: 'white',
                    stroke: 'white',
                    strokeWidth: '2.5',
                    fill: 'none'
                }}
            />
        </div>
    )
}

const config = {
    // Bot configuration
    botName: "Directory AI Chatbot",

    // Custom bot avatar
    botAvatar: BotAvatar,

    // Initial message shown when chat opens
    initialMessages: [
        createChatBotMessage(
            `Hi! I'm your Directory AI Chatbot. I can help you find local businesses in ${CITY_NAME}. Try asking me about restaurants, hotels, shops, or any service you're looking for!`,
            {}
        ),
    ],

    // Custom styles matching our design system
    customStyles: {
        // Bot message styling - REMOVED (using inline styles in Chatbot.tsx instead)
        botMessageBox: {
            // Styles applied via inline CSS in Chatbot.tsx
        },
        chatButton: {
            backgroundColor: "#EF4444",
        },
        // User message styling - REMOVED (using inline styles in Chatbot.tsx instead)
        userMessageBox: {
            // Styles applied via inline CSS in Chatbot.tsx
        },
    },

    // Widget configuration
    customComponents: {},

    // Widgets for dynamic content
    widgets: [
        {
            widgetName: "listingCard",
            widgetFunc: (props: any) => <ListingCard listing={props.payload.listing} />,
        },
        {
            widgetName: "listingCards",
            widgetFunc: (props: any) => (
                <div className="flex flex-col gap-2 items-start">
                    {props.payload.listings.map((listing: any) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            ),
        },
        {
            widgetName: "errorMessage",
            widgetFunc: (props: any) => (
                <ErrorMessage
                    message={props.payload.message}
                    onRetry={props.payload.onRetry}
                />
            ),
        },
    ],
}

export default config
