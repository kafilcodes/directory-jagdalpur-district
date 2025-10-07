import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { hasPaymentProtectedDraft } from "@/lib/draft-storage-firestore"

export const runtime = "nodejs"

// GET: Check if user has payment-protected draft
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const result = await hasPaymentProtectedDraft(user.uid)

        return NextResponse.json({
            ok: true,
            hasDraft: result.hasDraft,
            draft: result.draft,
        })
    } catch (error: any) {
        console.error('Check payment draft error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "error" },
            { status: 500 }
        )
    }
}
