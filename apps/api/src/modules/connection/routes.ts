import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Get all connections
router.get('/', async (req: AuthReq, res, next) => {
  try {
    const { serviceType, status } = req.query;

    const where: any = { userId: req.user!.id };

    if (serviceType) where.serviceType = serviceType as string;
    if (status) where.status = status as string;

    const connections = await prisma.serviceConnection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
});

// Get single connection
router.get('/:id', async (req: AuthReq, res, next) => {
  try {
    const connection = await prisma.serviceConnection.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        bills: { orderBy: { billDate: 'desc' }, take: 5 },
        meterReadings: { orderBy: { readingDate: 'desc' }, take: 5 },
        grievances: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    if (!connection) {
      throw new ApiError('Connection not found', 404);
    }

    res.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    next(error);
  }
});

// New connection application schema
const applyConnectionSchema = z.object({
  serviceType: z.enum(['ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL']),
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  sanctionedLoad: z.number().positive().optional(), // For electricity
});

// Apply for new connection
router.post('/apply', async (req: AuthReq, res, next) => {
  try {
    const data = applyConnectionSchema.parse(req.body);

    // Generate connection number
    const prefix = data.serviceType.substring(0, 3);
    const connectionNo = `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const connection = await prisma.serviceConnection.create({
      data: {
        userId: req.user!.id,
        ...data,
        connectionNo,
        status: 'PENDING',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'SERVICE_UPDATE',
        title: 'Connection Application Submitted',
        titleHi: 'कनेक्शन आवेदन जमा',
        message: `Your ${data.serviceType.toLowerCase()} connection application has been submitted. Application No: ${connectionNo}`,
        messageHi: `आपका ${data.serviceType.toLowerCase()} कनेक्शन आवेदन जमा कर दिया गया है। आवेदन संख्या: ${connectionNo}`,
        data: { connectionId: connection.id },
      },
    });

    res.status(201).json({
      success: true,
      data: connection,
      message: 'Connection application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Submit meter reading
const meterReadingSchema = z.object({
  reading: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
});

router.post('/:id/meter-reading', async (req: AuthReq, res, next) => {
  try {
    const { reading, imageUrl } = meterReadingSchema.parse(req.body);

    const connection = await prisma.serviceConnection.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        status: 'ACTIVE',
      },
    });

    if (!connection) {
      throw new ApiError('Active connection not found', 404);
    }

    // Validate reading is higher than last
    if (connection.lastReading && reading < connection.lastReading) {
      throw new ApiError('New reading cannot be less than previous reading', 400);
    }

    // Create meter reading
    const meterReading = await prisma.meterReading.create({
      data: {
        connectionId: connection.id,
        reading,
        readingDate: new Date(),
        submittedBy: 'CITIZEN',
        imageUrl,
      },
    });

    // Update connection
    await prisma.serviceConnection.update({
      where: { id: connection.id },
      data: {
        lastReading: reading,
        lastReadingDate: new Date(),
      },
    });

    res.json({
      success: true,
      data: meterReading,
      message: 'Meter reading submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get connection status
router.get('/:id/status', async (req: AuthReq, res, next) => {
  try {
    const connection = await prisma.serviceConnection.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      select: {
        id: true,
        connectionNo: true,
        serviceType: true,
        status: true,
        connectionDate: true,
        lastReading: true,
        lastReadingDate: true,
      },
    });

    if (!connection) {
      throw new ApiError('Connection not found', 404);
    }

    res.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    next(error);
  }
});


// Get sanction letter
import { getSanctionLetterData, generateSanctionLetterHTML } from '../service-request/document-generator';

router.get('/:id/sanction-letter', async (req: AuthReq, res, next) => {
  try {
    const { lang = 'en' } = req.query;
    const data = await getSanctionLetterData(req.params.id, req.user!.id);

    if (!data) {
      throw new ApiError('Sanction letter not found or connection not active', 404);
    }

    const html = generateSanctionLetterHTML(data, lang as 'en' | 'hi');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

export default router;

