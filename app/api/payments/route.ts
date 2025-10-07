import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const userEmail = searchParams.get("userEmail")

        if (!userEmail || userEmail !== user.email) {
            return NextResponse.json(
                { error: "Invalid user email" },
                { status: 403 }
            )
        }

        // Query listings_payments collection
        const db = getAdminDb()
        const paymentsRef = db.collection("listings_payments")

        const snapshot = await paymentsRef
            .where("userEmail", "==", userEmail)
            .orderBy("createdAt", "desc")
            .get()

        const payments = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }))

        return NextResponse.json({ payments })
    } catch (error) {
        console.error("[API /api/payments] Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch payments" },
            { status: 500 }
        )
    }
}
