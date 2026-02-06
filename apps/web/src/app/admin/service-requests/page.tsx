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
    ExternalLink,
    Zap,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";

interface AdminServiceRequest {
    id: string;
    type: string;
    status: string;
    description: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        phone: string;
    };
    connection?: {
        id: string;
        connectionNo: string;
        serviceType: string;
    };
}

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

export default function AdminServiceRequestsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user: currentUser, isAuthenticated, logout } = useAuthStore();

    const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        if (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF") {
            router.push("/dashboard");
            return;
        }
        fetchRequests();
    }, [isAuthenticated, currentUser, page, search, statusFilter]);

    const fetchRequests = async () => {
        try {
            setRefreshing(true);
            const token = useAuthStore.getState().tokens?.accessToken;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const url = new URL(`${baseUrl}/api/admin/service-requests`);
            url.searchParams.append("page", page.toString());
            url.searchParams.append("limit", "10");
            if (search) url.searchParams.append("search", search);
            if (statusFilter !== "all") url.searchParams.append("status", statusFilter);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch requests:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const res = await fetch(`${baseUrl}/api/admin/service-requests/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    if (!isAuthenticated || (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
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
                        const isActive = item.id === "requests";
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
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "सेवा अनुरोध प्रबंधन" : "Service Request Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "मिसलेनियस सेवा अनुरोधों की समीक्षा करें" : "Review and process miscellaneous service requests"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search citizen/connection..."
                                    className="pl-9 w-64 h-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => fetchRequests()} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        {['all', 'SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${statusFilter === status
                                    ? "bg-primary text-white"
                                    : "bg-white text-slate-600 border hover:bg-slate-50"
                                    }`}
                            >
                                {status === 'all' ? 'All Requests' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-xs font-bold text-muted-foreground uppercase border-b">
                                    <tr>
                                        <th className="px-6 py-4">Request Type</th>
                                        <th className="px-6 py-4">Citizen</th>
                                        <th className="px-6 py-4">Connection</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Submitted</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin w-8 h-8 text-cta" />
                                                    <span>Loading requests...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                No service requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                                            <Activity className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-primary">{r.type.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-primary">{r.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{r.user.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {r.connection ? (
                                                        <div>
                                                            <p className="font-medium text-slate-700">{r.connection.connectionNo}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{r.connection.serviceType}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                        r.status === 'SUBMITTED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                        }`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right overflow-hidden whitespace-nowrap">
                                                    <p className="text-xs font-medium">{new Date(r.createdAt).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {r.status === 'SUBMITTED' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-[10px] font-bold"
                                                                onClick={() => updateStatus(r.id, 'IN_PROGRESS')}
                                                            >
                                                                Process
                                                            </Button>
                                                        )}
                                                        {r.status === 'IN_PROGRESS' && (
                                                            <Button
                                                                variant="cta"
                                                                size="sm"
                                                                className="h-8 text-[10px] font-bold"
                                                                onClick={() => updateStatus(r.id, 'COMPLETED')}
                                                            >
                                                                Complete
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Prev
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

