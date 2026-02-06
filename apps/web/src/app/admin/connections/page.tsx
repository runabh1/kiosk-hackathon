"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    Building2,
    LayoutDashboard,
    CreditCard,
    MessageSquare,
    Bell,
    BarChart3,
    Monitor,
    Sparkles,
    Shield,
    LogOut,
    Zap,
    Flame,
    Droplets,
    Activity,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    Phone,
    MapPin,
    ArrowUpDown,
    Filter,
    RefreshCw,
    Hash,
    MoreVertical,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";

interface ConnectionListItem {
    id: string;
    serviceType: string;
    connectionNo: string;
    meterNo: string | null;
    status: string;
    address: string;
    city: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        phone: string;
    };
    _count: {
        bills: number;
        meterReadings: number;
    };
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

const navItems = [
    { id: "dashboard", name: "Dashboard", nameHi: "डैशबोर्ड", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", nameHi: "उपयोगकर्ता", icon: Users, href: "/admin/users" },
    { id: "connections", name: "Connections", nameHi: "कनेक्शन", icon: Zap, href: "/admin/connections" },
    { id: "payments", name: "Payments", nameHi: "भुगतान", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", nameHi: "शिकायतें", icon: MessageSquare, href: "/admin/grievances" },
    { id: "requests", name: "Service Requests", nameHi: "सेवा अनुरोध", icon: Activity, href: "/admin/service-requests" },
    { id: "reports", name: "Reports", nameHi: "रिपोर्ट", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", nameHi: "कियोस्क", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", nameHi: "अलर्ट", icon: Bell, href: "/admin/alerts" },
    { id: "intents", name: "Smart Assistant", nameHi: "स्मार्ट असिस्टेंट", icon: Sparkles, href: "/admin/intents" },
    { id: "sigm", name: "SIGM Metrics", nameHi: "सिंगल-इंटरेक्शन", icon: Shield, href: "/admin" },
];

export default function AdminConnectionsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user: currentUser, isAuthenticated, logout } = useAuthStore();

    const [connections, setConnections] = useState<ConnectionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        if (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF") {
            router.push("/dashboard");
            return;
        }
        fetchConnections();
    }, [isAuthenticated, currentUser, page, search, statusFilter, typeFilter]);

    const fetchConnections = async () => {
        try {
            setRefreshing(true);
            const token = useAuthStore.getState().tokens?.accessToken;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const url = new URL(`${baseUrl}/api/admin/connections`);
            url.searchParams.append("page", page.toString());
            url.searchParams.append("limit", "10");
            if (search) url.searchParams.append("search", search);
            if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
            if (typeFilter !== "all") url.searchParams.append("serviceType", typeFilter);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setConnections(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch connections:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchConnections();
    };

    if (!isAuthenticated || (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar (Same as dashboard) */}
            <aside className="w-64 bg-primary text-white flex flex-col fixed h-full z-20">
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
                        const isActive = item.id === "connections";
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
                            {currentUser?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{currentUser?.name}</p>
                            <p className="text-xs text-white/60">{currentUser?.role}</p>
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
                                {isHindi ? "कनेक्शन प्रबंधन" : "Connection Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "सभी सेवा कनेक्शन प्रबंधित करें" : "Manage all utility service connections"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={isHindi ? "कनेक्शन/उपयोगकर्ता खोजें..." : "Search connection/user..."}
                                    className="pl-9 w-64 h-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>
                            <Button variant="outline" size="icon" onClick={() => fetchConnections()} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Service Type</label>
                            <select
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All Services</option>
                                <option value="ELECTRICITY">Electricity</option>
                                <option value="WATER">Water Supply</option>
                                <option value="GAS">Gas (PNG)</option>
                                <option value="MUNICIPAL">Municipal</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Status</label>
                            <select
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="PENDING">Pending Approval</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="DISCONNECTED">Disconnected</option>
                            </select>
                        </div>
                    </div>

                    {/* Connection Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-primary">{isHindi ? "कनेक्शन सूची" : "Connection List"}</h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    {connections.length} Records
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-xs font-bold text-muted-foreground uppercase border-b">
                                    <tr>
                                        <th className="px-6 py-4">{isHindi ? "कनेक्शन विवरण" : "Connection Details"}</th>
                                        <th className="px-6 py-4">{isHindi ? "उपयोगकर्ता" : "Citizen"}</th>
                                        <th className="px-6 py-4">{isHindi ? "स्थान" : "Address"}</th>
                                        <th className="px-6 py-4 text-center">{isHindi ? "स्थिति" : "Status"}</th>
                                        <th className="px-6 py-4 text-right">{isHindi ? "संपत्ति" : "Assets"}</th>
                                        <th className="px-6 py-4 text-center">{isHindi ? "कार्य" : "Actions"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                                                    <span>Loading connections...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : connections.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                {isHindi ? "कोई कनेक्शन नहीं मिला" : "No connections found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        connections.map((c) => {
                                            const svc = serviceIcons[c.serviceType] || serviceIcons.ELECTRICITY;
                                            const Icon = svc.icon;
                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors text-sm">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 ${svc.bg} rounded-lg flex items-center justify-center`}>
                                                                <Icon className={`w-5 h-5 ${svc.color}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-primary flex items-center gap-1">
                                                                    {c.connectionNo}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Hash className="w-3 h-3" />
                                                                    Meter: {c.meterNo || "Unassigned"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-primary">{c.user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{c.user.phone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            <p className="truncate font-medium">{c.address}</p>
                                                            <p className="text-xs text-muted-foreground">{c.city}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${c.status === "ACTIVE" ? "bg-success/10 text-success border border-success/20" :
                                                            c.status === "PENDING" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                                "bg-slate-100 text-slate-600 border border-slate-200"
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium">
                                                                {c._count.bills} Bills
                                                            </span>
                                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium">
                                                                {c._count.meterReadings} Readings
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Link href={`/admin/connections/${c.id}`}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                            </Link>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
