"use client"

import { useEffect, useState, useRef } from "react"
import ReactChatbot from "react-chatbot-kit"
import Image from "next/image"
import { BotMessageSquare } from 'lucide-react';

import config from "./config"
import MessageParser from "./MessageParser"
import ActionProvider from "./ActionProvider"
import { ChevronDown } from "lucide-react"
// localStorage history removed - chatbot now starts fresh each session

/**
 * Main Chatbot Container Component
 * 
 * Integrates react-chatbot-kit library with our custom configuration,
 * message parser, and action provider.
 * 
 * Features:
 * - Smooth fade-in/slide-up animation on open
 * - Fully responsive design with mobile-first approach
 * - Positioned in bottom-right corner (above FAB)
 * - Auto-scroll to bottom on new messages
 * - 100% Tailwind CSS - NO external CSS files
 * 
 * @param onClose - Callback to close the chatbot
 */
interface ChatbotContainerProps {
    onClose: () => void
}

export function Chatbot({ onClose }: ChatbotContainerProps) {
    const [isVisible, setIsVisible] = useState(false)
    const messageContainerRef = useRef<HTMLDivElement>(null)
    const chatbotRef = useRef<HTMLDivElement>(null)

    // localStorage history functionality removed - chatbot starts fresh each session
    // This prevents storage bugs and unnecessary data persistence

    // Trigger animation after mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            const container = document.querySelector('.react-chatbot-kit-chat-message-container')
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }

        // Scroll on mount and when messages change
        const observer = new MutationObserver(scrollToBottom)
        const container = document.querySelector('.react-chatbot-kit-chat-message-container')

        if (container) {
            observer.observe(container, { childList: true, subtree: true })
            scrollToBottom()
        }

        return () => observer.disconnect()
    }, [])

    // Listen for close chatbot event from listing cards
    useEffect(() => {
        const handleCloseChatbot = () => {
            onClose()
        }

        window.addEventListener('closeChatbot', handleCloseChatbot)
        return () => {
            window.removeEventListener('closeChatbot', handleCloseChatbot)
        }
    }, [onClose])

    // Add input validation and send button disable logic
    useEffect(() => {
        const inputField = document.querySelector('.react-chatbot-kit-chat-input') as HTMLInputElement
        const sendButton = document.querySelector('.react-chatbot-kit-chat-btn-send') as HTMLButtonElement

        if (!inputField || !sendButton) return

        // Set max length
        inputField.setAttribute('maxLength', '100')

        // Function to update button state
        const updateButtonState = () => {
            const value = inputField.value.trim()
            if (value.length === 0) {
                sendButton.disabled = true
                sendButton.style.opacity = '0.4'
                sendButton.style.cursor = 'not-allowed'
            } else {
                sendButton.disabled = false
                sendButton.style.opacity = '1'
                sendButton.style.cursor = 'pointer'
            }
        }

        // Initial state (disabled)
        updateButtonState()

        // Listen to input changes
        inputField.addEventListener('input', updateButtonState)
        inputField.addEventListener('keyup', updateButtonState)

        return () => {
            inputField.removeEventListener('input', updateButtonState)
            inputField.removeEventListener('keyup', updateButtonState)
        }
    }, [])

    // Handle click outside to close chatbot
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
                // Check if click is not on the FAB button (which has z-50)
                const target = event.target as HTMLElement
                const isFabButton = target.closest('button[aria-label*="chatbot"]')

                if (!isFabButton) {
                    onClose()
                }
            }
        }

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    return (
        <div
            ref={chatbotRef}
            className={`fixed z-40 transition-all duration-300 
                bottom-14 right-1 left-1 sm:bottom-16 sm:right-3 sm:left-auto sm:w-full sm:max-w-[280px]
                md:bottom-20 md:right-4 md:max-w-[360px] lg:max-w-[400px]
                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
            {/* Chat Container - Mobile First Design */}
            <div className="flex flex-col overflow-hidden rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-2xl">
                {/* Custom Header */}
                <div className="flex items-center justify-between bg-red-500 px-2 py-1.5 sm:px-3 sm:py-2 text-white">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <BotMessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-semibold">Directory AI</span>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] sm:text-xs opacity-90">Online</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-0.5 sm:p-1 transition-colors hover:bg-red-600 active:scale-95"
                        aria-label="Minimize chat"
                    >
                        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                </div>

                {/* Chatbot Interface with Responsive Height - Mobile First, Desktop Larger */}
                <div className="h-[280px] sm:h-[340px] md:h-[420px] lg:h-[480px] w-full flex flex-col overflow-hidden [&_.react-chatbot-kit-chat-container]:w-full [&_.react-chatbot-kit-chat-container]:h-full [&_.react-chatbot-kit-chat-container]:flex [&_.react-chatbot-kit-chat-container]:flex-col ">
                    <ReactChatbot
                        config={config}
                        messageParser={MessageParser}
                        actionProvider={ActionProvider}
                        headerText=""
                        placeholderText="Type your message..."
                    // No message history persistence - fresh session each time
                    />
                </div>
            </div>

            {/* Tailwind-based Styles - 100% Override react-chatbot-kit defaults */}
            <style jsx global>{`
                /* Core Layout */
                .react-chatbot-kit-chat-container {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                }

                .react-chatbot-kit-chat-inner-container {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                }

                /* Messages Container */
                .react-chatbot-kit-chat-message-container {
                    flex: 1 !important;
                    width: 100% !important;
                    padding: 0.375rem !important;
                    padding-bottom: 0.25rem !important;
                    overflow-y: auto !important;
                    background-color: #ffffff !important;
                    margin-bottom: 0 !important;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-message-container {
                        padding: 0.5rem !important;
                        padding-bottom: 0.375rem !important;
                    }
                }

                .react-chatbot-kit-chat-message-container::-webkit-scrollbar {
                    width: 4px !important;
                    
                }

                .react-chatbot-kit-chat-message-container::-webkit-scrollbar-track {
                    background: transparent !important;
                }

                .react-chatbot-kit-chat-message-container::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.3) !important;
                    border-radius: 10px !important;
                }

                .react-chatbot-kit-chat-message-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.5) !important;
                }

                /* Input Container - Clean design without border/elevation */
                .react-chatbot-kit-chat-input-container {
                    flex-shrink: 0 !important;
                    width: 100% !important;
                    position: relative !important;
                    padding: 0.375rem !important;
                    background-color: white !important;
                    border-top: none !important;
                    z-index: 10 !important;
                    box-shadow: none !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-input-container {
                        padding: 0.5rem !important;
                    }
                }

                /* Input Field - With floating send button */
                .react-chatbot-kit-chat-input {
                    width: 100% !important;
                    padding: 0.375rem 2.5rem 0.375rem 0.5rem !important;
                    font-size: 0.6875rem !important;
                    border: 1px solid #d1d5db !important;
                    border-radius: 9999px !important;
                    background-color: white !important;
                    transition: all 0.2s !important;
                    min-height: 34px !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-input {
                        padding: 0.5rem 2.75rem 0.5rem 0.625rem !important;
                        font-size: 0.75rem !important;
                        min-height: 40px !important;
                    }
                }

                .react-chatbot-kit-chat-input:focus {
                    outline: none !important;
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                }

                .react-chatbot-kit-chat-input::placeholder {
                    color: #9ca3af !important;
                }

                /* Send Button - Icon Only with Disabled State */
                .react-chatbot-kit-chat-btn-send {
                    position: absolute !important;
                    right: 0.75rem !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    width: 2rem !important;
                    height: 2rem !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    color: #ef4444 !important;
                    border: none !important;
                    border-radius: 0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease-out !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-btn-send {
                        right: 1rem !important;
                        width: 2.25rem !important;
                        height: 2.25rem !important;
                    }
                }

                .react-chatbot-kit-chat-btn-send:hover:not(:disabled) {
                    color: #dc2626 !important;
                    transform: translateY(-50%) scale(1.1) !important;
                }

                .react-chatbot-kit-chat-btn-send:active:not(:disabled) {
                    transform: translateY(-50%) scale(1) !important;
                }

                /* Disabled state when input is empty */
                .react-chatbot-kit-chat-input:placeholder-shown ~ .react-chatbot-kit-chat-btn-send-wrapper .react-chatbot-kit-chat-btn-send {
                    color: #9ca3af !important;
                    pointer-events: none !important;
                    opacity: 0.5 !important;
                    cursor: not-allowed !important;
                }

                .react-chatbot-kit-chat-btn-send-icon {
                    fill: currentColor !important;
                    width: 1.125rem !important;
                    height: 1.125rem !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-btn-send-icon {
                        width: 1.25rem !important;
                        height: 1.25rem !important;
                    }
                }

                /* Message Containers */
                .react-chatbot-kit-chat-bot-message-container {
                    width: 100% !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    justify-content: flex-start !important;
                    margin-bottom: 0.375rem !important;
                    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .react-chatbot-kit-user-chat-message-container {
                    width: 100% !important;
                   
                    display: flex !important;
                    align-items: flex-end !important;
                    justify-content: flex-end !important;
                    margin-bottom: 0.375rem !important;
                    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-bot-message-container,
                    .react-chatbot-kit-user-chat-message-container {
                        margin-bottom: 0.5rem !important;
                    }
                }

                /* Hide message containers with loading */
                .react-chatbot-kit-chat-bot-message-container:has([data-loading="true"]),
                .react-chatbot-kit-chat-bot-message-container:has(.react-chatbot-kit-chat-bot-loading) {
                    display: none !important;
                }

                /* Bot Message - RED Gradient with White Text - FORCE OVERRIDE */
                .react-chatbot-kit-chat-bot-message {
                    max-width: 85% !important;
                    padding: 0.375rem 0.625rem !important;
                    margin-left: 0 !important;
                    margin-right: auto !important;
                    font-size: 0.6875rem !important;
                    color: #ffffff !important;
                    background: linear-gradient(to right, #ef4444, #dc2626) !important;
                    background-color: #ef4444 !important;
                    border-radius: 0.875rem !important;
                    border-bottom-left-radius: 0.25rem !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    line-height: 1.4 !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-chat-bot-message {
                        max-width: 80% !important;
                        padding: 0.5rem 0.75rem !important;
                        font-size: 0.75rem !important;
                        border-radius: 1rem !important;
                        line-height: 1.5 !important;
                        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    }
                }

                /* Hide empty bot messages */
                .react-chatbot-kit-chat-bot-message:empty,
                .react-chatbot-kit-chat-bot-message:-moz-only-whitespace {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Force white text in bot messages */
                .react-chatbot-kit-chat-bot-message,
                .react-chatbot-kit-chat-bot-message * {
                    color: #ffffff !important;
                }

                /* Thinking indicator - smaller blinking text */
                .react-chatbot-kit-chat-bot-message:has-text("thinking..."),
                .react-chatbot-kit-chat-bot-message {
                    &:is(:has-text("thinking")) {
                        font-size: 0.625rem !important;
                        opacity: 0.9 !important;
                        animation: blink 1.4s ease-in-out infinite !important;
                    }
                }

                @keyframes blink {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }

                /* User Message - White with Border */
                .react-chatbot-kit-user-chat-message {
                    max-width: 85% !important;
                    padding: 0.375rem 0.625rem !important;
                    margin-right: 0 !important;
                    margin-left: auto !important;
                    font-size: 0.6875rem !important;
                    color: #1f2937 !important;
                    background-color: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.875rem !important;
                    border-bottom-right-radius: 0.25rem !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                    line-height: 1.4 !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                }

                @media (min-width: 640px) {
                    .react-chatbot-kit-user-chat-message {
                        max-width: 80% !important;
                        padding: 0.5rem 0.75rem !important;
                        font-size: 0.75rem !important;
                        border-radius: 1rem !important;
                        line-height: 1.5 !important;
                    }
                }

                .react-chatbot-kit-user-chat-message * {
                    color: #1f2937 !important;
                }

                /* Avatar Container - HIDE ALL AVATARS */
                .react-chatbot-kit-chat-bot-avatar-container,
                .react-chatbot-kit-user-chat-message-avatar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* Avatar Inner */
                .react-chatbot-kit-chat-bot-avatar {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* Hide default letter */
                .react-chatbot-kit-chat-bot-avatar-letter {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* Hide arrows */
                .react-chatbot-kit-chat-bot-message-arrow,
                .react-chatbot-kit-user-chat-message-arrow {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* Hide default header */
                .react-chatbot-kit-chat-header {
                    display: none !important;
                }

                /* CRITICAL: Hide ALL loading indicators for listing card messages */
                /* Target: Any message container that has the listing cards widget */
                .react-chatbot-kit-chat-bot-message-container:has([class*="listingCards"]),
                .react-chatbot-kit-chat-bot-message-container:has(.listing-cards-widget),
                .react-chatbot-kit-chat-bot-message-container:has([class*="w-full max-w-sm"]) {
                    /* Hide the loading indicator inside */
                }
                
                .react-chatbot-kit-chat-bot-message-container:has([class*="listingCards"]) .react-chatbot-kit-chat-bot-loading,
                .react-chatbot-kit-chat-bot-message-container:has(.listing-cards-widget) .react-chatbot-kit-chat-bot-loading,
                .react-chatbot-kit-chat-bot-message-container:has([class*="w-full max-w-sm"]) .react-chatbot-kit-chat-bot-loading,
                .react-chatbot-kit-chat-bot-message:has(> div[class*="flex flex-col"]) .react-chatbot-kit-chat-bot-loading,
                .react-chatbot-kit-chat-bot-message:has(> div > div[class*="rounded-lg"]) .react-chatbot-kit-chat-bot-loading {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    width: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    position: absolute !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                }

                /* Hide the message bubble itself if it only contains listing cards (no text) */
                .react-chatbot-kit-chat-bot-message:has(> div[class*="flex flex-col"]):empty,
                .react-chatbot-kit-chat-bot-message:has(.listing-cards-widget):empty {
                    display: none !important;
                }
                
                /* Hide empty message pseudo-elements */
                .react-chatbot-kit-chat-bot-message:has(> div[class*="flex flex-col"]):empty::before,
                .react-chatbot-kit-chat-bot-message:has(> div[class*="flex flex-col"]):empty::after {
                    display: none !important;
                    content: none !important;
                }

                /* Listing cards wrapper - transparent background, aligned left, no width constraint */
                .react-chatbot-kit-chat-bot-message:has(> div[class*="flex flex-col"]) {
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    max-width: 100% !important;
                    width: auto !important;
                    margin-left: 0 !important;
                }

                /* Hide empty messages */
                .react-chatbot-kit-chat-bot-message:not(:has(*:not(:empty))),
                .react-chatbot-kit-chat-bot-message:has(> :only-child:empty) {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Hide container with empty message */
                .react-chatbot-kit-chat-bot-message-container:has(.react-chatbot-kit-chat-bot-message:empty) {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    margin: 0 !important;
                }

                /* Hide typing indicator widget container */
                .react-chatbot-kit-chat-bot-message:has([class*="typingIndicator"]) {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    position: absolute !important;
                }

                .react-chatbot-kit-chat-bot-message-container:has([class*="typingIndicator"]) {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    margin: 0 !important;
                    position: absolute !important;
                }

                /* Animations using Tailwind-style keyframes */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    )
}
