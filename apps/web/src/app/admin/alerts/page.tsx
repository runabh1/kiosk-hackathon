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
    Zap,
    Plus,
    Trash2,
    AlertTriangle,
    Info,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";

interface Alert {
    id: string;
    title: string;
    titleHi: string;
    message: string;
    messageHi: string;
    severity: string;
    serviceType: string | null;
    isActive: boolean;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
    critical: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    success: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
};

const navItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", icon: Users, href: "/admin/users" },
    { id: "payments", name: "Payments", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", icon: MessageSquare, href: "/admin/grievances" },
    { id: "reports", name: "Reports", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", icon: Bell, href: "/admin/alerts" },
];

export default function AdminAlertsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, logout } = useAuthStore();

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        titleHi: "",
        message: "",
        messageHi: "",
        severity: "info",
        serviceType: "",
    });

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchAlerts();
    }, [isAuthenticated, user, router]);

    const fetchAlerts = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notifications/alerts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setAlerts(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/alerts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        serviceType: formData.serviceType || undefined,
                    }),
                }
            );

            if (res.ok) {
                setFormData({ title: "", titleHi: "", message: "", messageHi: "", severity: "info", serviceType: "" });
                setShowForm(false);
                fetchAlerts();
            }
        } catch (err) {
            console.error("Failed to create alert:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeactivate = async (alertId: string) => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/alerts/${alertId}/deactivate`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchAlerts();
        } catch (err) {
            console.error("Failed to deactivate alert:", err);
        }
    };

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col">
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
                        const isActive = item.id === "alerts";
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? "bg-white/20 text-white"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
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
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "सिस्टम अलर्ट" : "System Alerts"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "अलर्ट प्रबंधित करें" : "Manage system-wide alerts & notifications"}
                            </p>
                        </div>
                        <Button variant="cta" onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {isHindi ? "नया अलर्ट" : "Create Alert"}
                        </Button>
                    </div>
                </header>

                <div className="p-6">
                    {/* Create Form */}
                    {showForm && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                            <h3 className="font-bold text-primary mb-4">
                                {isHindi ? "नया अलर्ट बनाएं" : "Create New Alert"}
                            </h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Title (English)</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Title (Hindi)</Label>
                                        <Input
                                            value={formData.titleHi}
                                            onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                                            placeholder="हिंदी शीर्षक"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Message (English)</Label>
                                        <Input
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Message (Hindi)</Label>
                                        <Input
                                            value={formData.messageHi}
                                            onChange={(e) => setFormData({ ...formData, messageHi: e.target.value })}
                                            placeholder="हिंदी संदेश"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Severity</Label>
                                        <select
                                            value={formData.severity}
                                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="critical">Critical</option>
                                            <option value="success">Success</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Service Type (Optional)</Label>
                                        <select
                                            value={formData.serviceType}
                                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="">All Services</option>
                                            <option value="ELECTRICITY">Electricity</option>
                                            <option value="GAS">Gas</option>
                                            <option value="WATER">Water</option>
                                            <option value="MUNICIPAL">Municipal</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" variant="cta" disabled={formLoading}>
                                        {formLoading ? "Creating..." : "Create Alert"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Alerts List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : alerts.length > 0 ? (
                        <div className="space-y-3">
                            {alerts.map((alert) => {
                                const sev = severityConfig[alert.severity] || severityConfig.info;
                                const SevIcon = sev.icon;
                                return (
                                    <div key={alert.id} className="bg-white rounded-xl p-4 shadow-sm border">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 ${sev.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <SevIcon className={`w-5 h-5 ${sev.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-primary">{alert.title}</p>
                                                    {alert.serviceType && (
                                                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">
                                                            {alert.serviceType}
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${alert.isActive ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                        {alert.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Created: {new Date(alert.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {alert.isActive && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeactivate(alert.id)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-muted-foreground">No alerts found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
