"use client"

import React from 'react'

/**
 * FormattedBotMessage Component
 * 
 * Custom bot message renderer that formats text while keeping the red bubble design.
 * Replaces react-chatbot-kit's default message renderer.
 * 
 * Features:
 * - Keeps red gradient bubble background
 * - Keeps white text color
 * - Formats **bold** to <strong>
 * - Converts line breaks properly
 * - Removes asterisks
 * - Smaller, cleaner text
 */

interface FormattedBotMessageProps {
    message: string
    [key: string]: any
}

export const FormattedBotMessage: React.FC<FormattedBotMessageProps> = ({ message, ...props }) => {

    /**
     * Format the message text - remove asterisks, handle line breaks, format bold
     */
    const formatMessage = (text: string): React.ReactNode => {
        if (!text) return null

        // Split by line breaks
        const lines = text.split('\n')
        const elements: React.ReactNode[] = []

        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                elements.push(<br key={`br-${lineIndex}`} />)
            }

            // Process bold text (**text**)
            const parts: React.ReactNode[] = []
            const boldRegex = /\*\*([^*]+)\*\*/g
            let lastIndex = 0
            let match
            let partKey = 0

            while ((match = boldRegex.exec(line)) !== null) {
                // Add text before bold
                if (match.index > lastIndex) {
                    parts.push(
                        <span key={`text-${lineIndex}-${partKey++}`}>
                            {line.substring(lastIndex, match.index)}
                        </span>
                    )
                }

                // Add bold text
                parts.push(
                    <strong key={`bold-${lineIndex}-${partKey++}`}>
                        {match[1]}
                    </strong>
                )

                lastIndex = match.index + match[0].length
            }

            // Add remaining text
            if (lastIndex < line.length) {
                parts.push(
                    <span key={`text-${lineIndex}-${partKey++}`}>
                        {line.substring(lastIndex)}
                    </span>
                )
            }

            // Add all parts for this line
            elements.push(...parts)
        })

        return <>{elements}</>
    }

    return (
        <div className="react-chatbot-kit-chat-bot-message">
            {formatMessage(message)}
        </div>
    )
}

export default FormattedBotMessage
