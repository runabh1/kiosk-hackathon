/**
 * File Upload Module
 * 
 * Handles secure file uploads for grievances and documents.
 * Stores files locally with metadata in database.
 */

import { Router } from 'express';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

// Configure upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Ensure upload directory exists
async function ensureUploadDir(subdir?: string): Promise<string> {
    const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

// Generate secure filename
function generateSecureFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
}

// Validate file type
function isAllowedType(mimeType: string): boolean {
    return ALLOWED_TYPES.includes(mimeType);
}

// Parse multipart form data (simple implementation)
async function parseMultipart(req: any): Promise<{
    fields: Record<string, string>;
    files: Array<{
        fieldName: string;
        originalName: string;
        mimeType: string;
        buffer: Buffer;
    }>;
}> {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';

        if (!contentType.includes('multipart/form-data')) {
            reject(new ApiError('Content-Type must be multipart/form-data', 400));
            return;
        }

        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
            reject(new ApiError('Invalid multipart boundary', 400));
            return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            const body = Buffer.concat(chunks);
            const parts = body.toString('binary').split(`--${boundary}`);

            const fields: Record<string, string> = {};
            const files: Array<{
                fieldName: string;
                originalName: string;
                mimeType: string;
                buffer: Buffer;
            }> = [];

            for (const part of parts) {
                if (part.includes('Content-Disposition')) {
                    const headerMatch = part.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
                    if (!headerMatch) continue;

                    const [, fieldName, filename] = headerMatch;
                    const contentStart = part.indexOf('\r\n\r\n') + 4;
                    const contentEnd = part.lastIndexOf('\r\n');
                    const content = part.substring(contentStart, contentEnd);

                    if (filename) {
                        const mimeMatch = part.match(/Content-Type: ([^\r\n]+)/);
                        const mimeType = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';
                        files.push({
                            fieldName,
                            originalName: filename,
                            mimeType,
                            buffer: Buffer.from(content, 'binary'),
                        });
                    } else {
                        fields[fieldName] = content;
                    }
                }
            }

            resolve({ fields, files });
        });
        req.on('error', reject);
    });
}

router.use(authenticate);

