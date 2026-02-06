"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Shield,
    Clock,
    FileCheck,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Types matching the backend
interface BlockingReason {
    code: string;
    message: string;
    messageHi: string;
    category: "DOCUMENT" | "SERVICE" | "BACKEND" | "DUPLICATE" | "OTHER";
    severity: "WARNING" | "ERROR";
    resolutionHint?: string;
    resolutionHintHi?: string;
}

interface BackendAction {
    actionType: string;
    description: string;
    descriptionHi: string;
    priority: number;
    estimatedCompletion?: string;
    estimatedCompletionHi?: string;
}

interface GuaranteeCheckResult {
    sigmLogId: string;
    guaranteeStatus: "GUARANTEED" | "NOT_GUARANTEED" | "BLOCKED";
    requestType: string;
    serviceType: string;
    blockingReasons: BlockingReason[];
    backendActions: BackendAction[];
    citizenMessage: {
        title: string;
        titleHi: string;
        message: string;
        messageHi: string;
    };
}

interface GuaranteeCheckModalProps {
    isOpen: boolean;
    checkResult: GuaranteeCheckResult | null;
    isLoading: boolean;
    onAcknowledge: (sigmLogId: string) => Promise<void>;
    onCancel: () => void;
    onProceed: () => void;
    language?: "en" | "hi";
}

