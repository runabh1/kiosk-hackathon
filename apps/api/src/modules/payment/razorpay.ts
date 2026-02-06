/**
 * Razorpay Payment Gateway Integration
 * 
 * This module provides integration with Razorpay for secure payment processing.
 * Supports UPI, Cards, Net Banking, and Wallets.
 * 
 * For hackathon demo: Uses test mode by default
 */

import crypto from 'crypto';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_demo_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';

// Types
export interface CreateOrderRequest {
    amount: number; // Amount in paisa (100 = ₹1)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: 'created' | 'attempted' | 'paid';
    created_at: number;
}

export interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PaymentDetails {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    method: string;
    vpa?: string; // UPI ID if UPI payment
    bank?: string;
    wallet?: string;
    card_id?: string;
    email: string;
    contact: string;
    created_at: number;
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(request: CreateOrderRequest): Promise<RazorpayOrder> {
    const isTestMode = RAZORPAY_KEY_ID.startsWith('rzp_test');

    // In test/demo mode, create a mock order
    if (isTestMode || RAZORPAY_KEY_ID === 'rzp_test_demo_key') {
        return createMockOrder(request);
    }

    // Production: Make actual API call to Razorpay
    try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify({
                amount: request.amount,
                currency: request.currency || 'INR',
                receipt: request.receipt,
                notes: request.notes || {},
            }),
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: { description?: string } };
            throw new Error(errorData.error?.description || 'Failed to create Razorpay order');
        }

        return await response.json() as RazorpayOrder;
    } catch (error: any) {
        console.error('Razorpay Error:', error);
        throw new Error('Payment gateway error: ' + error.message);
    }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(request: VerifyPaymentRequest): boolean {
    const isTestMode = RAZORPAY_KEY_ID.startsWith('rzp_test');

    // In demo mode, accept mock signatures
    if (isTestMode || RAZORPAY_KEY_ID === 'rzp_test_demo_key') {
        return request.razorpay_signature.startsWith('mock_signature_') ||
            verifyMockPayment(request);
    }

    // Production: Verify actual signature
    const body = request.razorpay_order_id + '|' + request.razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    return expectedSignature === request.razorpay_signature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const isTestMode = RAZORPAY_KEY_ID.startsWith('rzp_test');

    // In demo mode, return mock details
    if (isTestMode || RAZORPAY_KEY_ID === 'rzp_test_demo_key') {
        return createMockPaymentDetails(paymentId);
    }

    // Production: Fetch from Razorpay API
    try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payment details');
        }

        return await response.json() as PaymentDetails;
    } catch (error: any) {
        throw new Error('Failed to fetch payment: ' + error.message);
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
}

// ============================================
// Mock Functions for Test/Demo Mode
// ============================================

function createMockOrder(request: CreateOrderRequest): RazorpayOrder {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
        id: orderId,
        amount: request.amount,
        currency: request.currency || 'INR',
        receipt: request.receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
    };
}

function verifyMockPayment(request: VerifyPaymentRequest): boolean {
    // In demo mode, verify based on order ID pattern
    return request.razorpay_order_id.startsWith('order_') &&
        request.razorpay_payment_id.startsWith('pay_');
}

function createMockPaymentDetails(paymentId: string): PaymentDetails {
    return {
        id: paymentId,
        order_id: `order_mock_${Date.now()}`,
        amount: 0, // Will be set by the calling function
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        vpa: 'user@upi',
        email: 'user@example.com',
        contact: '+919876543210',
        created_at: Math.floor(Date.now() / 1000),
    };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get Razorpay key ID for frontend
 */
export function getRazorpayKeyId(): string {
    return RAZORPAY_KEY_ID;
}

/**
 * Check if running in test mode
 */
export function isTestMode(): boolean {
    return RAZORPAY_KEY_ID.startsWith('rzp_test') || RAZORPAY_KEY_ID === 'rzp_test_demo_key';
}

/**
 * Format amount for Razorpay (convert to paisa)
 */
export function formatAmountForRazorpay(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Parse amount from Razorpay (convert from paisa)
 */
export function parseAmountFromRazorpay(amountInPaisa: number): number {
    return amountInPaisa / 100;
}
