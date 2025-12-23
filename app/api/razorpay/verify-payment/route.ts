import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getAdminApp, getAdminDb, FieldValue } from '@/lib/firebase/admin';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

export interface VerifyPaymentBody {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    listingId?: string;
    planType?: 'featured' | 'sponsored';
    amount?: number;
}

/**
 * Generate signature for payment verification
 */
function generateSignature(orderId: string, paymentId: string): string {
    if (!razorpayKeySecret) {
        throw new Error('Razorpay key secret not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(text)
        .digest('hex');

    return signature;
}

export async function POST(req: NextRequest) {
    try {
        if (!razorpayKeySecret) {
            return NextResponse.json(
                { success: false, error: 'Razorpay not configured' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, planType, amount } = body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required payment parameters',
                    missing: {
                        orderId: !razorpay_order_id,
                        paymentId: !razorpay_payment_id,
                        signature: !razorpay_signature,
                    }
                },
                { status: 400 }
            );
        }

        // Generate signature
        const generatedSignature = generateSignature(
            razorpay_order_id,
            razorpay_payment_id
        );

        // Verify signature
        const isValid = generatedSignature === razorpay_signature;

        if (!isValid) {
            console.error('Payment signature verification failed', {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                providedSignature: razorpay_signature,
                generatedSignature,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment verification failed. Invalid signature.',
                    verified: false,
                },
                { status: 400 }
            );
        }

        console.log('Payment verified successfully:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });

        // Try to resolve current user from session
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;
        let userUid: string | null = null;
        try {
            if (token) {
                const admin = getAdminApp();
                const decoded = await admin.auth().verifyIdToken(token);
                userUid = decoded.uid || null;
            }
        } catch (e) {
            console.warn('Could not verify session token:', e);
        }

        const db = getAdminDb();
        const now = Date.now();

        // Create receipt
        const receiptRef = db.collection('receipts').doc();
        const receipt = {
            id: receiptRef.id,
            userUid,
            listingId: listingId || null,
            amount: amount || 0,
            planType: planType || null,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            ts: now,
        };
        await receiptRef.set(receipt);

        // Update listing plan and expiry date if listingId and planType provided
        if (listingId && planType) {
            // Plan duration: 1 week = 7 days
            const startAt = now;
            const endAt = now + 7 * 24 * 60 * 60 * 1000; // 1 week TTL

            const listingRef = db.collection('listings').doc(listingId);
            await listingRef.set(
                {
                    plan: planType,
                    expiryDate: endAt,
                    activePlan: { type: planType, startAt, endAt },
                    status: 'active',
                    planHistory: FieldValue.arrayUnion({
                        type: planType,
                        startAt,
                        endAt,
                        paymentId: razorpay_payment_id,
                        orderId: razorpay_order_id,
                        amount: amount || 0,
                        receiptId: receiptRef.id
                    }),
                    updatedAt: now,
                },
                { merge: true }
            );

            console.log('Listing plan updated:', {
                listingId,
                planType,
                expiryDate: new Date(endAt).toISOString(),
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Payment verified successfully',
                verified: true,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                receiptId: receiptRef.id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Payment verification failed',
                verified: false,
            },
            { status: 500 }
        );
    }
}
