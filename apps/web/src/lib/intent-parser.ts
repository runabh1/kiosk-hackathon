/**
 * Smart Assistant Intent Parser
 * Local NLP without external API dependencies
 * Uses keyword matching and fuzzy scoring
 */

export type ServiceType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL' | null;
export type ActionType = 'PAY_BILL' | 'FILE_COMPLAINT' | 'CHECK_STATUS' | 'NEW_CONNECTION' | 'METER_READING' | 'VIEW_BILLS' | null;

export interface ParsedIntent {
    service: ServiceType;
    action: ActionType;
    confidence: number; // 0-1
    originalInput: string;
    matchedKeywords: string[];
    suggestedRoute: string | null;
    confirmationMessage: {
        en: string;
        hi: string;
    };
}

// Keyword dictionaries for each service
const SERVICE_KEYWORDS: Record<string, ServiceType> = {
    // Electricity
    'electricity': 'ELECTRICITY',
    'electric': 'ELECTRICITY',
    'power': 'ELECTRICITY',
    'bijli': 'ELECTRICITY',
    'बिजली': 'ELECTRICITY',
    'light': 'ELECTRICITY',
    'current': 'ELECTRICITY',
    'apdcl': 'ELECTRICITY',
    'bses': 'ELECTRICITY',
    'discom': 'ELECTRICITY',
    'unit': 'ELECTRICITY',
    'watt': 'ELECTRICITY',
    'voltage': 'ELECTRICITY',

    // Gas
    'gas': 'GAS',
    'cylinder': 'GAS',
    'lpg': 'GAS',
    'cooking': 'GAS',
    'गैस': 'GAS',
    'सिलिंडर': 'GAS',
    'indane': 'GAS',
    'bharat': 'GAS',
    'hp': 'GAS',
    'png': 'GAS',
    'pipeline': 'GAS',

    // Water
    'water': 'WATER',
    'पानी': 'WATER',
    'jal': 'WATER',
    'जल': 'WATER',
    'supply': 'WATER',
    'tank': 'WATER',
    'tap': 'WATER',
    'pipe': 'WATER',
    'sewage': 'WATER',
    'drainage': 'WATER',

    // Municipal
    'municipal': 'MUNICIPAL',
    'nagar': 'MUNICIPAL',
    'nigam': 'MUNICIPAL',
    'नगर': 'MUNICIPAL',
    'tax': 'MUNICIPAL',
    'property': 'MUNICIPAL',
    'garbage': 'MUNICIPAL',
    'waste': 'MUNICIPAL',
    'कचरा': 'MUNICIPAL',
    'streetlight': 'MUNICIPAL',
    'road': 'MUNICIPAL',
    'certificate': 'MUNICIPAL',
    'birth': 'MUNICIPAL',
    'death': 'MUNICIPAL',
};

// Keyword dictionaries for each action
const ACTION_KEYWORDS: Record<string, ActionType> = {
    // Pay Bill
    'pay': 'PAY_BILL',
    'payment': 'PAY_BILL',
    'भुगतान': 'PAY_BILL',
    'bill': 'PAY_BILL',
    'बिल': 'PAY_BILL',
    'dues': 'PAY_BILL',
    'बकाया': 'PAY_BILL',
    'clear': 'PAY_BILL',
    'settle': 'PAY_BILL',
    'amount': 'PAY_BILL',

    // Complaint
    'complaint': 'FILE_COMPLAINT',
    'complain': 'FILE_COMPLAINT',
    'शिकायत': 'FILE_COMPLAINT',
    'grievance': 'FILE_COMPLAINT',
    'issue': 'FILE_COMPLAINT',
    'problem': 'FILE_COMPLAINT',
    'समस्या': 'FILE_COMPLAINT',
    'report': 'FILE_COMPLAINT',
    'not working': 'FILE_COMPLAINT',
    'broken': 'FILE_COMPLAINT',
    'fault': 'FILE_COMPLAINT',
    'outage': 'FILE_COMPLAINT',

    // Status Check
    'status': 'CHECK_STATUS',
    'check': 'CHECK_STATUS',
    'track': 'CHECK_STATUS',
    'स्थिति': 'CHECK_STATUS',
    'where': 'CHECK_STATUS',
    'progress': 'CHECK_STATUS',
    'pending': 'CHECK_STATUS',

    // New Connection
    'new': 'NEW_CONNECTION',
    'connection': 'NEW_CONNECTION',
    'apply': 'NEW_CONNECTION',
    'register': 'NEW_CONNECTION',
    'नया': 'NEW_CONNECTION',
    'कनेक्शन': 'NEW_CONNECTION',
    'install': 'NEW_CONNECTION',

    // Meter Reading
    'meter': 'METER_READING',
    'reading': 'METER_READING',
    'मीटर': 'METER_READING',
    'submit': 'METER_READING',
    'enter': 'METER_READING',

    // View Bills
    'view': 'VIEW_BILLS',
    'see': 'VIEW_BILLS',
    'show': 'VIEW_BILLS',
    'देखें': 'VIEW_BILLS',
    'list': 'VIEW_BILLS',
    'history': 'VIEW_BILLS',
};

