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
    Flame,
    Droplets,
    Trash2,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Activity,
    Eye,
    ChevronRight,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface DashboardStats {
    totalUsers: number;
    activeConnections: number;
    pendingConnections: number;
    todayPayments: number;
    todayRevenue: number;
    openGrievances: number;
    resolvedToday: number;
    activeKiosks: number;
}

interface RecentActivity {
    id: string;
    type: string;
    description: string;
    user: string;
    kioskId: string;
    timestamp: string;
    serviceType?: string;
}

interface KioskStatus {
    id: string;
    name: string;
    location: string;
    status: string;
    lastActivity: string;
    todayTransactions: number;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
    WASTE: { icon: Trash2, color: "text-amber-600", bg: "bg-amber-100" },
};

const navItems = [
    { id: "dashboard", name: "Dashboard", nameHi: "डैशबोर्ड", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", nameHi: "उपयोगकर्ता", icon: Users, href: "/admin/users" },
    { id: "connections", name: "Connections", nameHi: "कनेक्शन", icon: Zap, href: "/admin/connections" },
    { id: "payments", name: "Payments", nameHi: "भुगतान", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", nameHi: "शिकायतें", icon: MessageSquare, href: "/admin/grievances" },
    { id: "reports", name: "Reports", nameHi: "रिपोर्ट", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", nameHi: "कियोस्क", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", nameHi: "अलर्ट", icon: Bell, href: "/admin/alerts" },
    { id: "intents", name: "Smart Assistant", nameHi: "स्मार्ट असिस्टेंट", icon: Sparkles, href: "/admin/intents" },
];

export default function AdminDashboardPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, logout } = useAuthStore();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [kiosks, setKiosks] = useState<KioskStatus[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        if (user?.role !== "ADMIN" && user?.role !== "STAFF") {
            router.push("/dashboard");
            return;
        }
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const headers = { Authorization: `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const [statsRes, activitiesRes, kiosksRes] = await Promise.all([
                fetch(`${baseUrl}/api/admin/dashboard`, { headers }),
                fetch(`${baseUrl}/api/admin/activities?limit=10`, { headers }),
                fetch(`${baseUrl}/api/admin/kiosks`, { headers }),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.data);
            }

            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.data || []);
            } else {
                // Mock activities if API not available
                setActivities([
                    { id: "1", type: "PAYMENT", description: "Bill payment of ₹2,450", user: "Rahul S.", kioskId: "KIOSK-001", timestamp: new Date().toISOString(), serviceType: "ELECTRICITY" },
                    { id: "2", type: "GRIEVANCE", description: "New complaint submitted", user: "Priya M.", kioskId: "KIOSK-002", timestamp: new Date(Date.now() - 300000).toISOString(), serviceType: "WATER" },
                    { id: "3", type: "CONNECTION", description: "New connection application", user: "Amit K.", kioskId: "KIOSK-001", timestamp: new Date(Date.now() - 600000).toISOString(), serviceType: "GAS" },
                    { id: "4", type: "METER_READING", description: "Meter reading submitted", user: "Sunita D.", kioskId: "KIOSK-003", timestamp: new Date(Date.now() - 900000).toISOString(), serviceType: "ELECTRICITY" },
                    { id: "5", type: "PAYMENT", description: "Bill payment of ₹890", user: "Vikram R.", kioskId: "KIOSK-002", timestamp: new Date(Date.now() - 1200000).toISOString(), serviceType: "WATER" },
                ]);
            }

            if (kiosksRes.ok) {
                const data = await kiosksRes.json();
                setKiosks(data.data || []);
            } else {
                // Mock kiosks if API not available
                setKiosks([
                    { id: "KIOSK-001", name: "City Center Kiosk", location: "Sector 17, Main Market", status: "ONLINE", lastActivity: new Date().toISOString(), todayTransactions: 45 },
                    { id: "KIOSK-002", name: "Municipal Office Kiosk", location: "Municipal Corporation HQ", status: "ONLINE", lastActivity: new Date(Date.now() - 120000).toISOString(), todayTransactions: 32 },
                    { id: "KIOSK-003", name: "Bus Stand Kiosk", location: "Central Bus Station", status: "ONLINE", lastActivity: new Date(Date.now() - 300000).toISOString(), todayTransactions: 28 },
                    { id: "KIOSK-004", name: "Hospital Kiosk", location: "District Hospital", status: "OFFLINE", lastActivity: new Date(Date.now() - 3600000).toISOString(), todayTransactions: 12 },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "PAYMENT": return CreditCard;
            case "GRIEVANCE": return MessageSquare;
            case "CONNECTION": return Zap;
            case "METER_READING": return Activity;
            default: return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "PAYMENT": return "text-success bg-success/10";
            case "GRIEVANCE": return "text-amber-600 bg-amber-100";
            case "CONNECTION": return "text-blue-600 bg-blue-100";
            case "METER_READING": return "text-purple-600 bg-purple-100";
            default: return "text-slate-600 bg-slate-100";
        }
    };

    const formatTime = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    // Mock stats if not loaded
    const displayStats = stats || {
        totalUsers: 1234,
        activeConnections: 4567,
        pendingConnections: 23,
        todayPayments: 156,
        todayRevenue: 234500,
        openGrievances: 45,
        resolvedToday: 12,
        activeKiosks: 3,
    };

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
                            <p className="text-xs text-white/60">Admin Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === "dashboard";
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
                                <span className="font-medium">{isHindi ? item.nameHi : item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-white/60">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full text-white/70 hover:text-white hover:bg-white/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isHindi ? "लॉग आउट" : "Logout"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-auto">
                {/* Header */}
                <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "लाइव डैशबोर्ड" : "Live Dashboard"}
                            </h2>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                {isHindi ? "वास्तविक समय अपडेट" : "Real-time updates from kiosks"}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                                {isHindi ? "रिफ्रेश" : "Refresh"}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "आज का राजस्व" : "Today's Revenue"}
                                            </p>
                                            <p className="text-3xl font-bold text-success mt-1">
                                                ₹{displayStats.todayRevenue.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-success" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {displayStats.todayPayments} transactions
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "सक्रिय कियोस्क" : "Active Kiosks"}
                                            </p>
                                            <p className="text-3xl font-bold text-primary mt-1">
                                                {kiosks.filter(k => k.status === "ONLINE").length}/{kiosks.length}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Monitor className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {kiosks.filter(k => k.status === "OFFLINE").length} offline
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "कुल उपयोगकर्ता" : "Total Users"}
                                            </p>
                                            <p className="text-3xl font-bold text-primary mt-1">
                                                {displayStats.totalUsers.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-success mt-2 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> +24 today
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "खुली शिकायतें" : "Open Grievances"}
                                            </p>
                                            <p className="text-3xl font-bold text-amber-600 mt-1">
                                                {displayStats.openGrievances}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-amber-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-success mt-2 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {displayStats.resolvedToday} resolved today
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Live Activity Feed */}
                                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
                                    <div className="p-4 border-b flex items-center justify-between">
                                        <h3 className="font-bold text-primary flex items-center gap-2">
                                            <Activity className="w-5 h-5" />
                                            {isHindi ? "लाइव गतिविधि" : "Live Activity Feed"}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {isHindi ? "कियोस्क से वास्तविक समय" : "Real-time from kiosks"}
                                        </span>
                                    </div>
                                    <div className="divide-y max-h-96 overflow-y-auto">
                                        {activities.map((activity) => {
                                            const Icon = getActivityIcon(activity.type);
                                            const svc = activity.serviceType ? serviceIcons[activity.serviceType] : null;
                                            const SvcIcon = svc?.icon;
                                            return (
                                                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-primary truncate">{activity.description}</p>
                                                                {SvcIcon && (
                                                                    <div className={`w-5 h-5 ${svc.bg} rounded flex items-center justify-center`}>
                                                                        <SvcIcon className={`w-3 h-3 ${svc.color}`} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                <span>{activity.user}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Monitor className="w-3 h-3" />
                                                                    {activity.kioskId}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatTime(activity.timestamp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Eye className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-3 border-t bg-slate-50">
                                        <Link href="/admin/activities" className="text-sm text-cta hover:underline flex items-center justify-center gap-1">
                                            {isHindi ? "सभी गतिविधि देखें" : "View All Activity"}
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Kiosk Status Panel */}
                                <div className="bg-white rounded-xl shadow-sm border">
                                    <div className="p-4 border-b">
                                        <h3 className="font-bold text-primary flex items-center gap-2">
                                            <Monitor className="w-5 h-5" />
                                            {isHindi ? "कियोस्क स्थिति" : "Kiosk Status"}
                                        </h3>
                                    </div>
                                    <div className="divide-y">
                                        {kiosks.map((kiosk) => (
                                            <div key={kiosk.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${kiosk.status === "ONLINE" ? "bg-success animate-pulse" : "bg-destructive"
                                                                }`} />
                                                            <p className="font-medium text-primary text-sm">{kiosk.name}</p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">{kiosk.location}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-primary">{kiosk.todayTransactions}</p>
                                                        <p className="text-xs text-muted-foreground">{isHindi ? "लेनदेन" : "txns"}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {isHindi ? "अंतिम गतिविधि" : "Last activity"}: {formatTime(kiosk.lastActivity)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t bg-slate-50">
                                        <Link href="/admin/kiosks" className="text-sm text-cta hover:underline flex items-center justify-center gap-1">
                                            {isHindi ? "कियोस्क प्रबंधित करें" : "Manage Kiosks"}
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Service Breakdown */}
                            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
                                <h3 className="font-bold text-primary mb-4">
                                    {isHindi ? "आज की सेवा उपयोग" : "Today's Service Usage"}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {[
                                        { key: "ELECTRICITY", name: "Electricity", nameHi: "बिजली", count: 67, revenue: 156000 },
                                        { key: "GAS", name: "Gas", nameHi: "गैस", count: 23, revenue: 34500 },
                                        { key: "WATER", name: "Water", nameHi: "पानी", count: 45, revenue: 28000 },
                                        { key: "MUNICIPAL", name: "Municipal", nameHi: "नगरपालिका", count: 12, revenue: 8500 },
                                        { key: "WASTE", name: "Waste", nameHi: "कचरा", count: 9, revenue: 0 },
                                    ].map((service) => {
                                        const svc = serviceIcons[service.key];
                                        const Icon = svc.icon;
                                        return (
                                            <div key={service.key} className={`p-4 ${svc.bg} rounded-xl`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon className={`w-5 h-5 ${svc.color}`} />
                                                    <span className="font-medium text-primary text-sm">
                                                        {isHindi ? service.nameHi : service.name}
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-primary">{service.count}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {service.revenue > 0 ? `₹${service.revenue.toLocaleString()}` : isHindi ? "शिकायतें" : "complaints"}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
