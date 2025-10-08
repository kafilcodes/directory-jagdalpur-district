/**
 * API endpoint to update listing photos during creation
 * This is a special endpoint used only during the listing creation flow
 * Regular edits don't allow photo changes (use Update schema in [id]/route.ts)
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminDb, FieldValue } from "@/lib/firebase/admin"
import { getCurrentUser } from "@/lib/auth/server"
import { z } from "zod"
import { invalidateListing } from "@/lib/cache/listingsCache"

export const runtime = "nodejs"

const PhotosUpdateSchema = z.object({
    photos: z.array(z.string().url()).min(1).max(20),
    primaryImageIndex: z.number().min(0).max(19).optional(),
})

export async function PATCH(req: NextRequest, context: any) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({
                ok: false,
                error: "unauthorized",
                message: "You must be signed in"
            }, { status: 401 })
        }

        const params = await context.params
        const { id } = params as { id: string }

        const json = await req.json()
        const parsed = PhotosUpdateSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({
                ok: false,
                error: "validation_failed",
                message: "Invalid photos data",
                details: parsed.error.flatten()
            }, { status: 400 })
        }

        const db = getAdminDb()
        const ref = db.collection("listings").doc(id)
        const snap = await ref.get()

        if (!snap.exists) {
            return NextResponse.json({
                ok: false,
                error: "not_found",
                message: "Listing not found"
            }, { status: 404 })
        }

        const data = snap.data() as any

        // Verify ownership
        if (data.ownerUid !== user.uid) {
            return NextResponse.json({
                ok: false,
                error: "forbidden",
                message: "You don't have permission to modify this listing"
            }, { status: 403 })
        }

        // Only allow photos update if listing is in 'creating' or 'draft' status
        // This prevents photo changes after listing is fully created
        if (data.status !== 'creating' && data.status !== 'draft' && data.status !== 'active') {
            return NextResponse.json({
                ok: false,
                error: "invalid_status",
                message: "Photos can only be updated during listing creation"
            }, { status: 400 })
        }

        // Build update object
        const updates: any = {
            photos: parsed.data.photos,
            primaryImageIndex: parsed.data.primaryImageIndex ?? 0,
            updatedAt: Date.now(),
        }

        // If listing was in 'creating' status, mark it as 'active' now that images are uploaded
        if (data.status === 'creating') {
            updates.status = 'active'
        }

        await ref.set(updates, { merge: true })

        // Invalidate cache
        invalidateListing(id)

        return NextResponse.json({
            ok: true,
            message: "Photos updated successfully",
        })

    } catch (e: any) {
        console.error("[PATCH /api/listings/[id]/photos] Error:", e)
        return NextResponse.json({
            ok: false,
            error: "server_error",
            message: e?.message || "Failed to update photos"
        }, { status: 500 })
    }
}
