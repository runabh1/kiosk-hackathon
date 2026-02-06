"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Mic,
    MessageSquare,
    Zap,
    Flame,
    Droplets,
    Building2,
    CheckCircle,
    XCircle,
    ArrowRight,
    Sparkles,
    HelpCircle,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/store/auth";
import {
    parseIntent,
    QUICK_PHRASES,
    calculateStepsSaved,
    type ParsedIntent,
} from "@/lib/intent-parser";

const SERVICE_ICONS = {
    ELECTRICITY: { icon: Zap, color: "text-electricity bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal bg-municipal-light" },
};

export default function SmartAssistantPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated, tokens } = useAuthStore();
    const isHindi = i18n.language === "hi";
    const inputRef = useRef<HTMLInputElement>(null);

    const [input, setInput] = useState("");
    const [intent, setIntent] = useState<ParsedIntent | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Authentication check
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, router]);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Process user input
    const processInput = async (text: string) => {
        if (!text.trim()) return;

        setIsProcessing(true);
        setInput(text);

        // Simulate processing delay for UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        const parsed = parseIntent(text);
        setIntent(parsed);
        setShowResult(true);
        setIsProcessing(false);

        // Log intent for analytics (if authenticated)
        if (isAuthenticated && tokens?.accessToken) {
            try {
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/intent-log`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${tokens.accessToken}`,
                        },
                        body: JSON.stringify({
                            input: text,
                            service: parsed.service,
                            action: parsed.action,
                            confidence: parsed.confidence,
                            route: parsed.suggestedRoute,
                            stepsSaved: calculateStepsSaved(parsed.action, parsed.service),
                        }),
                    }
                );
            } catch (err) {
                // Silent fail for analytics
                console.error("Failed to log intent:", err);
            }
        }
    };

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processInput(input);
    };

    // Handle quick phrase selection
    const handleQuickPhrase = (phrase: string) => {
        processInput(phrase);
    };

    // Confirm and navigate
    const handleConfirm = () => {
        if (intent?.suggestedRoute) {
            // Show success toast
            toast({
                title: isHindi ? "सही दिशा में ले जा रहे हैं" : "Navigating to the right place",
                description: isHindi
                    ? `${calculateStepsSaved(intent.action, intent.service)} कदम बचाए गए!`
                    : `Saved ${calculateStepsSaved(intent.action, intent.service)} navigation steps!`,
            });

            // Navigate after short delay
            setTimeout(() => {
                router.push(intent.suggestedRoute!);
            }, 300);
        }
    };

    // Reset and try again
    const handleReset = () => {
        setInput("");
        setIntent(null);
        setShowResult(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Fallback to manual navigation
    const handleFallback = () => {
        if (isAuthenticated) {
            router.push("/dashboard");
        } else {
            router.push("/");
        }
    };

    // Return null while redirecting
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-cta/5">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary to-cta text-white py-6 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href={isAuthenticated ? "/dashboard" : "/"} className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-6 h-6" />
                                <h1 className="font-heading text-xl font-bold">
                                    {isHindi ? "स्मार्ट सहायक" : "Smart Assistant"}
                                </h1>
                            </div>
                            <p className="text-white/80 text-sm mt-1">
                                {isHindi
                                    ? "बस बताइए आप क्या करना चाहते हैं"
                                    : "Just tell me what you want to do"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6">
                {/* Input Section */}
                {!showResult && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Text Input */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        isHindi
                                            ? "जैसे: मेरा बिजली बिल भुगतान करें..."
                                            : "e.g., Pay my electricity bill..."
                                    }
                                    className="h-16 text-lg pl-14 pr-4 rounded-2xl border-2 border-primary/20 focus:border-cta shadow-lg"
                                    disabled={isProcessing}
                                />
                                <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/40" />
                            </div>

                            <Button
                                type="submit"
                                variant="cta"
                                size="xl"
                                className="w-full"
                                disabled={!input.trim() || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        {isHindi ? "समझ रहे हैं..." : "Understanding..."}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        {isHindi ? "समझें और आगे बढ़ें" : "Understand & Proceed"}
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-gradient-to-b from-primary/5 via-white to-cta/5 px-4 text-sm text-muted-foreground">
                                    {isHindi ? "या एक चुनें" : "or choose one"}
                                </span>
                            </div>
                        </div>

                        {/* Quick Phrases */}
                        <div className="grid grid-cols-2 gap-3">
                            {QUICK_PHRASES.map((phrase) => (
                                <button
                                    key={phrase.id}
                                    onClick={() => handleQuickPhrase(isHindi ? phrase.hi : phrase.en)}
                                    className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-slate-100 hover:border-cta hover:shadow-md transition-all text-left group"
                                >
                                    <span className="text-2xl">{phrase.icon}</span>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-cta">
                                        {isHindi ? phrase.hi : phrase.en}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Help text */}
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-slate-700 mb-1">
                                    {isHindi ? "सहायता" : "Tips"}
                                </p>
                                <ul className="space-y-1">
                                    <li>
                                        {isHindi
                                            ? "• आप हिंदी या अंग्रेजी में लिख सकते हैं"
                                            : "• You can type in Hindi or English"}
                                    </li>
                                    <li>
                                        {isHindi
                                            ? "• जैसे: 'पानी की शिकायत करनी है'"
                                            : "• Example: 'I want to complain about water'"}
                                    </li>
                                    <li>
                                        {isHindi
                                            ? "• सीधे सही पेज पर पहुंचें, मेनू की जरूरत नहीं"
                                            : "• Skip menus, go directly to the right page"}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Result Section */}
                {showResult && intent && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Confidence indicator */}
                        {intent.confidence >= 0.5 ? (
                            <>
                                {/* High confidence - show confirmation */}
                                <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-7 h-7 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-success/70 uppercase tracking-wide font-medium">
                                                {isHindi ? "समझ लिया" : "Understood"}
                                            </p>
                                            <p className="text-lg font-bold text-success">
                                                {Math.round(intent.confidence * 100)}%{" "}
                                                {isHindi ? "विश्वास" : "Confidence"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-lg text-slate-700 font-medium">
                                        {isHindi
                                            ? intent.confirmationMessage.hi
                                            : intent.confirmationMessage.en}
                                    </p>

                                    {/* Service & Action badges */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {intent.service && (
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${SERVICE_ICONS[intent.service]?.color || "bg-slate-100"
                                                    }`}
                                            >
                                                {SERVICE_ICONS[intent.service] &&
                                                    (() => {
                                                        const Icon = SERVICE_ICONS[intent.service].icon;
                                                        return <Icon className="w-4 h-4" />;
                                                    })()}
                                                {intent.service}
                                            </span>
                                        )}
                                        {intent.action && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-cta/10 text-cta">
                                                {intent.action.replace("_", " ")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Steps saved indicator */}
                                    <div className="mt-4 pt-4 border-t border-success/20">
                                        <p className="text-sm text-success/80">
                                            ⚡{" "}
                                            {isHindi
                                                ? `${calculateStepsSaved(intent.action, intent.service)} नेविगेशन स्टेप बचाए`
                                                : `Saving ${calculateStepsSaved(intent.action, intent.service)} navigation steps`}
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        size="xl"
                                        onClick={handleReset}
                                        className="gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        {isHindi ? "बदलें" : "Change"}
                                    </Button>
                                    <Button
                                        variant="cta"
                                        size="xl"
                                        onClick={handleConfirm}
                                        className="gap-2"
                                    >
                                        {isHindi ? "आगे बढ़ें" : "Continue"}
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Low confidence - show fallback */}
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                            <HelpCircle className="w-7 h-7 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600/70 uppercase tracking-wide font-medium">
                                                {isHindi ? "स्पष्ट नहीं" : "Not Clear"}
                                            </p>
                                            <p className="text-lg font-bold text-amber-700">
                                                {isHindi
                                                    ? "मुझे बेहतर समझने में मदद करें"
                                                    : "Help me understand better"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 mb-4">
                                        {isHindi
                                            ? intent.confirmationMessage.hi
                                            : intent.confirmationMessage.en}
                                    </p>

                                    {intent.matchedKeywords.length > 0 && (
                                        <p className="text-sm text-amber-700">
                                            {isHindi ? "पहचाने गए शब्द: " : "Recognized words: "}
                                            <span className="font-medium">
                                                {intent.matchedKeywords.join(", ")}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Fallback options */}
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        size="xl"
                                        onClick={handleReset}
                                        className="w-full gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        {isHindi ? "दोबारा कोशिश करें" : "Try Again"}
                                    </Button>
                                    <Button
                                        variant="cta"
                                        size="xl"
                                        onClick={handleFallback}
                                        className="w-full gap-2"
                                    >
                                        {isHindi ? "मेनू से चुनें" : "Choose from Menu"}
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* What user typed */}
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground mb-1">
                                {isHindi ? "आपने कहा:" : "You said:"}
                            </p>
                            <p className="text-slate-700 font-medium">"{intent.originalInput}"</p>
                        </div>
                    </div>
                )}
            </main>

            {/* CSS for animations */}
            <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
