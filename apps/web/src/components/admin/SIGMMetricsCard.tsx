"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import {
    Shield,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Clock,
    Users,
    Loader2,
    ChevronRight,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SIGMAnalytics {
    period: string;
    summary: {
        totalChecks: number;
        guaranteedCount: number;
        notGuaranteedCount: number;
        blockedCount: number;
        submittedAfterCheck: number;
        guaranteedPercentage: number;
        repeatVisitsAvoided: number;
        pendingBackendActions: number;
    };
    serviceBreakdown: Record<string, number>;
    requestTypeBreakdown: Record<string, { total: number; guaranteed: number; rate: number }>;
    lowestGuaranteeServices: Array<{
        service: string;
        total: number;
        guaranteed: number;
        rate: number;
    }>;
}

interface SIGMMetricsCardProps {
    period?: "24h" | "7d" | "30d";
    className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function SIGMMetricsCard({ period = "7d", className = "" }: SIGMMetricsCardProps) {
    const { tokens } = useAuthStore();
    const [analytics, setAnalytics] = useState<SIGMAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [selectedPeriod]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/sigm/analytics?period=${selectedPeriod}`, {
                headers: { Authorization: `Bearer ${tokens?.accessToken}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAnalytics(data.data);
            } else {
                setError("Failed to load SIGM analytics");
            }
        } catch (err) {
            setError("Failed to load SIGM analytics");
        } finally {
            setLoading(false);
        }
    };

    const getServiceLabel = (service: string) => {
        const labels: Record<string, string> = {
            BILL_PAYMENT: "Bill Payment",
            NEW_CONNECTION: "New Connection",
            COMPLAINT_REGISTRATION: "Complaints",
            DOCUMENT_REQUEST: "Documents",
            METER_READING: "Meter Reading",
        };
        return labels[service] || service;
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-kiosk p-6 ${className}`}>
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className={`bg-white rounded-xl shadow-kiosk p-6 ${className}`}>
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mb-2" />
                    <p>{error || "No data available"}</p>
                    <Button variant="outline" size="sm" onClick={fetchAnalytics} className="mt-2">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-kiosk overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Single-Interaction Metrics</h3>
                            <p className="text-white/80 text-sm">SIGM Performance Dashboard</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {(["24h", "7d", "30d"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setSelectedPeriod(p)}
                                className={`px-3 py-1 rounded-md text-sm transition-colors cursor-pointer ${selectedPeriod === p
                                        ? "bg-white text-indigo-600"
                                        : "bg-white/20 hover:bg-white/30"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Guaranteed Rate */}
                    <div className="bg-emerald-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-emerald-700 font-medium">Guaranteed</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">
                            {analytics.summary.guaranteedPercentage}%
                        </p>
                        <p className="text-xs text-emerald-600">
                            {analytics.summary.guaranteedCount} of {analytics.summary.totalChecks}
                        </p>
                    </div>

                    {/* Repeat Visits Avoided */}
                    <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-blue-700 font-medium">Repeat Visits Avoided</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                            {analytics.summary.repeatVisitsAvoided}
                        </p>
                        <p className="text-xs text-blue-600">
                            Citizens saved time
                        </p>
                    </div>

                    {/* Pending Actions */}
                    <div className="bg-amber-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-amber-700 font-medium">Pending Actions</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-600">
                            {analytics.summary.pendingBackendActions}
                        </p>
                        <p className="text-xs text-amber-600">
                            Backend queue
                        </p>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Check Outcomes</h4>
                    <div className="flex gap-2">
                        <div
                            className="h-4 rounded-l-full bg-emerald-500"
                            style={{
                                width: `${(analytics.summary.guaranteedCount / analytics.summary.totalChecks) * 100}%`,
                                minWidth: analytics.summary.guaranteedCount > 0 ? '20px' : '0'
                            }}
                        />
                        <div
                            className="h-4 bg-amber-500"
                            style={{
                                width: `${(analytics.summary.notGuaranteedCount / analytics.summary.totalChecks) * 100}%`,
                                minWidth: analytics.summary.notGuaranteedCount > 0 ? '20px' : '0'
                            }}
                        />
                        <div
                            className="h-4 rounded-r-full bg-red-500"
                            style={{
                                width: `${(analytics.summary.blockedCount / analytics.summary.totalChecks) * 100}%`,
                                minWidth: analytics.summary.blockedCount > 0 ? '20px' : '0'
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Guaranteed ({analytics.summary.guaranteedCount})
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Not Guaranteed ({analytics.summary.notGuaranteedCount})
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Blocked ({analytics.summary.blockedCount})
                        </span>
                    </div>
                </div>

                {/* Low Guarantee Services */}
                {analytics.lowestGuaranteeServices.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Services with Lowest Guarantee Rates
                        </h4>
                        <div className="space-y-2">
                            {analytics.lowestGuaranteeServices.slice(0, 3).map((service, idx) => (
                                <div
                                    key={service.service}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            {getServiceLabel(service.service)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            ({service.total} checks)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${service.rate >= 80
                                                        ? "bg-emerald-500"
                                                        : service.rate >= 50
                                                            ? "bg-amber-500"
                                                            : "bg-red-500"
                                                    }`}
                                                style={{ width: `${service.rate}%` }}
                                            />
                                        </div>
                                        <span
                                            className={`text-sm font-medium ${service.rate >= 80
                                                    ? "text-emerald-600"
                                                    : service.rate >= 50
                                                        ? "text-amber-600"
                                                        : "text-red-600"
                                                }`}
                                        >
                                            {service.rate}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </p>
                <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default SIGMMetricsCard;
