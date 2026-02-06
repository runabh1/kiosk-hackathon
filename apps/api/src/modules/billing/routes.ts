import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all bills for user
router.get('/bills', async (req: AuthReq, res, next) => {
  try {
    const { serviceType, status, page = '1', limit = '10' } = req.query;

    const where: any = { userId: req.user!.id };

    if (serviceType) {
      where.connection = { serviceType: serviceType as string };
    }

    if (status) {
      where.status = status as string;
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: { connection: true },
        orderBy: { dueDate: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      success: true,
      data: bills.map((bill) => ({
        ...bill,
        serviceType: bill.connection.serviceType,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single bill details
router.get('/bills/:id', async (req: AuthReq, res, next) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        connection: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!bill) {
      throw new ApiError('Bill not found', 404);
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
});

// Mock payment schema
const paymentSchema = z.object({
  billId: z.string(),
  amount: z.number().positive(),
  method: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH']),
});

// Initiate payment (MOCK)
router.post('/pay', async (req: AuthReq, res, next) => {
  try {
    const { billId, amount, method } = paymentSchema.parse(req.body);

    // Find bill
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        userId: req.user!.id,
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
    if (amount > remainingAmount) {
      throw new ApiError(`Amount exceeds remaining balance of ${remainingAmount}`, 400);
    }

    // Generate mock transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const receiptNo = `RCP${Date.now()}`;

    // Create payment record (MOCK - instantly successful)
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        billId,
        amount,
        method,
        status: 'SUCCESS',
        transactionId,
        receiptNo,
        paidAt: new Date(),
        kioskId: req.headers['x-kiosk-id'] as string,
      },
    });

    // Update bill
    const newAmountPaid = bill.amountPaid + amount;
    const newStatus = newAmountPaid >= bill.totalAmount ? 'PAID' : 'PARTIAL';

    await prisma.bill.update({
      where: { id: billId },
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
        message: `Your payment of ₹${amount} for bill ${bill.billNo} was successful. Receipt: ${receiptNo}`,
        messageHi: `₹${amount} का भुगतान बिल ${bill.billNo} के लिए सफल रहा। रसीद: ${receiptNo}`,
        data: { paymentId: payment.id, receiptNo },
      },
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId,
        status: 'SUCCESS',
        receiptNo,
        message: 'Payment successful',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get receipt
router.get('/receipts/:id', async (req: AuthReq, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        status: 'SUCCESS',
      },
      include: {
        bill: {
          include: { connection: true },
        },
        user: true,
      },
    });

    if (!payment) {
      throw new ApiError('Receipt not found', 404);
    }

    // Generate receipt data (in production, this would generate PDF)
    const receipt = {
      receiptNo: payment.receiptNo,
      transactionId: payment.transactionId,
      date: payment.paidAt,
      amount: payment.amount,
      method: payment.method,
      user: {
        name: payment.user.name,
        phone: payment.user.phone,
        address: payment.user.address,
      },
      bill: {
        billNo: payment.bill.billNo,
        serviceType: payment.bill.connection.serviceType,
        connectionNo: payment.bill.connection.connectionNo,
        periodFrom: payment.bill.periodFrom,
        periodTo: payment.bill.periodTo,
        totalAmount: payment.bill.totalAmount,
      },
    };

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
});

// Payment history
router.get('/payments', async (req: AuthReq, res, next) => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: req.user!.id },
        include: {
          bill: {
            include: { connection: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.payment.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      data: payments.map(p => ({
        ...p,
        paymentMethod: p.method,
        bill: {
          ...p.bill,
          serviceType: p.bill.connection.serviceType,
        },
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get receipt by payment ID (alternate route for frontend)
router.get('/receipt/:id', async (req: AuthReq, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        status: 'SUCCESS',
      },
      include: {
        bill: {
          include: { connection: true },
        },
        user: true,
      },
    });

    if (!payment) {
      throw new ApiError('Receipt not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount,
        transactionId: payment.transactionId,
        receiptNo: payment.receiptNo,
        paymentMethod: payment.method,
        paidAt: payment.paidAt,
        status: payment.status,
        bill: {
          billNo: payment.bill.billNo,
          periodFrom: payment.bill.periodFrom,
          periodTo: payment.bill.periodTo,
          connection: {
            serviceType: payment.bill.connection.serviceType,
            connectionNo: payment.bill.connection.connectionNo,
            address: payment.bill.connection.address,
            city: payment.bill.connection.city,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Download receipt as HTML (printable PDF)
router.get('/receipt/:id/download', async (req: AuthReq, res, next) => {
  try {
    const { generateReceiptHTML, getReceiptData } = await import('./receipt-generator');

    const receiptData = await getReceiptData(req.params.id, req.user!.id);

    if (!receiptData) {
      throw new ApiError('Receipt not found', 404);
    }

    const language = (req.query.lang as 'en' | 'hi') || req.user!.language as 'en' | 'hi' || 'en';
    const html = generateReceiptHTML(receiptData, language);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="Receipt_${receiptData.receiptNo}.html"`);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// Download receipt as text
router.get('/receipt/:id/text', async (req: AuthReq, res, next) => {
  try {
    const { generateReceiptText, getReceiptData } = await import('./receipt-generator');

    const receiptData = await getReceiptData(req.params.id, req.user!.id);

    if (!receiptData) {
      throw new ApiError('Receipt not found', 404);
    }

    const text = generateReceiptText(receiptData);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="Receipt_${receiptData.receiptNo}.txt"`);
    res.send(text);
  } catch (error) {
    next(error);
  }
});

export default router;
