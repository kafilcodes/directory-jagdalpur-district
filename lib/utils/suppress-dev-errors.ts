/**
 * Console Error Filter
 * 
 * Suppresses expected/harmless console errors in development
 * - Firestore offline errors (expected when network is unavailable)
 * - Cross-Origin-Opener-Policy warnings (harmless Firebase Auth behavior)
 * - WebChannel transport errors (Firestore retry mechanism)
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const originalError = console.error
    const originalWarn = console.warn

    // Patterns to suppress (expected errors that don't affect functionality)
    const suppressPatterns = [
        /WebChannelConnection RPC 'Listen' stream.*transport errored/,
        /Cross-Origin-Opener-Policy policy would block/,
        /Failed to get document because the client is offline/,
        /Firestore.*transport errored/,
        /PERMISSION_DENIED/,
        /Unrecognized feature: 'otp-credentials'/,
    ]

    console.error = (...args: any[]) => {
        const message = args.join(" ")

        // Check if error matches suppression patterns
        const shouldSuppress = suppressPatterns.some(pattern =>
            pattern.test(message)
        )

        if (!shouldSuppress) {
            originalError.apply(console, args)
        }
    }

    console.warn = (...args: any[]) => {
        const message = args.join(" ")

        // Check if warning matches suppression patterns
        const shouldSuppress = suppressPatterns.some(pattern =>
            pattern.test(message)
        )

        if (!shouldSuppress) {
            originalWarn.apply(console, args)
        }
    }
}

export { }
