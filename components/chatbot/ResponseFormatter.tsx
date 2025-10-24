"use client"

import React from 'react'

/**
 * ResponseFormatter Component
 * 
 * Formats AI chatbot responses by converting markdown-style formatting 
 * to proper HTML with styling.
 * 
 * Features:
 * - Converts **bold** to <strong>
 * - Converts line breaks to <br />
 * - Converts bullet points (-, •, *) to proper <ul><li>
 * - Removes asterisks and other markdown symbols
 * - Adds proper spacing and padding
 * - Maintains readability with clean formatting
 * 
 * Usage:
 * <ResponseFormatter text={botMessage} />
 */

interface ResponseFormatterProps {
    text: string
}

export const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ text }) => {

    /**
     * Parse and format the response text
     */
    const formatResponse = (rawText: string): React.ReactElement[] => {
        const elements: React.ReactElement[] = []

        // Split by double line breaks for paragraphs
        const paragraphs = rawText.split('\n\n')

        paragraphs.forEach((paragraph, pIndex) => {
            // Trim whitespace
            const trimmed = paragraph.trim()
            if (!trimmed) return

            // Check if this is a bulleted list
            const lines = trimmed.split('\n')
            const isBulletList = lines.every(line =>
                line.trim().match(/^[-•*]\s+/) || line.trim().length === 0
            )

            if (isBulletList && lines.length > 1) {
                // Render as bullet list
                const listItems = lines
                    .filter(line => line.trim().length > 0)
                    .map((line, lIndex) => {
                        // Remove bullet symbols and trim
                        const cleanLine = line.replace(/^[-•*]\s+/, '').trim()
                        const formatted = formatInlineText(cleanLine)
                        return <li key={`${pIndex}-${lIndex}`} className="mb-0.5 sm:mb-1">{formatted}</li>
                    })

                elements.push(
                    <ul key={`ul-${pIndex}`} className="list-disc list-outside ml-3 sm:ml-4 my-1 sm:my-1.5 space-y-0.5 sm:space-y-1">
                        {listItems}
                    </ul>
                )
            } else {
                // Render as paragraph with inline formatting
                const formatted = formatInlineText(trimmed)
                elements.push(
                    <p key={`p-${pIndex}`} className="mb-1.5 sm:mb-2 last:mb-0 leading-snug">
                        {formatted}
                    </p>
                )
            }
        })

        return elements
    }

    /**
     * Format inline text (bold, line breaks, emojis)
     */
    const formatInlineText = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = []
        let currentText = text
        let key = 0

        // Split by single line breaks
        const lines = currentText.split('\n')

        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                parts.push(<br key={`br-${key++}`} />)
            }

            // Process bold text (**text**)
            const boldRegex = /\*\*([^*]+)\*\*/g
            let lastIndex = 0
            let match

            while ((match = boldRegex.exec(line)) !== null) {
                // Add text before bold
                if (match.index > lastIndex) {
                    parts.push(
                        <span key={`text-${key++}`}>
                            {line.substring(lastIndex, match.index)}
                        </span>
                    )
                }

                // Add bold text
                parts.push(
                    <strong key={`bold-${key++}`} className="font-semibold">
                        {match[1]}
                    </strong>
                )

                lastIndex = match.index + match[0].length
            }

            // Add remaining text
            if (lastIndex < line.length) {
                parts.push(
                    <span key={`text-${key++}`}>
                        {line.substring(lastIndex)}
                    </span>
                )
            }
        })

        return <>{parts}</>
    }

    return (
        <div className="response-formatter text-[0.6875rem] sm:text-xs text-white leading-snug">
            {formatResponse(text)}
        </div>
    )
}
