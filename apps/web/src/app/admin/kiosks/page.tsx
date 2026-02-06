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
    MapPin,
    Activity,
    Power,
    Settings,
    RefreshCw,
    Wifi,
    WifiOff,
    Clock,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Kiosk {
    id: string;
    name: string;
    location: string;
    address: string;
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    lastPing: string;
    todayTransactions: number;
    todayRevenue: number;
    uptime: number;
    version: string;
}

const navItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", icon: Users, href: "/admin/users" },
    { id: "payments", name: "Payments", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", icon: MessageSquare, href: "/admin/grievances" },
    { id: "reports", name: "Reports", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", icon: Bell, href: "/admin/alerts" },
];

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    ONLINE: { color: "text-success", bg: "bg-success/10", icon: Wifi },
    OFFLINE: { color: "text-destructive", bg: "bg-destructive/10", icon: WifiOff },
    MAINTENANCE: { color: "text-amber-600", bg: "bg-amber-100", icon: Settings },
};

export default function AdminKiosksPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, logout } = useAuthStore();

    const [kiosks, setKiosks] = useState<Kiosk[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchKiosks();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchKiosks, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user, router]);

    const fetchKiosks = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/kiosks`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setKiosks(data.data || []);
            } else {
                // Mock data
                setKiosks([
                    { id: "KIOSK-001", name: "City Center Kiosk", location: "Sector 17, Main Market", address: "Shop No. 45, Main Market, Sector 17, Smart City", status: "ONLINE", lastPing: new Date().toISOString(), todayTransactions: 45, todayRevenue: 67500, uptime: 99.8, version: "2.1.0" },
                    { id: "KIOSK-002", name: "Municipal Office Kiosk", location: "Municipal Corporation HQ", address: "Ground Floor, MC Building, Civil Lines", status: "ONLINE", lastPing: new Date(Date.now() - 60000).toISOString(), todayTransactions: 32, todayRevenue: 48000, uptime: 99.5, version: "2.1.0" },
                    { id: "KIOSK-003", name: "Bus Stand Kiosk", location: "Central Bus Station", address: "Platform 1, CBS, Transport Nagar", status: "ONLINE", lastPing: new Date(Date.now() - 120000).toISOString(), todayTransactions: 28, todayRevenue: 42000, uptime: 98.2, version: "2.1.0" },
                    { id: "KIOSK-004", name: "Hospital Kiosk", location: "District Hospital", address: "OPD Block, District Hospital", status: "OFFLINE", lastPing: new Date(Date.now() - 3600000).toISOString(), todayTransactions: 12, todayRevenue: 18000, uptime: 85.5, version: "2.0.5" },
                    { id: "KIOSK-005", name: "Railway Station Kiosk", location: "Railway Station", address: "Main Entrance, Railway Station", status: "MAINTENANCE", lastPing: new Date(Date.now() - 7200000).toISOString(), todayTransactions: 0, todayRevenue: 0, uptime: 92.0, version: "2.1.0" },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch kiosks:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchKiosks();
    };

    const formatTime = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const stats = {
        total: kiosks.length,
        online: kiosks.filter(k => k.status === "ONLINE").length,
        offline: kiosks.filter(k => k.status === "OFFLINE").length,
        maintenance: kiosks.filter(k => k.status === "MAINTENANCE").length,
        totalRevenue: kiosks.reduce((sum, k) => sum + k.todayRevenue, 0),
        totalTxns: kiosks.reduce((sum, k) => sum + k.todayTransactions, 0),
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
                        const isActive = item.id === "kiosks";
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
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "कियोस्क प्रबंधन" : "Kiosk Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                {isHindi ? "वास्तविक समय स्थिति" : "Real-time status monitoring"}
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            {isHindi ? "रिफ्रेश" : "Refresh"}
                        </Button>
                    </div>
                </header>

                <div className="p-6">
                    {/* Stats */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border">
                            <p className="text-sm text-muted-foreground">{isHindi ? "कुल कियोस्क" : "Total Kiosks"}</p>
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        </div>
                        <div className="bg-success/5 rounded-xl p-4 border border-success/20">
                            <p className="text-sm text-success">{isHindi ? "ऑनलाइन" : "Online"}</p>
                            <p className="text-2xl font-bold text-success">{stats.online}</p>
                        </div>
                        <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                            <p className="text-sm text-destructive">{isHindi ? "ऑफलाइन" : "Offline"}</p>
                            <p className="text-2xl font-bold text-destructive">{stats.offline}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <p className="text-sm text-amber-700">{isHindi ? "रखरखाव" : "Maintenance"}</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.maintenance}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border">
                            <p className="text-sm text-muted-foreground">{isHindi ? "आज का राजस्व" : "Today's Revenue"}</p>
                            <p className="text-2xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Kiosk Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kiosks.map((kiosk) => {
                                const statusCfg = statusConfig[kiosk.status];
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <div key={kiosk.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        {/* Status Bar */}
                                        <div className={`px-4 py-2 ${statusCfg.bg} flex items-center justify-between`}>
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`w-4 h-4 ${statusCfg.color}`} />
                                                <span className={`text-sm font-medium ${statusCfg.color}`}>
                                                    {kiosk.status}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {kiosk.id}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-primary">{kiosk.name}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {kiosk.location}
                                            </p>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div className="bg-slate-50 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground">{isHindi ? "आज लेनदेन" : "Today's Txns"}</p>
                                                    <p className="text-lg font-bold text-primary">{kiosk.todayTransactions}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground">{isHindi ? "राजस्व" : "Revenue"}</p>
                                                    <p className="text-lg font-bold text-primary">₹{kiosk.todayRevenue.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Last: {formatTime(kiosk.lastPing)}
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1">
                                                    <Activity className="w-3 h-3" />
                                                    {kiosk.uptime}% uptime
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-3 flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                                    <Settings className="w-3 h-3 mr-1" />
                                                    {isHindi ? "कॉन्फ़िगर" : "Configure"}
                                                </Button>
                                                {kiosk.status === "ONLINE" && (
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Power className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Kiosk Button */}
                    <div className="mt-6 text-center">
                        <Button variant="cta">
                            <Monitor className="w-4 h-4 mr-2" />
                            {isHindi ? "नया कियोस्क जोड़ें" : "Add New Kiosk"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