// Quick phrases for the UI
export const QUICK_PHRASES = [
    { id: 1, en: 'Pay my electricity bill', hi: 'मेरा बिजली बिल भुगतान करें', icon: '⚡' },
    { id: 2, en: 'Pay water bill', hi: 'पानी का बिल भुगतान करें', icon: '💧' },
    { id: 3, en: 'Register a complaint', hi: 'शिकायत दर्ज करें', icon: '📝' },
    { id: 4, en: 'Check complaint status', hi: 'शिकायत की स्थिति जांचें', icon: '🔍' },
    { id: 5, en: 'Apply for new connection', hi: 'नया कनेक्शन के लिए आवेदन', icon: '🆕' },
    { id: 6, en: 'Submit meter reading', hi: 'मीटर रीडिंग जमा करें', icon: '📊' },
    { id: 7, en: 'Pay gas bill', hi: 'गैस बिल भुगतान करें', icon: '🔥' },
    { id: 8, en: 'View my bills', hi: 'मेरे बिल देखें', icon: '📄' },
];

// Route mapping based on service and action
const ROUTE_MAP: Record<string, Record<string, string>> = {
    'PAY_BILL': {
        'ELECTRICITY': '/bills?service=ELECTRICITY',
        'GAS': '/bills?service=GAS',
        'WATER': '/bills?service=WATER',
        'MUNICIPAL': '/bills?service=MUNICIPAL',
        'default': '/bills',
    },
    'FILE_COMPLAINT': {
        'ELECTRICITY': '/grievances/new?service=ELECTRICITY',
        'GAS': '/grievances/new?service=GAS',
        'WATER': '/grievances/new?service=WATER',
        'MUNICIPAL': '/grievances/new?service=MUNICIPAL',
        'default': '/grievances/new',
    },
    'CHECK_STATUS': {
        'default': '/grievances',
    },
    'NEW_CONNECTION': {
        'ELECTRICITY': '/connections/new?service=ELECTRICITY',
        'GAS': '/connections/new?service=GAS',
        'WATER': '/connections/new?service=WATER',
        'default': '/connections/new',
    },
    'METER_READING': {
        'default': '/dashboard',
    },
    'VIEW_BILLS': {
        'default': '/bills',
    },
};

// Service names for confirmation messages
const SERVICE_NAMES = {
    'ELECTRICITY': { en: 'electricity', hi: 'बिजली' },
    'GAS': { en: 'gas', hi: 'गैस' },
    'WATER': { en: 'water', hi: 'पानी' },
    'MUNICIPAL': { en: 'municipal services', hi: 'नगरपालिका सेवाएं' },
};

// Action names for confirmation messages
const ACTION_NAMES = {
    'PAY_BILL': { en: 'pay your bill', hi: 'बिल भुगतान करना' },
    'FILE_COMPLAINT': { en: 'file a complaint', hi: 'शिकायत दर्ज करना' },
    'CHECK_STATUS': { en: 'check status', hi: 'स्थिति जांचना' },
    'NEW_CONNECTION': { en: 'apply for new connection', hi: 'नया कनेक्शन के लिए आवेदन करना' },
    'METER_READING': { en: 'submit meter reading', hi: 'मीटर रीडिंग जमा करना' },
    'VIEW_BILLS': { en: 'view your bills', hi: 'अपने बिल देखना' },
};

/**
 * Tokenize input text for matching
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Keep alphanumeric and Hindi chars
        .split(/\s+/)
        .filter(token => token.length > 1);
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    // Check if shorter is substring
    if (longer.includes(shorter)) return 0.9;

    // Check prefix match
    if (longer.startsWith(shorter) || shorter.startsWith(longer)) return 0.8;

    return 0;
}

/**
 * Parse user input and determine intent
 */
