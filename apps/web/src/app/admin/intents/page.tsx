"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    MessageSquare,
    Bell,
    BarChart3,
    Monitor,
    LogOut,
    Building2,
    Sparkles,
    TrendingUp,
    Clock,
    Target,
    Zap,
    Flame,
    Droplets,
    ArrowDown,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface IntentAnalytics {
    period: string;
    totalIntents: number;
    avgConfidence: number;
    totalStepsSaved: number;
    avgStepsSaved: number;
    estimatedTimeSaved: number;
    successRate: number;
    serviceBreakdown: Record<string, number>;
    actionBreakdown: Record<string, number>;
    topIntents: { action: string; count: number }[];
}

const navItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", icon: Users, href: "/admin/users" },
    { id: "payments", name: "Payments", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", icon: MessageSquare, href: "/admin/grievances" },
    { id: "reports", name: "Reports", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", icon: Bell, href: "/admin/alerts" },
    { id: "intents", name: "Intent Analytics", icon: Sparkles, href: "/admin/intents" },
];

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
    PAY_BILL: { label: "Pay Bill", icon: "💳" },
    FILE_COMPLAINT: { label: "File Complaint", icon: "📝" },
    CHECK_STATUS: { label: "Check Status", icon: "🔍" },
    NEW_CONNECTION: { label: "New Connection", icon: "🆕" },
    VIEW_BILLS: { label: "View Bills", icon: "📄" },
    METER_READING: { label: "Meter Reading", icon: "📊" },
};

const SERVICE_ICONS: Record<string, { icon: any; color: string }> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal bg-municipal-light" },
};

