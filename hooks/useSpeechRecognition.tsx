"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type SpeechRecognitionErrorCode =
    | "permission-denied"
    | "network"
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported"
    | null

export interface UseSpeechRecognitionConfig {
    lang?: string
    continuous?: boolean
    interimResults?: boolean
    maxAlternatives?: number
}

export interface UseSpeechRecognitionReturn {
    isSupported: boolean
    isListening: boolean
    transcript: string
    errorCode: SpeechRecognitionErrorCode
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
}

/**
 * Custom hook for Web Speech API (SpeechRecognition)
 * 
 * @param config - Configuration options
 * @returns Speech recognition state and controls
 * 
 * @example
 * ```tsx
 * const { isSupported, isListening, transcript, startListening, stopListening } = useSpeechRecognition({
 *   lang: 'en-US',
 *   continuous: false,
 *   interimResults: false
 * })
 * ```
 */
export function useSpeechRecognition(config: UseSpeechRecognitionConfig = {}): UseSpeechRecognitionReturn {
    const {
        lang = "en-US",
        continuous = false,
        interimResults = false,
        maxAlternatives = 1
    } = config

    const [isSupported, setIsSupported] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [errorCode, setErrorCode] = useState<SpeechRecognitionErrorCode>(null)

    const recognitionRef = useRef<any>(null)

    // Check browser support on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            setIsSupported(!!SpeechRecognition)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop()
                } catch (e) {
                    // Ignore errors on cleanup
                }
                recognitionRef.current = null
            }
        }
    }, [])

    const startListening = useCallback(() => {
        if (!isSupported) {
            setErrorCode("not-allowed")
            return
        }

        if (isListening) {
            return
        }

        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

            if (!SpeechRecognition) {
                setIsSupported(false)
                setErrorCode("not-allowed")
                return
            }

            const recognition = new SpeechRecognition()
            recognitionRef.current = recognition

            // Configure recognition
            recognition.lang = lang
            recognition.continuous = continuous
            recognition.interimResults = interimResults
            recognition.maxAlternatives = maxAlternatives

            // Event handlers
            recognition.onstart = () => {
                setIsListening(true)
                setErrorCode(null)
            }

            recognition.onresult = (event: any) => {
                // Get the final transcript from the last result
                const lastResultIndex = event.results.length - 1
                const result = event.results[lastResultIndex]

                if (result.isFinal) {
                    const finalTranscript = result[0].transcript
                    setTranscript(finalTranscript)
                } else if (interimResults) {
                    // Update with interim results if enabled
                    const interimTranscript = result[0].transcript
                    setTranscript(interimTranscript)
                }
            }

            recognition.onerror = (event: any) => {
                console.warn("[useSpeechRecognition] Error:", event.error)
                setIsListening(false)

                // Map error types to our error codes
                const errorType = event.error as string

                if (errorType === "not-allowed" || errorType === "permission-denied") {
                    setErrorCode("permission-denied")
                } else if (errorType === "network") {
                    setErrorCode("network")
                } else if (errorType === "no-speech") {
                    setErrorCode("no-speech")
                } else if (errorType === "aborted") {
                    setErrorCode("aborted")
                } else if (errorType === "audio-capture") {
                    setErrorCode("audio-capture")
                } else if (errorType === "service-not-allowed") {
                    setErrorCode("service-not-allowed")
                } else if (errorType === "bad-grammar") {
                    setErrorCode("bad-grammar")
                } else if (errorType === "language-not-supported") {
                    setErrorCode("language-not-supported")
                } else {
                    setErrorCode("network") // Generic fallback
                }
            }

            recognition.onend = () => {
                setIsListening(false)
                recognitionRef.current = null
            }

            // Start recognition
            recognition.start()
        } catch (error) {
            console.error("[useSpeechRecognition] Failed to start:", error)
            setIsListening(false)
            setErrorCode("not-allowed")
        }
    }, [isSupported, isListening, lang, continuous, interimResults, maxAlternatives])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (e) {
                console.warn("[useSpeechRecognition] Error stopping recognition:", e)
            }
        }
        setIsListening(false)
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript("")
        setErrorCode(null)
    }, [])

    return {
        isSupported,
        isListening,
        transcript,
        errorCode,
        startListening,
        stopListening,
        resetTranscript
    }
}