export function parseIntent(input: string): ParsedIntent {
    const tokens = tokenize(input);
    const matchedKeywords: string[] = [];

    // Score each service
    const serviceScores: Record<string, number> = {};
    let detectedService: ServiceType = null;
    let maxServiceScore = 0;

    for (const token of tokens) {
        // Direct match
        if (SERVICE_KEYWORDS[token]) {
            const service = SERVICE_KEYWORDS[token];
            serviceScores[service] = (serviceScores[service] || 0) + 1;
            matchedKeywords.push(token);
        } else {
            // Fuzzy match
            for (const [keyword, service] of Object.entries(SERVICE_KEYWORDS)) {
                const sim = similarity(token, keyword);
                if (sim > 0.7) {
                    serviceScores[service] = (serviceScores[service] || 0) + sim;
                    matchedKeywords.push(token);
                    break;
                }
            }
        }
    }

    // Find best service match
    for (const [service, score] of Object.entries(serviceScores)) {
        if (score > maxServiceScore) {
            maxServiceScore = score;
            detectedService = service as ServiceType;
        }
    }

    // Score each action
    const actionScores: Record<string, number> = {};
    let detectedAction: ActionType = null;
    let maxActionScore = 0;

    for (const token of tokens) {
        if (ACTION_KEYWORDS[token]) {
            const action = ACTION_KEYWORDS[token];
            actionScores[action] = (actionScores[action] || 0) + 1;
            if (!matchedKeywords.includes(token)) {
                matchedKeywords.push(token);
            }
        } else {
            for (const [keyword, action] of Object.entries(ACTION_KEYWORDS)) {
                const sim = similarity(token, keyword);
                if (sim > 0.7) {
                    actionScores[action] = (actionScores[action] || 0) + sim;
                    if (!matchedKeywords.includes(token)) {
                        matchedKeywords.push(token);
                    }
                    break;
                }
            }
        }
    }

    // Check for multi-word phrases
    const inputLower = input.toLowerCase();
    for (const [keyword, action] of Object.entries(ACTION_KEYWORDS)) {
        if (inputLower.includes(keyword)) {
            actionScores[action] = (actionScores[action] || 0) + 1.5;
        }
    }

    // Find best action match
    for (const [action, score] of Object.entries(actionScores)) {
        if (score > maxActionScore) {
            maxActionScore = score;
            detectedAction = action as ActionType;
        }
    }

    // Calculate confidence (0-1)
    const serviceConfidence = maxServiceScore > 0 ? Math.min(maxServiceScore / 2, 1) : 0;
    const actionConfidence = maxActionScore > 0 ? Math.min(maxActionScore / 2, 1) : 0;

    let confidence = 0;
    if (detectedAction && detectedService) {
        confidence = (serviceConfidence * 0.4 + actionConfidence * 0.6);
    } else if (detectedAction) {
        confidence = actionConfidence * 0.7;
    } else if (detectedService) {
        confidence = serviceConfidence * 0.5;
    }

    // Determine route
    let suggestedRoute: string | null = null;
    if (detectedAction) {
        const actionRoutes = ROUTE_MAP[detectedAction];
        if (actionRoutes) {
            suggestedRoute = detectedService && actionRoutes[detectedService]
                ? actionRoutes[detectedService]
                : actionRoutes['default'];
        }
    }

    // Generate confirmation message
    const confirmationMessage = generateConfirmationMessage(detectedService, detectedAction);

    return {
        service: detectedService,
        action: detectedAction,
        confidence: Math.round(confidence * 100) / 100,
        originalInput: input,
        matchedKeywords,
        suggestedRoute,
        confirmationMessage,
    };
}

/**
 * Generate user-friendly confirmation message
 */
function generateConfirmationMessage(
    service: ServiceType,
    action: ActionType
): { en: string; hi: string } {
    if (!action) {
        return {
            en: "I couldn't understand your request. Please try again or select from the menu.",
            hi: "मैं आपके अनुरोध को समझ नहीं पाया। कृपया पुनः प्रयास करें या मेनू से चुनें।",
        };
    }

    const actionName = ACTION_NAMES[action];
    const serviceName = service ? SERVICE_NAMES[service] : null;

    if (serviceName) {
        return {
            en: `We understood you want to ${actionName.en} for ${serviceName.en}`,
            hi: `हमने समझा कि आप ${serviceName.hi} के लिए ${actionName.hi} चाहते हैं`,
        };
    }

    return {
        en: `We understood you want to ${actionName.en}`,
        hi: `हमने समझा कि आप ${actionName.hi} चाहते हैं`,
    };
}

/**
 * Calculate steps saved compared to manual navigation
 */
export function calculateStepsSaved(action: ActionType, service: ServiceType): number {
    // Manual navigation typically requires:
    // Home -> Service Selection -> Action Selection -> Specific Page = 3-4 steps
    // Smart Assistant: Input -> Confirm = 2 steps

    const manualSteps: Record<string, number> = {
        'PAY_BILL': 4,
        'FILE_COMPLAINT': 4,
        'CHECK_STATUS': 3,
        'NEW_CONNECTION': 4,
        'METER_READING': 4,
        'VIEW_BILLS': 3,
    };

    const assistantSteps = 2;
    const manual = action ? (manualSteps[action] || 3) : 3;

    return Math.max(0, manual - assistantSteps);
}
