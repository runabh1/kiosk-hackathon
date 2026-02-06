/**
 * SIGM - Single-Interaction Guarantee Mode
 * Type definitions for the guarantee check system
 */

export type GuaranteeStatus = 'GUARANTEED' | 'NOT_GUARANTEED' | 'BLOCKED';

export type RequestType =
    | 'BILL_PAYMENT'
    | 'NEW_CONNECTION'
    | 'COMPLAINT_REGISTRATION'
    | 'DOCUMENT_REQUEST'
    | 'METER_READING';

export type ServiceType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';

export interface BlockingReason {
    code: string;
    message: string;       // Citizen-friendly message in English
    messageHi: string;     // Citizen-friendly message in Hindi
    category: 'DOCUMENT' | 'SERVICE' | 'BACKEND' | 'DUPLICATE' | 'OTHER';
    severity: 'WARNING' | 'ERROR';
    resolutionHint?: string;
    resolutionHintHi?: string;
}

export interface BackendAction {
    actionType: string;
    description: string;
    descriptionHi: string;
    priority: number;
    scheduledFor?: Date;
    estimatedCompletion?: string;
    estimatedCompletionHi?: string;
}

export interface GuaranteeCheckResult {
    guaranteeStatus: GuaranteeStatus;
    requestType: RequestType;
    serviceType: ServiceType;
    blockingReasons: BlockingReason[];
    backendActions: BackendAction[];
    checkDetails: {
        documentValidation: ValidationResult;
        serviceAvailability: ValidationResult;
        backendDependencies: ValidationResult;
        duplicateCheck: ValidationResult;
        timestamp: Date;
    };
    citizenMessage: {
        title: string;
        titleHi: string;
        message: string;
        messageHi: string;
    };
}

export interface ValidationResult {
    passed: boolean;
    details: string[];
    issues: string[];
}

export interface GuaranteeCheckRequest {
    requestType: RequestType;
    serviceType: ServiceType;
    userId: string;
    kioskId?: string;
    data: Record<string, any>;  // Request-specific data
}

export interface SIGMAcknowledgment {
    sigmLogId: string;
    acknowledged: boolean;
}

export interface RequestLockCheck {
    isLocked: boolean;
    lockKey?: string;
    existingRequestId?: string;
    message?: string;
    messageHi?: string;
}

// Configuration for different request types
export interface SIGMConfig {
    requestType: RequestType;
    requiredDocuments: string[];
    serviceAreaCheck: boolean;
    technicianRequired: boolean;
    duplicateCheckWindow: number;  // Hours
    lockDuration: number;  // Hours
}

export const SIGM_CONFIGS: Record<RequestType, SIGMConfig> = {
    BILL_PAYMENT: {
        requestType: 'BILL_PAYMENT',
        requiredDocuments: [],
        serviceAreaCheck: false,
        technicianRequired: false,
        duplicateCheckWindow: 24,
        lockDuration: 24,
    },
    NEW_CONNECTION: {
        requestType: 'NEW_CONNECTION',
        requiredDocuments: ['ID_PROOF', 'ADDRESS_PROOF'],
        serviceAreaCheck: true,
        technicianRequired: true,
        duplicateCheckWindow: 720,  // 30 days
        lockDuration: 720,
    },
    COMPLAINT_REGISTRATION: {
        requestType: 'COMPLAINT_REGISTRATION',
        requiredDocuments: [],
        serviceAreaCheck: true,
        technicianRequired: false,
        duplicateCheckWindow: 168,  // 7 days
        lockDuration: 168,
    },
    DOCUMENT_REQUEST: {
        requestType: 'DOCUMENT_REQUEST',
        requiredDocuments: ['ID_PROOF'],
        serviceAreaCheck: false,
        technicianRequired: false,
        duplicateCheckWindow: 72,  // 3 days
        lockDuration: 72,
    },
    METER_READING: {
        requestType: 'METER_READING',
        requiredDocuments: [],
        serviceAreaCheck: false,
        technicianRequired: false,
        duplicateCheckWindow: 720,  // 30 days (monthly)
        lockDuration: 720,
    },
};
