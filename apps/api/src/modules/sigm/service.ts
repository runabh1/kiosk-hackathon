/**
 * SIGM - Single-Interaction Guarantee Mode
 * Service Layer - Core guarantee check logic
 * 
 * This service implements rule-based validation to determine if a citizen's
 * request can be completed without repeat visits.
 */

import { prisma } from '@suvidha/database';
import {
    GuaranteeCheckRequest,
    GuaranteeCheckResult,
    GuaranteeStatus,
    BlockingReason,
    BackendAction,
    ValidationResult,
    SIGM_CONFIGS,
    RequestLockCheck,
} from './types';

/**
 * Performs a comprehensive guarantee check before request submission
 */
export async function performGuaranteeCheck(
    request: GuaranteeCheckRequest
): Promise<GuaranteeCheckResult> {
    const config = SIGM_CONFIGS[request.requestType];

    // Run all validations
    const documentValidation = await validateDocuments(request, config);
    const serviceAvailability = await checkServiceAvailability(request);
    const backendDependencies = await checkBackendDependencies(request, config);
    const duplicateCheck = await checkForDuplicates(request, config);

    // Collect all blocking reasons
    const blockingReasons: BlockingReason[] = [];
    const backendActions: BackendAction[] = [];

    // Process document validation issues
    if (!documentValidation.passed) {
        blockingReasons.push(...createDocumentBlockingReasons(documentValidation.issues));
    }

    // Process service availability issues
    if (!serviceAvailability.passed) {
        blockingReasons.push(...createServiceBlockingReasons(serviceAvailability.issues));
    }

    // Process backend dependency issues
    if (!backendDependencies.passed) {
        const { reasons, actions } = processBackendDependencyIssues(backendDependencies.issues, request);
        blockingReasons.push(...reasons);
        backendActions.push(...actions);
    }

    // Process duplicate issues
    if (!duplicateCheck.passed) {
        blockingReasons.push(...createDuplicateBlockingReasons(duplicateCheck.issues));
    }

    // Determine guarantee status
    const guaranteeStatus = determineGuaranteeStatus(blockingReasons, backendActions);

    // Generate citizen-friendly message
    const citizenMessage = generateCitizenMessage(guaranteeStatus, blockingReasons, backendActions);

    return {
        guaranteeStatus,
        requestType: request.requestType,
        serviceType: request.serviceType,
        blockingReasons,
        backendActions,
        checkDetails: {
            documentValidation,
            serviceAvailability,
            backendDependencies,
            duplicateCheck,
            timestamp: new Date(),
        },
        citizenMessage,
    };
}

/**
 * Validates required documents are present
 */
async function validateDocuments(
    request: GuaranteeCheckRequest,
    config: typeof SIGM_CONFIGS['BILL_PAYMENT']
): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: string[] = [];

    if (config.requiredDocuments.length === 0) {
        details.push('No documents required for this request type');
        return { passed: true, details, issues };
    }

    // For new connection requests, check if user has uploaded required documents
    if (request.requestType === 'NEW_CONNECTION') {
        details.push('Checking for required documents: ID Proof, Address Proof');

        const userDocuments = await prisma.document.findMany({
            where: { userId: request.userId },
            select: { type: true },
        });

        const userDocTypes = userDocuments.map(d => d.type);

        for (const requiredDoc of config.requiredDocuments) {
            if (!userDocTypes.includes(requiredDoc)) {
                issues.push(`Missing document: ${requiredDoc}`);
            } else {
                details.push(`Found: ${requiredDoc}`);
            }
        }
    }

    return {
        passed: issues.length === 0,
        details,
        issues,
    };
}

/**
 * Checks if service is available in citizen's area
 */
