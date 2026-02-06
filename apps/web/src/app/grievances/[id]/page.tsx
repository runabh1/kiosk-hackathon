"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Calendar,
    MessageSquare,
    User,
    Zap,
    Flame,
    Droplets,
    Building2,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface GrievanceTimeline {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    createdBy: string;
}

interface Grievance {
    id: string;
    ticketNo: string;
    serviceType: string;
    category: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    timeline: GrievanceTimeline[];
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    SUBMITTED: { color: "text-blue-700", bg: "bg-blue-100", icon: FileText },
    IN_PROGRESS: { color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
    PENDING_INFO: { color: "text-orange-700", bg: "bg-orange-100", icon: AlertCircle },
    RESOLVED: { color: "text-success", bg: "bg-success/10", icon: CheckCircle },
    CLOSED: { color: "text-slate-600", bg: "bg-slate-100", icon: CheckCircle },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
    LOW: { color: "text-slate-600", bg: "bg-slate-100" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100" },
    HIGH: { color: "text-orange-700", bg: "bg-orange-100" },
    URGENT: { color: "text-destructive", bg: "bg-destructive/10" },
};

export default function GrievanceDetailsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const grievanceId = params.id as string;
    const isHindi = i18n.language === "hi";

    const { isAuthenticated } = useAuthStore();

    const [grievance, setGrievance] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchGrievance();
    }, [isAuthenticated, grievanceId, router]);

    const fetchGrievance = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/grievances/${grievanceId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setGrievance(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch grievance:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cta" />
            </div>
        );
    }

    if (!grievance) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-primary text-white py-4 px-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="font-heading text-xl font-bold">Grievance Details</h1>
                    </div>
                </header>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Grievance not found</p>
                </div>
            </div>
        );
    }

    const svc = serviceIcons[grievance.serviceType] || serviceIcons.MUNICIPAL;
    const Icon = svc.icon;
    const status = statusConfig[grievance.status] || statusConfig.SUBMITTED;
    const StatusIcon = status.icon;
    const priority = priorityConfig[grievance.priority] || priorityConfig.MEDIUM;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-primary text-white py-4 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "शिकायत विवरण" : "Grievance Details"}
                        </h1>
                        <p className="text-white/70 text-sm font-mono">{grievance.ticketNo}</p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Status Card */}
                <div className="kiosk-card mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${status.bg} rounded-xl flex items-center justify-center`}>
                            <StatusIcon className={`w-7 h-7 ${status.color}`} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                {isHindi ? "वर्तमान स्थिति" : "Current Status"}
                            </p>
                            <p className={`text-xl font-bold ${status.color}`}>
                                {grievance.status.replace("_", " ")}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.bg} ${priority.color}`}>
                            {grievance.priority}
                        </span>
                    </div>
                </div>

                {/* Grievance Info */}
                <div className="kiosk-card mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 ${svc.bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${svc.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{grievance.serviceType}</p>
                            <p className="font-medium">{grievance.category}</p>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-primary mb-2">{grievance.subject}</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{grievance.description}</p>

                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{isHindi ? "दर्ज किया गया" : "Filed"}: {new Date(grievance.createdAt).toLocaleDateString()}</span>
                        </div>
                        {grievance.resolvedAt && (
                            <div className="flex items-center gap-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span>{isHindi ? "हल किया गया" : "Resolved"}: {new Date(grievance.resolvedAt).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="kiosk-card">
                    <h3 className="font-medium text-primary mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {isHindi ? "समयरेखा" : "Timeline"}
                    </h3>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                        <div className="space-y-6">
                            {grievance.timeline.map((item, idx) => (
                                <div key={item.id} className="relative flex gap-4">
                                    {/* Timeline dot */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${idx === 0 ? "bg-cta text-white" : "bg-white border-2 border-slate-200"
                                        }`}>
                                        {idx === 0 ? (
                                            <MessageSquare className="w-4 h-4" />
                                        ) : (
                                            <div className="w-2 h-2 bg-slate-400 rounded-full" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 pb-6 ${idx === grievance.timeline.length - 1 ? "pb-0" : ""}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-primary">{item.action}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.createdAt).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {item.createdBy}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {grievance.status !== "RESOLVED" && grievance.status !== "CLOSED" && (
                    <div className="mt-6 flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => router.push("/grievances")}>
                            {isHindi ? "सभी शिकायतें" : "All Grievances"}
                        </Button>
                        <Button variant="cta" className="flex-1">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {isHindi ? "अनुवर्ती संदेश" : "Send Follow-up"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
