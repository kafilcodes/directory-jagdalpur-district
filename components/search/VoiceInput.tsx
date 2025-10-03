"use client"

import { useEffect, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface VoiceInputProps {
    onResult: (text: string) => void
    size?: "sm" | "md" | "lg"
}

export default function VoiceInput({ onResult, size = "md" }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [permissionDenied, setPermissionDenied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if Web Speech API is supported
        if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            setIsSupported(true)
        }
    }, [])

    const startListening = async () => {
        if (!isSupported || permissionDenied || isListening) return

        setError(null)

        try {
            // Check for internet connectivity before starting
            if (!navigator.onLine) {
                setError("No internet connection. Voice search requires internet.")
                return
            }

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

            if (!SpeechRecognition) {
                setIsSupported(false)
                setError("Voice search not supported in this browser")
                return
            }

            const recognition = new SpeechRecognition()

            recognition.lang = "en-US"
            recognition.continuous = false
            recognition.interimResults = false
            recognition.maxAlternatives = 1

            recognition.onstart = () => {
                setIsListening(true)
                setError(null)
            }

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                if (transcript && transcript.trim()) {
                    onResult(transcript.trim())
                }
                setIsListening(false)
                setError(null)
            }

            recognition.onerror = (event: any) => {
                console.warn("Speech recognition error:", event.error)
                setIsListening(false)

                if (event.error === "not-allowed" || event.error === "permission-denied") {
                    setPermissionDenied(true)
                    setError("Microphone permission denied")
                } else if (event.error === "network") {
                    // Network errors are common and often transient
                    setError("Voice search unavailable. Try typing your search.")
                } else if (event.error === "no-speech") {
                    setError("No speech detected. Try again.")
                } else if (event.error === "aborted") {
                    // User cancelled, don't show error
                    setError(null)
                } else if (event.error === "service-not-allowed") {
                    setError("Voice search not available")
                } else {
                    setError("Voice search failed. Try typing instead.")
                }
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognition.start()
        } catch (err) {
            console.error("Failed to start speech recognition:", err)
            setIsListening(false)
            setError("Voice search unavailable")
        }
    }

    if (!isSupported) {
        return null // Hide mic button if not supported
    }

    const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10"
    const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        size="icon"
                        variant={isListening ? "default" : "ghost"}
                        className={`${sizeClass} ${isListening
                            ? "bg-red-500 hover:bg-red-600 animate-pulse"
                            : permissionDenied
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-gray-100"
                            }`}
                        onClick={startListening}
                        disabled={permissionDenied || isListening}
                        aria-label={
                            permissionDenied
                                ? "Microphone access denied"
                                : isListening
                                    ? "Listening..."
                                    : "Voice search"
                        }
                    >
                        {permissionDenied ? (
                            <MicOff className={`${iconSize} text-gray-400`} />
                        ) : isListening ? (
                            <Mic className={`${iconSize} text-white`} />
                        ) : (
                            <Mic className={`${iconSize} text-gray-600`} />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{error || (permissionDenied ? "Microphone access denied" : isListening ? "Listening..." : "Voice search")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
