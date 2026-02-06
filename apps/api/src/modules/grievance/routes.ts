import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq, requireRole } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Get all grievances for user
router.get('/', async (req: AuthReq, res, next) => {
  try {
    const { serviceType, status, page = '1', limit = '10' } = req.query;

    const where: any = { userId: req.user!.id };

    if (serviceType) where.serviceType = serviceType as string;
    if (status) where.status = status as string;

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        include: {
          connection: { select: { connectionNo: true, serviceType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.grievance.count({ where }),
    ]);

    res.json({
      success: true,
      data: grievances,
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

// Get single grievance with timeline
router.get('/:id', async (req: AuthReq, res, next) => {
  try {
    const grievance = await prisma.grievance.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        connection: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });

    if (!grievance) {
      throw new ApiError('Grievance not found', 404);
    }

    res.json({
      success: true,
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
});

// Create grievance schema
const createGrievanceSchema = z.object({
  serviceType: z.enum(['ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL']),
  connectionId: z.string().optional(),
  category: z.string().min(2),
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(2000), // Reduced minimum for better UX
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// Submit new grievance
router.post('/', async (req: AuthReq, res, next) => {
  try {
    const data = createGrievanceSchema.parse(req.body);

    // Validate connection if provided
    if (data.connectionId) {
      const connection = await prisma.serviceConnection.findFirst({
        where: {
          id: data.connectionId,
          userId: req.user!.id,
        },
      });

      if (!connection) {
        throw new ApiError('Connection not found', 404);
      }
    }

    // Generate ticket number
    const ticketNo = `GRV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create grievance
    const grievance = await prisma.grievance.create({
      data: {
        userId: req.user!.id,
        ...data,
        ticketNo,
        priority: data.priority || 'MEDIUM',
      },
    });

    // Create initial timeline entry
    await prisma.grievanceTimeline.create({
      data: {
        grievanceId: grievance.id,
        action: 'SUBMITTED',
        description: 'Grievance submitted successfully',
        actionBy: 'SYSTEM',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'GRIEVANCE_UPDATE',
        title: 'Grievance Registered',
        titleHi: 'शिकायत दर्ज',
        message: `Your grievance has been registered. Ticket No: ${ticketNo}`,
        messageHi: `आपकी शिकायत दर्ज हो गई है। टिकट नंबर: ${ticketNo}`,
        data: { grievanceId: grievance.id, ticketNo },
      },
    });

    res.status(201).json({
      success: true,
      data: grievance,
      message: 'Grievance submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update grievance status (Admin/Staff only)
const updateGrievanceSchema = z.object({
  status: z.enum(['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']),
  resolution: z.string().optional(),
  comment: z.string().optional(),
});

router.put('/:id', requireRole('ADMIN', 'STAFF'), async (req: AuthReq, res, next) => {
  try {
    const { status, resolution, comment } = updateGrievanceSchema.parse(req.body);

    const grievance = await prisma.grievance.findUnique({
      where: { id: req.params.id },
    });

    if (!grievance) {
      throw new ApiError('Grievance not found', 404);
    }

    // Update grievance
    const updated = await prisma.grievance.update({
      where: { id: req.params.id },
      data: {
        status,
        resolution: resolution || undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        assignedTo: req.user!.id,
      },
    });

    // Add timeline entry
    await prisma.grievanceTimeline.create({
      data: {
        grievanceId: grievance.id,
        action: status,
        description: comment || `Status updated to ${status}`,
        actionBy: req.user!.id,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: grievance.userId,
        type: 'GRIEVANCE_UPDATE',
        title: 'Grievance Status Updated',
        titleHi: 'शिकायत स्थिति अपडेट',
        message: `Your grievance ${grievance.ticketNo} status changed to ${status}`,
        messageHi: `आपकी शिकायत ${grievance.ticketNo} की स्थिति ${status} में बदल गई`,
        data: { grievanceId: grievance.id, status },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Get grievance categories
router.get('/categories/:serviceType', async (req, res, next) => {
  try {
    const { serviceType } = req.params;

    const categories: Record<string, string[]> = {
      ELECTRICITY: ['Billing Issue', 'Power Outage', 'Meter Problem', 'New Connection', 'Load Enhancement', 'Voltage Fluctuation', 'Other'],
      GAS: ['Billing Issue', 'Gas Leakage', 'Meter Problem', 'New Connection', 'Cylinder Delivery', 'Pressure Issue', 'Other'],
      WATER: ['Billing Issue', 'No Water Supply', 'Water Quality', 'Pipe Leakage', 'New Connection', 'Meter Problem', 'Other'],
      MUNICIPAL: ['Waste Collection', 'Road Damage', 'Streetlight Issue', 'Drainage Block', 'Property Tax', 'Birth/Death Certificate', 'Other'],
    };

    if (!categories[serviceType]) {
      throw new ApiError('Invalid service type', 400);
    }

    res.json({
      success: true,
      data: categories[serviceType],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
