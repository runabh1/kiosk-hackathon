/**
 * SIGM - Single-Interaction Guarantee Mode
 * API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq, requireRole } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import {
    performGuaranteeCheck,
    checkRequestLock,
    createRequestLock,
    logSIGMCheck,
    acknowledgeSIGMCheck,
    recordSIGMSubmission,
    queueBackendActions,
} from './service';
import { GuaranteeCheckRequest, SIGM_CONFIGS, RequestType } from './types';

const router = Router();

// All SIGM routes require authentication
router.use(authenticate);

// Schema for guarantee check request
const guaranteeCheckSchema = z.object({
    requestType: z.enum(['BILL_PAYMENT', 'NEW_CONNECTION', 'COMPLAINT_REGISTRATION', 'DOCUMENT_REQUEST', 'METER_READING']),
    serviceType: z.enum(['ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL']),
    data: z.record(z.any()).optional(),
});

/**
 * POST /api/sigm/check
 * Perform pre-submission guarantee check
 */
router.post('/check', async (req: AuthReq, res, next) => {
    try {
        const { requestType, serviceType, data } = guaranteeCheckSchema.parse(req.body);

        const checkRequest: GuaranteeCheckRequest = {
            requestType,
            serviceType,
            userId: req.user!.id,
            kioskId: req.headers['x-kiosk-id'] as string,
            data: data || {},
        };

        // Perform the guarantee check
        const result = await performGuaranteeCheck(checkRequest);

        // Log the check
        const sigmLogId = await logSIGMCheck(
            req.user!.id,
            req.headers['x-kiosk-id'] as string,
            result
        );

        res.json({
            success: true,
            data: {
                sigmLogId,
                ...result,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Schema for acknowledgment
const acknowledgeSchema = z.object({
    sigmLogId: z.string(),
});

/**
 * POST /api/sigm/acknowledge
 * Record citizen acknowledgment of guarantee status
 */
router.post('/acknowledge', async (req: AuthReq, res, next) => {
    try {
        const { sigmLogId } = acknowledgeSchema.parse(req.body);

        // Verify the SIGM log belongs to this user
        const sigmLog = await prisma.sIGMLog.findFirst({
            where: {
                id: sigmLogId,
                userId: req.user!.id,
            },
        });

        if (!sigmLog) {
            throw new ApiError('Guarantee check not found', 404);
        }

        if (sigmLog.citizenAcknowledged) {
            throw new ApiError('Already acknowledged', 400);
        }

        await acknowledgeSIGMCheck(sigmLogId);

        res.json({
            success: true,
            message: 'Acknowledgment recorded',
            data: {
                sigmLogId,
                acknowledgedAt: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Schema for lock check
const lockCheckSchema = z.object({
    serviceType: z.enum(['ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL']),
    requestType: z.enum(['BILL_PAYMENT', 'NEW_CONNECTION', 'COMPLAINT_REGISTRATION', 'DOCUMENT_REQUEST', 'METER_READING']),
    identifier: z.string(), // billId, connectionId, etc.
});

/**
 * POST /api/sigm/check-lock
 * Check if a similar request is already locked
 */
router.post('/check-lock', async (req: AuthReq, res, next) => {
    try {
        const { serviceType, requestType, identifier } = lockCheckSchema.parse(req.body);

        const lockCheck = await checkRequestLock(
            req.user!.id,
            serviceType,
            requestType,
            identifier
        );

        res.json({
            success: true,
            data: lockCheck,
        });
    } catch (error) {
        next(error);
    }
});

// Schema for submission recording
const submissionSchema = z.object({
    sigmLogId: z.string(),
    requestId: z.string(),
    lockIdentifier: z.string().optional(),
});

/**
 * POST /api/sigm/record-submission
 * Record the actual submission after acknowledgment
 */
router.post('/record-submission', async (req: AuthReq, res, next) => {
    try {
        const { sigmLogId, requestId, lockIdentifier } = submissionSchema.parse(req.body);

        // Verify the SIGM log belongs to this user
        const sigmLog = await prisma.sIGMLog.findFirst({
            where: {
                id: sigmLogId,
                userId: req.user!.id,
            },
        });

        if (!sigmLog) {
            throw new ApiError('Guarantee check not found', 404);
        }

        if (!sigmLog.citizenAcknowledged) {
            throw new ApiError('Must acknowledge guarantee status before submission', 400);
        }

        // Record the submission
        await recordSIGMSubmission(sigmLogId, requestId);

        // Create lock to prevent duplicates
        if (lockIdentifier) {
            const config = SIGM_CONFIGS[sigmLog.requestType as RequestType];
            await createRequestLock(
                req.user!.id,
                sigmLog.serviceType,
                sigmLog.requestType,
                lockIdentifier,
                config.lockDuration,
                requestId
            );
        }

        // If not guaranteed, queue backend actions
        if (sigmLog.guaranteeStatus === 'NOT_GUARANTEED' && sigmLog.checkDetails) {
            const checkDetails = sigmLog.checkDetails as any;
            // Extract backend actions if they exist from blocking reasons or check details
            // In a real scenario, we'd store these in the check result
        }

        res.json({
            success: true,
            message: 'Submission recorded',
            data: {
                sigmLogId,
                requestId,
                submittedAt: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sigm/history
 * Get user's SIGM check history
 */
router.get('/history', async (req: AuthReq, res, next) => {
    try {
        const { page = '1', limit = '10' } = req.query;

        const [logs, total] = await Promise.all([
            prisma.sIGMLog.findMany({
                where: { userId: req.user!.id },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string),
            }),
            prisma.sIGMLog.count({ where: { userId: req.user!.id } }),
        ]);

        res.json({
            success: true,
            data: logs,
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

// ============================================
// ADMIN ANALYTICS ROUTES
// ============================================

/**
 * GET /api/sigm/analytics
 * Get SIGM analytics for admin dashboard
 */
router.get('/analytics', requireRole('ADMIN', 'STAFF'), async (req: AuthReq, res, next) => {
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

        // Get SIGM statistics
        const [
            totalChecks,
            guaranteedCount,
            notGuaranteedCount,
            blockedCount,
            submittedAfterCheck,
            checksByService,
            checksByRequestType,
        ] = await Promise.all([
            prisma.sIGMLog.count({
                where: { createdAt: { gte: startDate } },
            }),
            prisma.sIGMLog.count({
                where: { createdAt: { gte: startDate }, guaranteeStatus: 'GUARANTEED' },
            }),
            prisma.sIGMLog.count({
                where: { createdAt: { gte: startDate }, guaranteeStatus: 'NOT_GUARANTEED' },
            }),
            prisma.sIGMLog.count({
                where: { createdAt: { gte: startDate }, guaranteeStatus: 'BLOCKED' },
            }),
            prisma.sIGMLog.count({
                where: { createdAt: { gte: startDate }, requestSubmitted: true },
            }),
            prisma.sIGMLog.groupBy({
                by: ['serviceType'],
                _count: true,
                where: { createdAt: { gte: startDate } },
            }),
            prisma.sIGMLog.groupBy({
                by: ['requestType', 'guaranteeStatus'],
                _count: true,
                where: { createdAt: { gte: startDate } },
            }),
        ]);

        // Calculate guaranteed percentage
        const guaranteedPercentage = totalChecks > 0
            ? Math.round((guaranteedCount / totalChecks) * 100)
            : 0;

        // Calculate repeat visits avoided (estimated)
        const repeatVisitsAvoided = submittedAfterCheck;

        // Find services with lowest guarantee success
        const serviceGuaranteeRates: Record<string, { total: number; guaranteed: number; rate: number }> = {};

        for (const item of checksByRequestType) {
            const key = item.requestType;
            if (!serviceGuaranteeRates[key]) {
                serviceGuaranteeRates[key] = { total: 0, guaranteed: 0, rate: 0 };
            }
            serviceGuaranteeRates[key].total += item._count;
            if (item.guaranteeStatus === 'GUARANTEED') {
                serviceGuaranteeRates[key].guaranteed += item._count;
            }
        }

        // Calculate rates
        Object.keys(serviceGuaranteeRates).forEach(key => {
            const item = serviceGuaranteeRates[key];
            item.rate = item.total > 0 ? Math.round((item.guaranteed / item.total) * 100) : 0;
        });

        // Sort by lowest rate
        const lowestGuaranteeServices = Object.entries(serviceGuaranteeRates)
            .sort(([, a], [, b]) => a.rate - b.rate)
            .slice(0, 5)
            .map(([service, data]) => ({ service, ...data }));

        // Get pending backend actions
        const pendingBackendActions = await prisma.backendActionQueue.count({
            where: { status: 'PENDING' },
        });

        res.json({
            success: true,
            data: {
                period,
                summary: {
                    totalChecks,
                    guaranteedCount,
                    notGuaranteedCount,
                    blockedCount,
                    submittedAfterCheck,
                    guaranteedPercentage,
                    repeatVisitsAvoided,
                    pendingBackendActions,
                },
                serviceBreakdown: checksByService.reduce((acc: Record<string, number>, item: { serviceType: string; _count: number }) => {
                    acc[item.serviceType] = item._count;
                    return acc;
                }, {} as Record<string, number>),
                requestTypeBreakdown: serviceGuaranteeRates,
                lowestGuaranteeServices,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sigm/backend-actions
 * Get pending backend actions for admin
 */
router.get('/backend-actions', requireRole('ADMIN', 'STAFF'), async (req: AuthReq, res, next) => {
    try {
        const { status = 'PENDING', page = '1', limit = '20' } = req.query;

        const where: any = {};
        if (status !== 'all') where.status = status;

        const [actions, total] = await Promise.all([
            prisma.backendActionQueue.findMany({
                where,
                include: {
                    user: { select: { name: true, phone: true } },
                },
                orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string),
            }),
            prisma.backendActionQueue.count({ where }),
        ]);

        res.json({
            success: true,
            data: actions,
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

/**
 * PUT /api/sigm/backend-actions/:id
 * Update backend action status
 */
router.put('/backend-actions/:id', requireRole('ADMIN', 'STAFF'), async (req: AuthReq, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const action = await prisma.backendActionQueue.update({
            where: { id },
            data: {
                status,
                notes,
                assignedTo: req.user!.id,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
        });

        res.json({
            success: true,
            data: action,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