async function checkServiceAvailability(
    request: GuaranteeCheckRequest
): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: string[] = [];

    // Check for any active service outages
    const activeAlerts = await prisma.systemAlert.findMany({
        where: {
            serviceType: request.serviceType,
            isActive: true,
            severity: 'critical',
        },
    });

    if (activeAlerts.length > 0) {
        issues.push(`Service currently disrupted in your area: ${activeAlerts[0].title}`);
        details.push(`Active alert: ${activeAlerts[0].id}`);
    } else {
        details.push('No service disruptions in your area');
    }

    // For new connections, check if area is serviceable
    if (request.requestType === 'NEW_CONNECTION' && request.data.pincode) {
        // Mock check - in production, this would query a service area database
        const serviceableAreas = ['781001', '781002', '781003', '781004', '781005', '781006', '781007', '781008', '781009', '781010'];

        if (!serviceableAreas.includes(request.data.pincode)) {
            issues.push('Service not yet available in your area (PIN: ' + request.data.pincode + ')');
        } else {
            details.push(`Area ${request.data.pincode} is serviceable`);
        }
    }

    return {
        passed: issues.length === 0,
        details,
        issues,
    };
}

/**
 * Checks backend dependencies (technician availability, capacity, approvals)
 */
async function checkBackendDependencies(
    request: GuaranteeCheckRequest,
    config: typeof SIGM_CONFIGS['BILL_PAYMENT']
): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: string[] = [];

    // Check technician availability for connection requests
    if (config.technicianRequired) {
        // Mock check - in production, check technician schedule system
        const pendingConnections = await prisma.serviceConnection.count({
            where: {
                status: 'PENDING',
                serviceType: request.serviceType,
                state: request.data.state || 'Assam',
            },
        });

        // If too many pending requests, technicians might be backed up
        if (pendingConnections > 50) {
            issues.push('TECHNICIAN_QUEUE_HIGH');
            details.push(`${pendingConnections} pending connection requests in queue`);
        } else {
            details.push('Technicians available for timely installation');
        }
    }

    // For bill payments, check if payment gateway is available
    if (request.requestType === 'BILL_PAYMENT') {
        // Mock check - payment gateway always available
        details.push('Payment gateway operational');
    }

    // For complaints, check staff capacity
    if (request.requestType === 'COMPLAINT_REGISTRATION') {
        const openGrievances = await prisma.grievance.count({
            where: {
                status: { in: ['SUBMITTED', 'IN_PROGRESS'] },
                serviceType: request.serviceType,
            },
        });

        if (openGrievances > 100) {
            issues.push('SUPPORT_QUEUE_HIGH');
            details.push(`${openGrievances} pending grievances in queue`);
        } else {
            details.push('Support staff available for prompt resolution');
        }
    }

    return {
        passed: issues.length === 0,
        details,
        issues,
    };
}

/**
 * Checks for duplicate or similar existing requests
 */
async function checkForDuplicates(
    request: GuaranteeCheckRequest,
    config: typeof SIGM_CONFIGS['BILL_PAYMENT']
): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: string[] = [];

    const checkWindowStart = new Date();
    checkWindowStart.setHours(checkWindowStart.getHours() - config.duplicateCheckWindow);

    // Check for duplicate based on request type
    switch (request.requestType) {
        case 'BILL_PAYMENT':
            // Check if bill is already paid or payment pending
            if (request.data.billId) {
                const existingPayment = await prisma.payment.findFirst({
                    where: {
                        billId: request.data.billId,
                        status: { in: ['SUCCESS', 'PENDING'] },
                    },
                });
                if (existingPayment) {
                    issues.push(`DUPLICATE_PAYMENT:${existingPayment.id}`);
                }
            }
            break;

        case 'NEW_CONNECTION':
            // Check for pending connection application for same address
            const existingConnection = await prisma.serviceConnection.findFirst({
                where: {
                    userId: request.userId,
                    serviceType: request.serviceType,
                    status: 'PENDING',
                    address: request.data.address,
                    createdAt: { gte: checkWindowStart },
                },
            });
            if (existingConnection) {
                issues.push(`DUPLICATE_CONNECTION:${existingConnection.connectionNo}`);
            }
            break;

        case 'COMPLAINT_REGISTRATION':
            // Check for similar recent complaint
            if (request.data.category) {
                const existingGrievance = await prisma.grievance.findFirst({
                    where: {
                        userId: request.userId,
                        serviceType: request.serviceType,
                        category: request.data.category,
                        status: { in: ['SUBMITTED', 'IN_PROGRESS'] },
                        createdAt: { gte: checkWindowStart },
                    },
                });
                if (existingGrievance) {
                    issues.push(`DUPLICATE_COMPLAINT:${existingGrievance.ticketNo}`);
                }
            }
            break;
    }

    if (issues.length === 0) {
        details.push('No duplicate requests found');
    }

    return {
        passed: issues.length === 0,
        details,
        issues,
    };
}

