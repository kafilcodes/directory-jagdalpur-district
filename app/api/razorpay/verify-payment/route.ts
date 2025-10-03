import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

export interface VerifyPaymentBody {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
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

        const body: VerifyPaymentBody = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

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

        return NextResponse.json(
            {
                success: true,
                message: 'Payment verified successfully',
                verified: true,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
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
