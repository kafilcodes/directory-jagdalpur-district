"use client"

import { useState, FormEvent } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KeyRound } from "lucide-react"

export default function AdminPage() {
    const [isOpen, setIsOpen] = useState(true)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [authenticated, setAuthenticated] = useState(false)

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
            setAuthenticated(true)
            setIsOpen(false)
            setError("")
        } else {
            setError("Incorrect password. Access denied.")
            setPassword("")
        }
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <Dialog open={isOpen} onOpenChange={() => { }} modal>
                    <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl font-bold text-gray-900">Admin Access</DialogTitle>
                            <DialogDescription className="text-center text-gray-600">
                                Enter password to access the admin dashboard
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-6 py-6">
                            {/* Admin SVG Illustration */}
                            <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto">
                                <Image
                                    src="/admin.svg"
                                    alt="Admin Access"
                                    width={240}
                                    height={180}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>

                            {/* Password Form */}
                            <form onSubmit={handleSubmit} className="w-full space-y-4">
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Enter admin password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-500 text-center bg-red-50 py-2 px-3 rounded-md border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                                >
                                    Access Admin Dashboard
                                </Button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    return (
        <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome to the admin panel. Content coming soon...</p>
            </div>
        </main>
    )
}