/**
 * Creates blocking reasons for document issues
 */
function createDocumentBlockingReasons(issues: string[]): BlockingReason[] {
    return issues.map(issue => {
        const docType = issue.replace('Missing document: ', '');
        return {
            code: 'MISSING_DOCUMENT',
            message: `Please upload ${docType.replace('_', ' ').toLowerCase()} before proceeding`,
            messageHi: `कृपया आगे बढ़ने से पहले ${docType === 'ID_PROOF' ? 'पहचान प्रमाण' : 'पता प्रमाण'} अपलोड करें`,
            category: 'DOCUMENT' as const,
            severity: 'ERROR' as const,
            resolutionHint: 'You can upload documents from your profile or at the Help Desk',
            resolutionHintHi: 'आप अपनी प्रोफ़ाइल या हेल्प डेस्क पर दस्तावेज अपलोड कर सकते हैं',
        };
    });
}

/**
 * Creates blocking reasons for service availability issues
 */
function createServiceBlockingReasons(issues: string[]): BlockingReason[] {
    return issues.map(issue => ({
        code: 'SERVICE_UNAVAILABLE',
        message: issue,
        messageHi: issue.includes('not yet available')
            ? 'आपके क्षेत्र में सेवा अभी उपलब्ध नहीं है'
            : 'सेवा वर्तमान में बाधित है',
        category: 'SERVICE' as const,
        severity: 'ERROR' as const,
        resolutionHint: 'Service expansion is in progress. Check back later.',
        resolutionHintHi: 'सेवा विस्तार जारी है। बाद में पुनः जांचें।',
    }));
}

/**
 * Creates blocking reasons for duplicate requests
 */
function createDuplicateBlockingReasons(issues: string[]): BlockingReason[] {
    return issues.map(issue => {
        const [type, ref] = issue.split(':');

        switch (type) {
            case 'DUPLICATE_PAYMENT':
                return {
                    code: 'DUPLICATE_PAYMENT',
                    message: 'A payment for this bill is already in process or completed',
                    messageHi: 'इस बिल के लिए भुगतान पहले से प्रक्रिया में है या पूरा हो गया है',
                    category: 'DUPLICATE' as const,
                    severity: 'ERROR' as const,
                };
            case 'DUPLICATE_CONNECTION':
                return {
                    code: 'DUPLICATE_CONNECTION',
                    message: `You already have a pending connection application (${ref})`,
                    messageHi: `आपका पहले से एक लंबित कनेक्शन आवेदन है (${ref})`,
                    category: 'DUPLICATE' as const,
                    severity: 'ERROR' as const,
                    resolutionHint: 'Check your existing application status in My Connections',
                    resolutionHintHi: 'मेरे कनेक्शन में अपने मौजूदा आवेदन की स्थिति जांचें',
                };
            case 'DUPLICATE_COMPLAINT':
                return {
                    code: 'DUPLICATE_COMPLAINT',
                    message: `A similar complaint is already being processed (${ref})`,
                    messageHi: `इसी तरह की शिकायत पहले से संसाधित हो रही है (${ref})`,
                    category: 'DUPLICATE' as const,
                    severity: 'WARNING' as const,
                    resolutionHint: 'You can track your existing complaint or add more details to it',
                    resolutionHintHi: 'आप अपनी मौजूदा शिकायत को ट्रैक कर सकते हैं या उसमें और विवरण जोड़ सकते हैं',
                };
            default:
                return {
                    code: 'DUPLICATE_REQUEST',
                    message: 'A similar request already exists',
                    messageHi: 'इसी तरह का अनुरोध पहले से मौजूद है',
                    category: 'DUPLICATE' as const,
                    severity: 'WARNING' as const,
                };
        }
    });
}

/**
 * Processes backend dependency issues and creates actions
 */