// Upload file(s) for grievance
router.post('/grievance/:grievanceId', async (req: AuthReq, res, next) => {
    try {
        const { grievanceId } = req.params;

        // Verify grievance belongs to user
        const grievance = await prisma.grievance.findFirst({
            where: {
                id: grievanceId,
                userId: req.user!.id,
            },
        });

        if (!grievance) {
            throw new ApiError('Grievance not found', 404);
        }

        // Check existing attachments count
        const existingCount = await prisma.document.count({
            where: { grievanceId },
        });

        if (existingCount >= 5) {
            throw new ApiError('Maximum 5 attachments allowed per grievance', 400);
        }

        // Parse multipart form data
        const { files } = await parseMultipart(req);

        if (files.length === 0) {
            throw new ApiError('No files uploaded', 400);
        }

        const uploadedFiles: any[] = [];
        const uploadDir = await ensureUploadDir('grievances');

        for (const file of files) {
            // Validate file
            if (!isAllowedType(file.mimeType)) {
                throw new ApiError(`File type ${file.mimeType} not allowed`, 400);
            }

            if (file.buffer.length > MAX_FILE_SIZE) {
                throw new ApiError(`File ${file.originalName} exceeds 5MB limit`, 400);
            }

            // Generate secure filename and save
            const secureFilename = generateSecureFilename(file.originalName);
            const filePath = path.join(uploadDir, secureFilename);
            await fs.writeFile(filePath, file.buffer);

            // Create attachment record using Document model
            const attachment = await prisma.document.create({
                data: {
                    userId: req.user!.id,
                    grievanceId,
                    name: file.originalName,
                    type: 'GRIEVANCE_ATTACHMENT',
                    mimeType: file.mimeType,
                    url: filePath,
                    size: file.buffer.length,
                },
            });

            uploadedFiles.push({
                id: attachment.id,
                filename: attachment.name,
                size: attachment.size,
                type: attachment.mimeType,
            });
        }

        // Add timeline entry
        await prisma.grievanceTimeline.create({
            data: {
                grievanceId,
                action: 'ATTACHMENT_ADDED',
                description: `${uploadedFiles.length} file(s) attached to grievance`,
                actionBy: req.user!.name || 'User',
            },
        });

        res.json({
            success: true,
            data: {
                files: uploadedFiles,
                remainingSlots: 5 - existingCount - uploadedFiles.length,
            },
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
    } catch (error) {
        next(error);
    }
});

// Get attachment
router.get('/:attachmentId', async (req: AuthReq, res, next) => {
    try {
        const attachment = await prisma.document.findFirst({
            where: {
                id: req.params.attachmentId,
                userId: req.user!.id,
                grievanceId: { not: null },
            },
        });

        if (!attachment) {
            throw new ApiError('Attachment not found', 404);
        }

        // Read file
        const fileBuffer = await fs.readFile(attachment.url);

        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.name}"`);
        res.send(fileBuffer);
    } catch (error) {
        next(error);
    }
});

// Delete attachment
router.delete('/:attachmentId', async (req: AuthReq, res, next) => {
    try {
        const attachment = await prisma.document.findFirst({
            where: {
                id: req.params.attachmentId,
                userId: req.user!.id,
                grievanceId: { not: null },
            },
        });

        if (!attachment) {
            throw new ApiError('Attachment not found', 404);
        }

        // Delete file from disk
        try {
            await fs.unlink(attachment.url);
        } catch (e) {
            // File might already be deleted, continue
        }

        // Delete from database
        await prisma.document.delete({
            where: { id: attachment.id },
        });

        res.json({
            success: true,
            message: 'Attachment deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Upload documents for connection application
router.post('/connection/:connectionId', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.params;

        // Verify connection belongs to user
        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
            },
        });

        if (!connection) {
            throw new ApiError('Connection not found', 404);
        }

        // Check existing documents count
        const existingCount = await prisma.document.count({
            where: { connectionId },
        });

        if (existingCount >= 10) {
            throw new ApiError('Maximum 10 documents allowed per connection application', 400);
        }

        // Parse multipart form data
        const { files, fields } = await parseMultipart(req);

        if (files.length === 0) {
            throw new ApiError('No files uploaded', 400);
        }

        const documentType = fields.documentType || 'IDENTITY_PROOF';
        const uploadedFiles: any[] = [];
        const uploadDir = await ensureUploadDir('connections');

        for (const file of files) {
            // Validate file
            if (!isAllowedType(file.mimeType)) {
                throw new ApiError(`File type ${file.mimeType} not allowed`, 400);
            }

            if (file.buffer.length > MAX_FILE_SIZE) {
                throw new ApiError(`File ${file.originalName} exceeds 5MB limit`, 400);
            }

            // Generate secure filename and save
            const secureFilename = generateSecureFilename(file.originalName);
            const filePath = path.join(uploadDir, secureFilename);
            await fs.writeFile(filePath, file.buffer);

            // Create document record
            const document = await prisma.document.create({
                data: {
                    userId: req.user!.id,
                    connectionId,
                    name: file.originalName,
                    type: documentType,
                    mimeType: file.mimeType,
                    url: filePath,
                    size: file.buffer.length,
                },
            });

            uploadedFiles.push({
                id: document.id,
                filename: document.name,
                size: document.size,
                type: document.mimeType,
                documentType: document.type,
            });
        }

        res.json({
            success: true,
            data: {
                files: uploadedFiles,
                remainingSlots: 10 - existingCount - uploadedFiles.length,
            },
            message: `${uploadedFiles.length} document(s) uploaded successfully`,
        });
    } catch (error) {
        next(error);
    }
});

// Download attachment (force download)
router.get('/:attachmentId/download', async (req: AuthReq, res, next) => {
    try {
        const attachment = await prisma.document.findFirst({
            where: {
                id: req.params.attachmentId,
                userId: req.user!.id,
            },
        });

        if (!attachment) {
            throw new ApiError('Document not found', 404);
        }

        // Read file
        const fileBuffer = await fs.readFile(attachment.url);

        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
        res.setHeader('Content-Length', fileBuffer.length.toString());
        res.send(fileBuffer);
    } catch (error) {
        next(error);
    }
});

// Get all documents for a connection
router.get('/connection/:connectionId', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.params;

        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
            },
        });

        if (!connection) {
            throw new ApiError('Connection not found', 404);
        }

        const documents = await prisma.document.findMany({
            where: { connectionId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                mimeType: doc.mimeType,
                size: doc.size,
                createdAt: doc.createdAt,
            })),
        });
    } catch (error) {
        next(error);
    }
});

export default router;