export function GuaranteeCheckModal({
    isOpen,
    checkResult,
    isLoading,
    onAcknowledge,
    onCancel,
    onProceed,
    language = "en",
}: GuaranteeCheckModalProps) {
    const { t, i18n } = useTranslation();
    const isHindi = language === "hi" || i18n.language === "hi";

    const [acknowledged, setAcknowledged] = useState(false);
    const [acknowledging, setAcknowledging] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    if (!isOpen) return null;

    const handleAcknowledge = async () => {
        if (!checkResult) return;
        setAcknowledging(true);
        try {
            await onAcknowledge(checkResult.sigmLogId);
            setAcknowledged(true);
        } finally {
            setAcknowledging(false);
        }
    };

    const handleProceed = () => {
        if (acknowledged || checkResult?.guaranteeStatus === "GUARANTEED") {
            onProceed();
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "GUARANTEED":
                return {
                    icon: CheckCircle2,
                    bgColor: "bg-emerald-50",
                    borderColor: "border-emerald-200",
                    iconColor: "text-emerald-500",
                    headerBg: "bg-gradient-to-r from-emerald-500 to-green-500",
                    accentColor: "text-emerald-700",
                };
            case "NOT_GUARANTEED":
                return {
                    icon: AlertTriangle,
                    bgColor: "bg-amber-50",
                    borderColor: "border-amber-200",
                    iconColor: "text-amber-500",
                    headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
                    accentColor: "text-amber-700",
                };
            case "BLOCKED":
                return {
                    icon: XCircle,
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                    iconColor: "text-red-500",
                    headerBg: "bg-gradient-to-r from-red-500 to-rose-500",
                    accentColor: "text-red-700",
                };
            default:
                return {
                    icon: Shield,
                    bgColor: "bg-slate-50",
                    borderColor: "border-slate-200",
                    iconColor: "text-slate-500",
                    headerBg: "bg-gradient-to-r from-slate-500 to-gray-500",
                    accentColor: "text-slate-700",
                };
        }
    };

    const renderLoading = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-primary mb-2">
                    {isHindi ? "जांच हो रही है..." : "Checking Guarantee..."}
                </h2>
                <p className="text-muted-foreground">
                    {isHindi
                        ? "कृपया प्रतीक्षा करें जब हम आपके अनुरोध की जांच करते हैं"
                        : "Please wait while we verify your request"}
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        <span>{isHindi ? "दस्तावेज" : "Documents"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>{isHindi ? "सेवा" : "Service"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{isHindi ? "उपलब्धता" : "Availability"}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading || !checkResult) {
        return renderLoading();
    }

    const config = getStatusConfig(checkResult.guaranteeStatus);
    const StatusIcon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div
                className={`bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="guarantee-modal-title"
            >
                {/* Header */}
                <div className={`${config.headerBg} text-white p-6`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <StatusIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 id="guarantee-modal-title" className="text-lg font-bold">
                                {isHindi
                                    ? checkResult.citizenMessage.titleHi
                                    : checkResult.citizenMessage.title}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Main Message */}
                    <p className={`text-base ${config.accentColor} mb-4`}>
                        {isHindi
                            ? checkResult.citizenMessage.messageHi
                            : checkResult.citizenMessage.message}
                    </p>

                    {/* Blocking Reasons (for NOT_GUARANTEED or BLOCKED) */}
                    {checkResult.blockingReasons.length > 0 && (
                        <div className={`rounded-xl ${config.bgColor} border ${config.borderColor} p-4 mb-4`}>
                            <h3 className="font-medium text-sm text-slate-700 mb-3">
                                {isHindi ? "विवरण:" : "Details:"}
                            </h3>
                            <ul className="space-y-2">
                                {checkResult.blockingReasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        {reason.severity === "ERROR" ? (
                                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="text-slate-700">
                                                {isHindi ? reason.messageHi : reason.message}
                                            </p>
                                            {reason.resolutionHint && (
                                                <p className="text-slate-500 text-xs mt-1">
                                                    💡 {isHindi ? reason.resolutionHintHi : reason.resolutionHint}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Backend Actions (for NOT_GUARANTEED) */}
                    {checkResult.guaranteeStatus === "NOT_GUARANTEED" &&
                        checkResult.backendActions.length > 0 && (
                            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
                                <h3 className="font-medium text-sm text-blue-900 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {isHindi ? "अगले कदम (स्वचालित):" : "Next Steps (Automatic):"}
                                </h3>
                                <ul className="space-y-2">
                                    {checkResult.backendActions.map((action, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-blue-800">
                                                    {isHindi ? action.descriptionHi : action.description}
                                                </p>
                                                {action.estimatedCompletion && (
                                                    <p className="text-blue-600 text-xs mt-1">
                                                        ⏱️ {isHindi ? action.estimatedCompletionHi : action.estimatedCompletion}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-blue-700 mt-3 font-medium">
                                    {isHindi
                                        ? "✓ आपको दोबारा आवेदन करने या दोबारा आने की जरूरत नहीं होगी"
                                        : "✓ You will NOT need to restart or resubmit this request"}
                                </p>
                            </div>
                        )}

                    {/* Technical Details (expandable) */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isHindi ? "तकनीकी विवरण" : "Technical Details"}
                    </button>

                    {showDetails && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600">
                            <p>Check ID: {checkResult.sigmLogId}</p>
                            <p>Request Type: {checkResult.requestType}</p>
                            <p>Service: {checkResult.serviceType}</p>
                            <p>Status: {checkResult.guaranteeStatus}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-slate-50">
                    {checkResult.guaranteeStatus === "BLOCKED" ? (
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            onClick={onCancel}
                        >
                            {isHindi ? "वापस जाएं" : "Go Back"}
                        </Button>
                    ) : checkResult.guaranteeStatus === "GUARANTEED" ? (
                        <div className="space-y-3">
                            <Button
                                variant="cta"
                                size="lg"
                                className="w-full"
                                onClick={handleProceed}
                            >
                                {isHindi ? "आगे बढ़ें और सबमिट करें" : "Proceed & Submit"}
                            </Button>
                            <button
                                onClick={onCancel}
                                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                {isHindi ? "रद्द करें" : "Cancel"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Acknowledgment checkbox for NOT_GUARANTEED */}
                            {!acknowledged && (
                                <label className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={acknowledged}
                                        onChange={handleAcknowledge}
                                        disabled={acknowledging}
                                        className="mt-0.5 w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-amber-800">
                                        {isHindi
                                            ? "मैं समझता/समझती हूं कि इस अनुरोध के लिए अतिरिक्त बैकएंड कार्रवाई की आवश्यकता है, लेकिन मुझे दोबारा आवेदन नहीं करना होगा।"
                                            : "I understand this request requires additional backend action, but I will NOT need to resubmit."}
                                    </span>
                                    {acknowledging && (
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                    )}
                                </label>
                            )}

                            <Button
                                variant="cta"
                                size="lg"
                                className="w-full"
                                onClick={handleProceed}
                                disabled={!acknowledged}
                            >
                                {isHindi
                                    ? acknowledged
                                        ? "आगे बढ़ें और सबमिट करें"
                                        : "पहले स्वीकार करें"
                                    : acknowledged
                                        ? "Proceed & Submit"
                                        : "Acknowledge First"}
                            </Button>
                            <button
                                onClick={onCancel}
                                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                {isHindi ? "रद्द करें" : "Cancel"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GuaranteeCheckModal;