function processBackendDependencyIssues(
    issues: string[],
    request: GuaranteeCheckRequest
): { reasons: BlockingReason[]; actions: BackendAction[] } {
    const reasons: BlockingReason[] = [];
    const actions: BackendAction[] = [];

    for (const issue of issues) {
        if (issue === 'TECHNICIAN_QUEUE_HIGH') {
            reasons.push({
                code: 'HIGH_DEMAND',
                message: 'Due to high demand, installation may take longer than usual',
                messageHi: 'उच्च मांग के कारण, स्थापना में सामान्य से अधिक समय लग सकता है',
                category: 'BACKEND' as const,
                severity: 'WARNING' as const,
                resolutionHint: 'Your request will be queued and processed in order',
                resolutionHintHi: 'आपका अनुरोध कतार में जोड़ा जाएगा और क्रम में संसाधित किया जाएगा',
            });
            actions.push({
                actionType: 'SCHEDULE_TECHNICIAN',
                description: 'Schedule technician visit for new connection installation',
                descriptionHi: 'नए कनेक्शन स्थापना के लिए तकनीशियन का दौरा शेड्यूल करें',
                priority: 3,
                estimatedCompletion: 'Within 7-10 working days',
                estimatedCompletionHi: '7-10 कार्य दिवसों के भीतर',
            });
        }

        if (issue === 'SUPPORT_QUEUE_HIGH') {
            reasons.push({
                code: 'HIGH_SUPPORT_LOAD',
                message: 'Response time may be longer due to high volume of complaints',
                messageHi: 'शिकायतों की अधिक संख्या के कारण प्रतिक्रिया समय अधिक हो सकता है',
                category: 'BACKEND' as const,
                severity: 'WARNING' as const,
                resolutionHint: 'Your complaint will be addressed based on priority',
                resolutionHintHi: 'आपकी शिकायत प्राथमिकता के आधार पर संबोधित की जाएगी',
            });
            actions.push({
                actionType: 'QUEUE_FOR_REVIEW',
                description: 'Queue complaint for priority review by support team',
                descriptionHi: 'सहायता टीम द्वारा प्राथमिकता समीक्षा के लिए शिकायत कतार में जोड़ें',
                priority: 5,
                estimatedCompletion: 'Initial response within 2-3 working days',
                estimatedCompletionHi: 'प्रारंभिक प्रतिक्रिया 2-3 कार्य दिवसों के भीतर',
            });
        }
    }

    return { reasons, actions };
}

/**
 * Determines the final guarantee status
 */
function determineGuaranteeStatus(
    blockingReasons: BlockingReason[],
    backendActions: BackendAction[]
): GuaranteeStatus {
    // If any ERROR-level blocking reason exists that's not backend-related, block
    const hasBlockingError = blockingReasons.some(
        r => r.severity === 'ERROR' && (r.category === 'DOCUMENT' || r.category === 'SERVICE' || r.category === 'DUPLICATE')
    );

    if (hasBlockingError) {
        return 'BLOCKED';
    }

    // If there are backend actions needed, not guaranteed but can proceed
    if (backendActions.length > 0 || blockingReasons.some(r => r.category === 'BACKEND')) {
        return 'NOT_GUARANTEED';
    }

    // If only warnings or no issues, guaranteed
    return 'GUARANTEED';
}

/**
 * Generates citizen-friendly messages
 */
function generateCitizenMessage(
    status: GuaranteeStatus,
    blockingReasons: BlockingReason[],
    backendActions: BackendAction[]
): { title: string; titleHi: string; message: string; messageHi: string } {
    switch (status) {
        case 'GUARANTEED':
            return {
                title: 'Guaranteed: This request will be completed without any repeat visit.',
                titleHi: 'गारंटीड: यह अनुरोध बिना किसी दोबारा आने के पूरा होगा।',
                message: 'All requirements are met. Your request will be processed immediately upon submission.',
                messageHi: 'सभी आवश्यकताएं पूरी हैं। सबमिशन के तुरंत बाद आपका अनुरोध संसाधित किया जाएगा।',
            };

        case 'NOT_GUARANTEED':
            const firstAction = backendActions[0];
            return {
                title: 'Not Guaranteed: Additional backend action required, but no re-application needed.',
                titleHi: 'गारंटी नहीं: अतिरिक्त बैकएंड कार्रवाई आवश्यक है, लेकिन दोबारा आवेदन की जरूरत नहीं।',
                message: `Your request will be accepted, but ${firstAction?.estimatedCompletion || 'may take additional time'}. You will NOT need to restart or resubmit this request.`,
                messageHi: `आपका अनुरोध स्वीकार किया जाएगा, लेकिन ${firstAction?.estimatedCompletionHi || 'अतिरिक्त समय लग सकता है'}। आपको इस अनुरोध को दोबारा शुरू या फिर से जमा करने की जरूरत नहीं होगी।`,
            };

        case 'BLOCKED':
            const primaryReason = blockingReasons.find(r => r.severity === 'ERROR');
            return {
                title: 'Cannot Proceed: Action Required',
                titleHi: 'आगे नहीं बढ़ सकते: कार्रवाई आवश्यक',
                message: primaryReason?.message || 'Please resolve the issues shown before proceeding.',
                messageHi: primaryReason?.messageHi || 'कृपया आगे बढ़ने से पहले दिखाई गई समस्याओं का समाधान करें।',
            };
    }
}

