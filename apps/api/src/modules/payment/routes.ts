/**
 * Payment Routes with Razorpay Integration
 * 
 * Provides secure payment processing with:
 * - Order creation
 * - Payment verification
 * - Webhook handling
 * - Receipt generation
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import {
    createRazorpayOrder,
    verifyPaymentSignature,
    formatAmountForRazorpay,
    parseAmountFromRazorpay,
    getRazorpayKeyId,
    isTestMode,
} from './razorpay';

const router = Router();

// Get Razorpay configuration for frontend
router.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            keyId: getRazorpayKeyId(),
            isTestMode: isTestMode(),
            currency: 'INR',
        },
    });
});

// Create payment order
const createOrderSchema = z.object({
    billId: z.string(),
    amount: z.number().positive(),
});

router.post('/create-order', authenticate, async (req: AuthReq, res, next) => {
    try {
        const { billId, amount } = createOrderSchema.parse(req.body);

        // Verify bill exists and belongs to user
        const bill = await prisma.bill.findFirst({
            where: {
                id: billId,
                userId: req.user!.id,
            },
            include: {
                connection: true,
            },
        });

        if (!bill) {
            throw new ApiError('Bill not found', 404);
        }

        if (bill.status === 'PAID') {
            throw new ApiError('Bill already paid', 400);
        }

        // Verify amount
        const remainingAmount = bill.totalAmount - bill.amountPaid;
        if (amount > remainingAmount + 0.01) { // Small tolerance for rounding
            throw new ApiError(`Amount exceeds remaining balance of ₹${remainingAmount}`, 400);
        }

        // Create Razorpay order
        const receipt = `BILL_${bill.billNo}_${Date.now()}`;
        const order = await createRazorpayOrder({
            amount: formatAmountForRazorpay(amount),
            currency: 'INR',
            receipt,
            notes: {
                billId: bill.id,
                billNo: bill.billNo,
                userId: req.user!.id,
                serviceType: bill.connection.serviceType,
                connectionNo: bill.connection.connectionNo,
            },
        });

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: amount,
                amountInPaisa: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                keyId: getRazorpayKeyId(),
                bill: {
                    id: bill.id,
                    billNo: bill.billNo,
                    serviceType: bill.connection.serviceType,
                    connectionNo: bill.connection.connectionNo,
                },
                prefill: {
                    name: req.user!.name,
                    contact: req.user!.phone,
                    email: req.user!.email || undefined,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Verify payment and update records
const verifyPaymentSchema = z.object({
    billId: z.string(),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    amount: z.number().positive(),
    method: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET']),
});

router.post('/verify', authenticate, async (req: AuthReq, res, next) => {
    try {
        const data = verifyPaymentSchema.parse(req.body);

        // Verify signature
        const isValid = verifyPaymentSignature({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
        });

        if (!isValid) {
            throw new ApiError('Payment verification failed - invalid signature', 400);
        }

        // Verify bill
        const bill = await prisma.bill.findFirst({
            where: {
                id: data.billId,
                userId: req.user!.id,
            },
            include: {
                connection: true,
            },
        });

        if (!bill) {
            throw new ApiError('Bill not found', 404);
        }

        if (bill.status === 'PAID') {
            throw new ApiError('Bill already paid', 400);
        }

        // Generate receipt number
        const receiptNo = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                userId: req.user!.id,
                billId: data.billId,
                amount: data.amount,
                method: data.method,
                status: 'SUCCESS',
                transactionId: data.razorpay_payment_id,
                receiptNo,
                paidAt: new Date(),
                kioskId: req.headers['x-kiosk-id'] as string,
                gatewayResponse: {
                    orderId: data.razorpay_order_id,
                    paymentId: data.razorpay_payment_id,
                    signature: data.razorpay_signature,
                    verifiedAt: new Date().toISOString(),
                },
            },
        });

        // Update bill
        const newAmountPaid = bill.amountPaid + data.amount;
        const newStatus = newAmountPaid >= bill.totalAmount ? 'PAID' : 'PARTIAL';

        await prisma.bill.update({
            where: { id: data.billId },
            data: {
                amountPaid: newAmountPaid,
                status: newStatus,
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: req.user!.id,
                type: 'PAYMENT_SUCCESS',
                title: 'Payment Successful',
                titleHi: 'भुगतान सफल',
                message: `Your payment of ₹${data.amount} for ${bill.connection.serviceType} bill ${bill.billNo} was successful. Receipt: ${receiptNo}`,
                messageHi: `₹${data.amount} का भुगतान ${bill.connection.serviceType} बिल ${bill.billNo} के लिए सफल रहा। रसीद: ${receiptNo}`,
                data: {
                    paymentId: payment.id,
                    receiptNo,
                    transactionId: data.razorpay_payment_id,
                },
            },
        });

        res.json({
            success: true,
            data: {
                paymentId: payment.id,
                transactionId: data.razorpay_payment_id,
                receiptNo,
                amount: data.amount,
                status: 'SUCCESS',
                message: 'Payment verified and recorded successfully',
            },
        });
    } catch (error) {
        next(error);
    }
});

// Razorpay webhook handler
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;

        // Handle different webhook events
        switch (event.event) {
            case 'payment.captured':
                // Payment was successful - we handle this in verify endpoint
                console.log('Payment captured:', event.payload.payment.entity.id);
                break;

            case 'payment.failed':
                // Payment failed - update any pending records
                console.log('Payment failed:', event.payload.payment.entity.id);
                break;

            case 'refund.created':
                // Refund initiated
                console.log('Refund created:', event.payload.refund.entity.id);
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get payment status
router.get('/status/:orderId', authenticate, async (req: AuthReq, res, next) => {
    try {
        const { orderId } = req.params;

        // Find payment by transaction ID (Razorpay order ID)
        const payment = await prisma.payment.findFirst({
            where: {
                userId: req.user!.id,
                gatewayResponse: {
                    path: ['orderId'],
                    equals: orderId,
                },
            },
            include: {
                bill: {
                    include: { connection: true },
                },
            },
        });

        if (!payment) {
            res.json({
                success: true,
                data: {
                    status: 'pending',
                    message: 'Payment not yet completed',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: {
                status: payment.status,
                paymentId: payment.id,
                transactionId: payment.transactionId,
                receiptNo: payment.receiptNo,
                amount: payment.amount,
                paidAt: payment.paidAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