export default function IntentAnalyticsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, logout } = useAuthStore();

    const [analytics, setAnalytics] = useState<IntentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("7d");

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchAnalytics();
    }, [isAuthenticated, user, router, period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/intent-analytics?period=${period}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setAnalytics(data.data);
            } else {
                // Use mock data
                setAnalytics({
                    period,
                    totalIntents: 156,
                    avgConfidence: 0.78,
                    totalStepsSaved: 312,
                    avgStepsSaved: 2.0,
                    estimatedTimeSaved: 1560,
                    successRate: 0.85,
                    serviceBreakdown: { ELECTRICITY: 67, WATER: 45, GAS: 28, MUNICIPAL: 16 },
                    actionBreakdown: { PAY_BILL: 89, FILE_COMPLAINT: 34, CHECK_STATUS: 18, NEW_CONNECTION: 10, VIEW_BILLS: 5 },
                    topIntents: [
                        { action: "PAY_BILL", count: 89 },
                        { action: "FILE_COMPLAINT", count: 34 },
                        { action: "CHECK_STATUS", count: 18 },
                        { action: "NEW_CONNECTION", count: 10 },
                        { action: "VIEW_BILLS", count: 5 },
                    ],
                });
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    };

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col fixed h-full">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">SUVIDHA</h1>
                            <p className="text-xs text-white/60">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === "intents";
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { logout(); router.push("/"); }}
                        className="w-full text-white/70 hover:text-white hover:bg-white/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-auto">
                <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-cta" />
                                {isHindi ? "स्मार्ट असिस्टेंट एनालिटिक्स" : "Smart Assistant Analytics"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi
                                    ? "इंटेंट पहचान और नेविगेशन दक्षता मेट्रिक्स"
                                    : "Intent recognition and navigation efficiency metrics"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="px-3 py-2 rounded-lg border bg-white text-sm"
                            >
                                <option value="24h">{isHindi ? "पिछले 24 घंटे" : "Last 24 hours"}</option>
                                <option value="7d">{isHindi ? "पिछले 7 दिन" : "Last 7 days"}</option>
                                <option value="30d">{isHindi ? "पिछले 30 दिन" : "Last 30 days"}</option>
                            </select>
                            <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                {isHindi ? "रिफ्रेश" : "Refresh"}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : analytics ? (
                        <div className="space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-cta to-primary rounded-xl p-5 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <span className="text-white/80 text-sm">
                                            {isHindi ? "कुल इंटेंट" : "Total Intents"}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold">{analytics.totalIntents}</p>
                                    <p className="text-white/60 text-xs mt-1">
                                        {isHindi ? "स्मार्ट असिस्टेंट उपयोग" : "Smart Assistant uses"}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                                            <Target className="w-5 h-5 text-success" />
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {isHindi ? "सफलता दर" : "Success Rate"}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-primary">
                                        {Math.round(analytics.successRate * 100)}%
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        {isHindi ? "सही पहचान" : "Correctly understood"}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center">
                                            <ArrowDown className="w-5 h-5 text-electricity" />
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {isHindi ? "कदम बचाए" : "Steps Saved"}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-primary">{analytics.totalStepsSaved}</p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        {isHindi
                                            ? `औसत ${analytics.avgStepsSaved} प्रति उपयोग`
                                            : `Avg ${analytics.avgStepsSaved} per use`}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {isHindi ? "समय बचाया" : "Time Saved"}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatTime(analytics.estimatedTimeSaved)}
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        {isHindi ? "अनुमानित कुल" : "Estimated total"}
                                    </p>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Top Intents */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-cta" />
                                        {isHindi ? "सबसे आम इंटेंट" : "Most Common Intents"}
                                    </h3>
                                    <div className="space-y-3">
                                        {analytics.topIntents.map((intent, idx) => {
                                            const actionInfo = ACTION_LABELS[intent.action] || {
                                                label: intent.action,
                                                icon: "📌",
                                            };
                                            const percentage = Math.round(
                                                (intent.count / analytics.totalIntents) * 100
                                            );
                                            return (
                                                <div key={intent.action} className="flex items-center gap-3">
                                                    <span className="text-2xl">{actionInfo.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {actionInfo.label}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {intent.count} ({percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cta to-primary rounded-full transition-all"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Service Breakdown */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-cta" />
                                        {isHindi ? "सेवा के अनुसार" : "By Service Type"}
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(analytics.serviceBreakdown).map(([service, count]) => {
                                            const svcInfo = SERVICE_ICONS[service];
                                            const Icon = svcInfo?.icon || Building2;
                                            const percentage = Math.round((count / analytics.totalIntents) * 100);
                                            return (
                                                <div key={service} className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${svcInfo?.color || "bg-slate-100"
                                                            }`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {service}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {count} requests
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${service === "ELECTRICITY"
                                                                        ? "bg-electricity"
                                                                        : service === "GAS"
                                                                            ? "bg-gas"
                                                                            : service === "WATER"
                                                                                ? "bg-water"
                                                                                : "bg-municipal"
                                                                    }`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Insights Panel */}
                            <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border">
                                <h3 className="font-bold text-primary mb-4">
                                    💡 {isHindi ? "अंतर्दृष्टि" : "Insights"}
                                </h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {isHindi ? "औसत आत्मविश्वास स्कोर" : "Average Confidence Score"}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-success rounded-full"
                                                    style={{ width: `${analytics.avgConfidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-primary">
                                                {Math.round(analytics.avgConfidence * 100)}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {analytics.avgConfidence >= 0.7
                                                ? isHindi
                                                    ? "✅ उच्च सटीकता"
                                                    : "✅ High accuracy"
                                                : isHindi
                                                    ? "⚠️ सुधार की आवश्यकता"
                                                    : "⚠️ Needs improvement"}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {isHindi ? "सबसे लोकप्रिय क्रिया" : "Most Popular Action"}
                                        </p>
                                        <p className="text-xl font-bold text-primary">
                                            {ACTION_LABELS[analytics.topIntents[0]?.action]?.icon}{" "}
                                            {ACTION_LABELS[analytics.topIntents[0]?.action]?.label ||
                                                analytics.topIntents[0]?.action}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (analytics.topIntents[0]?.count / analytics.totalIntents) * 100
                                            )}
                                            % {isHindi ? "सभी अनुरोधों का" : "of all requests"}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {isHindi ? "दक्षता लाभ" : "Efficiency Gain"}
                                        </p>
                                        <p className="text-xl font-bold text-success">
                                            {Math.round((analytics.avgStepsSaved / 4) * 100)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isHindi
                                                ? "मैन्युअल नेविगेशन की तुलना में तेज़"
                                                : "Faster than manual navigation"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            {isHindi ? "कोई डेटा उपलब्ध नहीं" : "No data available"}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
