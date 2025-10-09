"use client"

import { useEffect } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { toast } from "sonner"

interface VoiceInputProps {
    onResult: (text: string) => void
    size?: "sm" | "md" | "lg"
}

export default function VoiceInput({ onResult, size = "md" }: VoiceInputProps) {
    const {
        isSupported,
        isListening,
        transcript,
        errorCode,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition({
        lang: "en-US",
        continuous: false,
        interimResults: false,
        maxAlternatives: 1
    })

    // Handle transcript updates
    useEffect(() => {
        if (transcript && transcript.trim()) {
            onResult(transcript.trim())
            resetTranscript()
        }
    }, [transcript, onResult, resetTranscript])

    // Handle errors with toast notifications
    useEffect(() => {
        if (errorCode) {
            let message = ""
            switch (errorCode) {
                case "permission-denied":
                case "not-allowed":
                    message = "Microphone permission denied. Please allow microphone access in your browser settings."
                    break
                case "network":
                    message = "Voice search requires internet connection. Please check your connection and try again."
                    break
                case "no-speech":
                    message = "No speech detected. Please try speaking again."
                    break
                case "audio-capture":
                    message = "Microphone not found. Please check your device settings."
                    break
                case "service-not-allowed":
                    message = "Voice search service is not available."
                    break
                default:
                    message = "Voice search unavailable. Please try typing your search."
            }

            // Only show toast for critical errors (not aborted)
            if (errorCode !== "aborted") {
                toast.error(message, {
                    duration: 4000,
                    position: "top-center"
                })
            }
        }
    }, [errorCode])

    // Don't render if not supported
    if (!isSupported) {
        return null
    }

    const permissionDenied = errorCode === "permission-denied" || errorCode === "not-allowed"
    const hasError = !!errorCode && errorCode !== "aborted"

    const sizeClass = size === "sm" ? "h-8 w-8 min-w-[2rem]" : size === "lg" ? "h-12 w-12 min-w-[3rem]" : "h-10 w-10 min-w-[2.5rem]"
    const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"

    const handleClick = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    // Determine button state and styling
    const buttonVariant = isListening ? "default" : "ghost"
    const buttonClassName = `
        ${sizeClass}
        ${isListening
            ? "bg-red-500 hover:bg-red-600 text-white animate-[pulse_1.5s_ease-in-out_infinite] focus-visible:ring-2 focus-visible:ring-red-500"
            : permissionDenied
                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                : hasError
                    ? "text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                    : "hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-500"
        }
        transition-all duration-200
    `.trim()

    // Accessibility label
    const ariaLabel = permissionDenied
        ? "Microphone access denied"
        : isListening
            ? "Stop listening"
            : "Start voice search"

    // Tooltip content
    const tooltipText = permissionDenied
        ? "Microphone access denied"
        : isListening
            ? "Listening... Click to stop"
            : "Voice search"

    return (
        <>
            {/* Screen reader announcements */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {isListening && "Listening for voice input"}
                {!isListening && transcript && `Recognized: ${transcript}`}
            </div>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant={buttonVariant}
                            className={buttonClassName}
                            onClick={handleClick}
                            disabled={permissionDenied}
                            aria-label={ariaLabel}
                            aria-pressed={isListening}
                        >
                            {permissionDenied ? (
                                <MicOff className={`${iconSize} text-gray-400`} aria-hidden="true" />
                            ) : isListening ? (
                                <Mic className={`${iconSize} text-white`} aria-hidden="true" />
                            ) : hasError ? (
                                <MicOff className={`${iconSize} text-red-500`} aria-hidden="true" />
                            ) : (
                                <Mic className={`${iconSize} text-gray-600`} aria-hidden="true" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Custom pulse animation - tunable via CSS variable */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.85;
                        transform: scale(var(--mic-pulse-size, 1.05));
                    }
                }
            `}</style>
        </>
    )
}
