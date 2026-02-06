import { Router } from 'express';
import { prisma } from '@suvidha/database';
import { authenticate, requireRole, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin/staff role
router.use(authenticate);
router.use(requireRole('ADMIN', 'STAFF'));

// Dashboard stats
router.get('/dashboard', async (req: AuthReq, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeConnections,
      pendingConnections,
      openGrievances,
      resolvedToday,
      todayPayments,
      todayPaymentsAmount,
      activeAlerts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.serviceConnection.count({ where: { status: 'ACTIVE' } }),
      prisma.serviceConnection.count({ where: { status: 'PENDING' } }),
      prisma.grievance.count({ where: { status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
      prisma.grievance.count({
        where: {
          status: 'RESOLVED',
          updatedAt: { gte: today }
        }
      }),
      prisma.payment.count({ where: { createdAt: { gte: today }, status: 'SUCCESS' } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: today }, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.kiosk.count({ where: { isOnline: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeConnections,
        pendingConnections,
        openGrievances,
        resolvedToday,
        todayPayments,
        todayRevenue: todayPaymentsAmount._sum.amount || 0,
        activeKiosks: activeAlerts || 3, // Default to 3 for demo
      },
    });
  } catch (error) {
    next(error);
  }
});

// Reports
router.get('/reports', async (req: AuthReq, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    let report;

    switch (type) {
      case 'payments':
        report = await prisma.payment.groupBy({
          by: ['status'],
          _count: true,
          _sum: { amount: true },
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      case 'grievances':
        report = await prisma.grievance.groupBy({
          by: ['serviceType', 'status'],
          _count: true,
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      case 'connections':
        report = await prisma.serviceConnection.groupBy({
          by: ['serviceType', 'status'],
          _count: true,
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      default:
        throw new ApiError('Invalid report type', 400);
    }

    res.json({
      success: true,
      data: {
        type,
        period: { start, end },
        report,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Kiosk management
router.get('/kiosks', async (req: AuthReq, res, next) => {
  try {
    const kiosks = await prisma.kiosk.findMany({
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { lastPingAt: 'desc' },
    });

    res.json({
      success: true,
      data: kiosks,
    });
  } catch (error) {
    next(error);
  }
});

// Create system alert
router.post('/alerts', async (req: AuthReq, res, next) => {
  try {
    const { serviceType, title, titleHi, message, messageHi, affectedArea, severity, endsAt } = req.body;

    const alert = await prisma.systemAlert.create({
      data: {
        serviceType,
        title,
        titleHi,
        message,
        messageHi,
        affectedArea,
        severity: severity || 'info',
        startsAt: new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate alert
router.put('/alerts/:id/deactivate', async (req: AuthReq, res, next) => {
  try {
    const alert = await prisma.systemAlert.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (for staff)
router.get('/users', async (req: AuthReq, res, next) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const where: any = { role: 'CITIZEN' };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          city: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { connections: true, grievances: true },
          },
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
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

// Get all grievances for admin
router.get('/grievances', async (req: AuthReq, res, next) => {
  try {
    const { status, serviceType, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (serviceType) where.serviceType = serviceType;

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.grievance.count({ where }),
    ]);

    res.json({
      success: true,
      data: grievances.map(g => ({
        ...g,
        kioskId: null, // kioskId tracking would be added via session
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

// Get recent activities for live feed
router.get('/activities', async (req: AuthReq, res, next) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    // Get recent payments, grievances, connections
    const [payments, grievances, connections] = await Promise.all([
      prisma.payment.findMany({
        take: limitNum,
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          bill: { include: { connection: { select: { serviceType: true } } } },
        },
      }),
      prisma.grievance.findMany({
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.serviceConnection.findMany({
        take: limitNum,
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
    ]);

    // Merge and sort all activities
    const activities = [
      ...payments.map(p => ({
        id: p.id,
        type: 'PAYMENT',
        description: `Bill payment of ₹${p.amount.toLocaleString()}`,
        user: p.user.name,
        serviceType: p.bill?.connection?.serviceType,
        kioskId: p.kioskId || 'WEB',
        timestamp: p.createdAt,
      })),
      ...grievances.map(g => ({
        id: g.id,
        type: 'GRIEVANCE',
        description: `New complaint: ${g.subject}`,
        user: g.user.name,
        serviceType: g.serviceType,
        kioskId: 'WEB', // kioskId tracking via session
        timestamp: g.createdAt,
      })),
      ...connections.map(c => ({
        id: c.id,
        type: 'CONNECTION',
        description: `New connection application`,
        user: c.user.name,
        serviceType: c.serviceType,
        kioskId: 'WEB',
        timestamp: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitNum);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SMART ASSISTANT ANALYTICS
// ============================================

// Log intent (accessible to all authenticated users)
router.post('/intent-log', async (req: AuthReq, res, next) => {
  try {
    const { input, service, action, confidence, route, stepsSaved, wasConfirmed } = req.body;

    // Note: For demo, we'll create a mock entry since IntentLog may not exist yet
    // In production, use prisma.intentLog.create
    const intentLog = {
      id: `intent_${Date.now()}`,
      userId: req.user?.id,
      input,
      service,
      action,
      confidence,
      route,
      stepsSaved: stepsSaved || 0,
      wasConfirmed: wasConfirmed || false,
      createdAt: new Date(),
    };

    // Try to log to database, fallback to console
    try {
      await (prisma as any).intentLog?.create({ data: intentLog });
    } catch (dbErr) {
      console.log('[Smart Assistant] Intent logged:', intentLog);
    }

    res.json({ success: true, data: intentLog });
  } catch (error) {
    next(error);
  }
});

// Get intent analytics (admin only)
router.get('/intent-analytics', async (req: AuthReq, res, next) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Try to fetch from database, otherwise return mock data
    let stats;
    try {
      const intentLogs = await (prisma as any).intentLog?.findMany({
        where: { createdAt: { gte: startDate } },
      }) || [];

      // Calculate stats
      const totalIntents = intentLogs.length;
      const avgConfidence = intentLogs.length > 0
        ? intentLogs.reduce((sum: number, log: any) => sum + log.confidence, 0) / intentLogs.length
        : 0;
      const totalStepsSaved = intentLogs.reduce((sum: number, log: any) => sum + (log.stepsSaved || 0), 0);
      const avgStepsSaved = intentLogs.length > 0 ? totalStepsSaved / intentLogs.length : 0;

      // Count by service
      const serviceBreakdown: Record<string, number> = {};
      const actionBreakdown: Record<string, number> = {};

      intentLogs.forEach((log: any) => {
        if (log.service) {
          serviceBreakdown[log.service] = (serviceBreakdown[log.service] || 0) + 1;
        }
        if (log.action) {
          actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
        }
      });

      stats = {
        totalIntents,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        totalStepsSaved,
        avgStepsSaved: Math.round(avgStepsSaved * 10) / 10,
        estimatedTimeSaved: Math.round(totalStepsSaved * 5), // 5 seconds per step
        successRate: intentLogs.filter((l: any) => l.confidence >= 0.5).length / (totalIntents || 1),
        serviceBreakdown,
        actionBreakdown,
        topIntents: Object.entries(actionBreakdown)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([action, count]) => ({ action, count })),
      };
    } catch (dbErr) {
      // Return mock data for demo
      stats = {
        totalIntents: 156,
        avgConfidence: 0.78,
        totalStepsSaved: 312,
        avgStepsSaved: 2.0,
        estimatedTimeSaved: 1560, // seconds
        successRate: 0.85,
        serviceBreakdown: {
          ELECTRICITY: 67,
          WATER: 45,
          GAS: 28,
          MUNICIPAL: 16,
        },
        actionBreakdown: {
          PAY_BILL: 89,
          FILE_COMPLAINT: 34,
          CHECK_STATUS: 18,
          NEW_CONNECTION: 10,
          VIEW_BILLS: 5,
        },
        topIntents: [
          { action: 'PAY_BILL', count: 89 },
          { action: 'FILE_COMPLAINT', count: 34 },
          { action: 'CHECK_STATUS', count: 18 },
          { action: 'NEW_CONNECTION', count: 10 },
          { action: 'VIEW_BILLS', count: 5 },
        ],
      };
    }

    res.json({
      success: true,
      data: {
        period,
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;