/**
 * Checks if a request is locked (prevents duplicates)
 */
export async function checkRequestLock(
    userId: string,
    serviceType: string,
    requestType: string,
    identifier: string
): Promise<RequestLockCheck> {
    const lockKey = `${userId}_${serviceType}_${requestType}_${identifier}`;

    const existingLock = await prisma.requestLock.findFirst({
        where: {
            lockKey,
            isActive: true,
            expiresAt: { gt: new Date() },
        },
    });

    if (existingLock) {
        return {
            isLocked: true,
            lockKey,
            existingRequestId: existingLock.requestId || undefined,
            message: 'A similar request was recently submitted and is being processed.',
            messageHi: 'इसी तरह का एक अनुरोध हाल ही में सबमिट किया गया था और संसाधित किया जा रहा है।',
        };
    }

    return { isLocked: false, lockKey };
}

/**
 * Creates a request lock
 */
export async function createRequestLock(
    userId: string,
    serviceType: string,
    requestType: string,
    identifier: string,
    lockDurationHours: number,
    requestId?: string
): Promise<string> {
    const lockKey = `${userId}_${serviceType}_${requestType}_${identifier}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + lockDurationHours);

    const lock = await prisma.requestLock.create({
        data: {
            userId,
            serviceType: serviceType as any,
            requestType: requestType as any,
            lockKey,
            expiresAt,
            requestId,
        },
    });

    return lock.id;
}

/**
 * Logs a SIGM check result
 */
export async function logSIGMCheck(
    userId: string,
    kioskId: string | undefined,
    result: GuaranteeCheckResult
): Promise<string> {
    const sigmLog = await prisma.sIGMLog.create({
        data: {
            userId,
            kioskId,
            requestType: result.requestType as any,
            serviceType: result.serviceType as any,
            guaranteeStatus: result.guaranteeStatus as any,
            blockingReasons: result.blockingReasons,
            checkDetails: result.checkDetails as any,
        },
    });

    return sigmLog.id;
}

/**
 * Records citizen acknowledgment
 */
export async function acknowledgeSIGMCheck(sigmLogId: string): Promise<void> {
    await prisma.sIGMLog.update({
        where: { id: sigmLogId },
        data: {
            citizenAcknowledged: true,
            acknowledgedAt: new Date(),
        },
    });
}

/**
 * Records request submission after acknowledgment
 */
export async function recordSIGMSubmission(
    sigmLogId: string,
    requestId: string
): Promise<void> {
    await prisma.sIGMLog.update({
        where: { id: sigmLogId },
        data: {
            requestSubmitted: true,
            submittedAt: new Date(),
            requestId,
        },
    });
}

/**
 * Queues backend actions for non-guaranteed requests
 */
export async function queueBackendActions(
    sigmLogId: string,
    userId: string,
    serviceType: string,
    requestType: string,
    actions: BackendAction[]
): Promise<void> {
    for (const action of actions) {
        await prisma.backendActionQueue.create({
            data: {
                sigmLogId,
                userId,
                serviceType: serviceType as any,
                requestType: requestType as any,
                actionRequired: action.description,
                actionRequiredHi: action.descriptionHi,
                actionDetails: action as any,
                priority: action.priority,
                scheduledFor: action.scheduledFor,
            },
        });
    }
}
