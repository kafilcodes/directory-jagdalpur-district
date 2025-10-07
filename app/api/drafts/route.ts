import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import {
    saveDraftToFirestore,
    loadDraftFromFirestore,
    clearDraftFromFirestore,
    updateDraftStatus,
    hasPaymentProtectedDraft,
    type ListingDraft,
} from "@/lib/draft-storage-firestore"

export const runtime = "nodejs"

// GET: Load draft
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const result = await loadDraftFromFirestore(user.uid)

        if (!result.success) {
            // Return 200 with no draft instead of 404 for missing collection
            return NextResponse.json({ ok: true, draft: null })
        }

        return NextResponse.json({ ok: true, draft: result.draft })
    } catch (error: any) {
        // Gracefully handle missing collection
        return NextResponse.json({ ok: true, draft: null })
    }
}

// POST: Save draft
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const draft: Partial<ListingDraft> = {
            ...body,
            userId: user.uid,
            userEmail: user.email || '',
        }

        const result = await saveDraftToFirestore(draft)

        if (!result.success) {
            return NextResponse.json(
                { ok: false, error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true, draftId: result.draftId })
    } catch (error: any) {
        console.error('Draft save error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "error" },
            { status: 500 }
        )
    }
}

// DELETE: Clear draft (with payment protection)
export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const force = searchParams.get('force') === 'true'

        const result = await clearDraftFromFirestore(user.uid, force)

        if (!result.success) {
            return NextResponse.json(
                { ok: false, error: result.error, warning: result.warning },
                { status: 400 }
            )
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('Draft clear error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "error" },
            { status: 500 }
        )
    }
}

// PATCH: Update draft status
export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { status } = body

        if (!status) {
            return NextResponse.json(
                { ok: false, error: "status_required" },
                { status: 400 }
            )
        }

        const result = await updateDraftStatus(user.uid, status)

        if (!result.success) {
            return NextResponse.json(
                { ok: false, error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('Draft status update error:', error)
        return NextResponse.json(
            { ok: false, error: error.message || "error" },
            { status: 500 }
        )
    }
}
