import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Get all service requests for user
router.get('/', async (req: AuthReq, res, next) => {
    try {
        const requests = await prisma.serviceRequest.findMany({
            where: { userId: req.user!.id },
            include: { connection: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        next(error);
    }
});

// Submit a new service request
const serviceRequestSchema = z.object({
    connectionId: z.string().optional(),
    type: z.enum(['NAME_CHANGE', 'LOAD_CHANGE', 'DISCONNECTION', 'METER_TEST', 'ADDRESS_UPDATE']),
    description: z.string().min(10),
    data: z.any(),
});

router.post('/', async (req: AuthReq, res, next) => {
    try {
        const { connectionId, type, description, data } = serviceRequestSchema.parse(req.body);

        // If connectionId is provided, verify it belongs to user
        if (connectionId) {
            const connection = await prisma.serviceConnection.findFirst({
                where: { id: connectionId, userId: req.user!.id },
            });
            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }
        }

        const request = await prisma.serviceRequest.create({
            data: {
                userId: req.user!.id,
                connectionId,
                type,
                description,
                data: data || {},
                status: 'SUBMITTED',
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: req.user!.id,
                type: 'SERVICE_UPDATE',
                title: 'Service Request Submitted',
                titleHi: 'सेवा अनुरोध जमा किया गया',
                message: `Your request for ${type.replace('_', ' ')} has been submitted successfully.`,
                messageHi: `आपका ${type.replace('_', ' ')} के लिए अनुरोध सफलतापूर्वक जमा कर दिया गया है।`,
                data: { requestId: request.id },
            },
        });

        res.status(201).json({
            success: true,
            data: request,
            message: 'Service request submitted successfully',
        });
    } catch (error) {
        next(error);
    }
});


// Get approval certificate
import { getApprovalDocumentData, generateApprovalHTML } from './document-generator';

router.get('/:id/certificate', async (req: AuthReq, res, next) => {
    try {
        const { lang = 'en' } = req.query;
        const data = await getApprovalDocumentData(req.params.id, req.user!.id);

        if (!data) {
            throw new ApiError('Certificate not found or request not completed', 404);
        }

        const html = generateApprovalHTML(data, lang as 'en' | 'hi');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        next(error);
    }
});

export default router;

