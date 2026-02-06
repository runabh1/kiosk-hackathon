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
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    ChevronRight,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";

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
    user: {
        name: string;
        phone: string;
    };
    kioskId?: string;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
    SUBMITTED: { color: "text-blue-700", bg: "bg-blue-100" },
    IN_PROGRESS: { color: "text-amber-700", bg: "bg-amber-100" },
    PENDING_INFO: { color: "text-orange-700", bg: "bg-orange-100" },
    RESOLVED: { color: "text-success", bg: "bg-success/10" },
    CLOSED: { color: "text-slate-600", bg: "bg-slate-100" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
    LOW: { color: "text-slate-600", bg: "bg-slate-100" },
    MEDIUM: { color: "text-blue-700", bg: "bg-blue-100" },
    HIGH: { color: "text-orange-700", bg: "bg-orange-100" },
    URGENT: { color: "text-destructive", bg: "bg-destructive/10" },
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

export default function AdminGrievancesPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, logout } = useAuthStore();

    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchGrievances();
    }, [isAuthenticated, user, router]);

    const fetchGrievances = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/grievances`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setGrievances(data.data || []);
            } else {
                // Mock data
                setGrievances([
                    { id: "1", ticketNo: "GRV202402001", serviceType: "ELECTRICITY", category: "Power Outage", subject: "Frequent power cuts in sector 5", description: "We are experiencing frequent power cuts lasting 2-3 hours daily.", priority: "HIGH", status: "SUBMITTED", createdAt: new Date().toISOString(), user: { name: "Rahul Sharma", phone: "9876543210" }, kioskId: "KIOSK-001" },
                    { id: "2", ticketNo: "GRV202402002", serviceType: "WATER", category: "Low Pressure", subject: "Low water pressure in morning", description: "Water pressure is very low during 6-9 AM.", priority: "MEDIUM", status: "IN_PROGRESS", createdAt: new Date(Date.now() - 86400000).toISOString(), user: { name: "Priya Mehta", phone: "9876543211" }, kioskId: "KIOSK-002" },
                    { id: "3", ticketNo: "GRV202402003", serviceType: "GAS", category: "Leakage", subject: "Gas smell near meter", description: "Slight gas smell detected near the meter area.", priority: "URGENT", status: "SUBMITTED", createdAt: new Date(Date.now() - 7200000).toISOString(), user: { name: "Amit Kumar", phone: "9876543212" }, kioskId: "KIOSK-001" },
                    { id: "4", ticketNo: "GRV202402004", serviceType: "MUNICIPAL", category: "Street Light", subject: "Street light not working", description: "Street light at lane 5 not working for a week.", priority: "LOW", status: "RESOLVED", createdAt: new Date(Date.now() - 172800000).toISOString(), user: { name: "Sunita Devi", phone: "9876543213" } },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch grievances:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (grievanceId: string, newStatus: string) => {
        setUpdating(true);
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/grievances/${grievanceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (res.ok) {
                setGrievances(prev => prev.map(g =>
                    g.id === grievanceId ? { ...g, status: newStatus } : g
                ));
                setSelectedGrievance(null);
            }
        } catch (err) {
            console.error("Failed to update:", err);
        } finally {
            setUpdating(false);
        }
    };

    const filteredGrievances = grievances
        .filter(g => filter === "all" || g.status === filter)
        .filter(g =>
            search === "" ||
            g.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
            g.subject.toLowerCase().includes(search.toLowerCase()) ||
            g.user.name.toLowerCase().includes(search.toLowerCase())
        );

    const stats = {
        total: grievances.length,
        submitted: grievances.filter(g => g.status === "SUBMITTED").length,
        inProgress: grievances.filter(g => g.status === "IN_PROGRESS").length,
        resolved: grievances.filter(g => g.status === "RESOLVED" || g.status === "CLOSED").length,
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
                        const isActive = item.id === "grievances";
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
                                {isHindi ? "शिकायत प्रबंधन" : "Grievance Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "कियोस्क से आई शिकायतें" : "Complaints received from kiosks"}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-sm text-blue-700">New</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.submitted}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <p className="text-sm text-amber-700">In Progress</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
                        </div>
                        <div className="bg-success/5 rounded-xl p-4 border border-success/20">
                            <p className="text-sm text-success">Resolved</p>
                            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={isHindi ? "टिकट, विषय, या नाम खोजें..." : "Search ticket, subject, or name..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[
                                { key: "all", label: "All" },
                                { key: "SUBMITTED", label: "New" },
                                { key: "IN_PROGRESS", label: "In Progress" },
                                { key: "RESOLVED", label: "Resolved" },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key
                                            ? "bg-primary text-white"
                                            : "bg-white text-slate-600 hover:bg-slate-50 border"
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grievances Table */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Ticket</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Service</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Subject</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Priority</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Source</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td>
                                        </tr>
                                    ) : filteredGrievances.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-muted-foreground">No grievances found</td>
                                        </tr>
                                    ) : (
                                        filteredGrievances.map((g) => {
                                            const svc = serviceIcons[g.serviceType] || serviceIcons.MUNICIPAL;
                                            const Icon = svc.icon;
                                            const priority = priorityConfig[g.priority] || priorityConfig.MEDIUM;
                                            const status = statusConfig[g.status] || statusConfig.SUBMITTED;
                                            return (
                                                <tr key={g.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-sm">{g.ticketNo}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 ${svc.bg} rounded flex items-center justify-center`}>
                                                                <Icon className={`w-3 h-3 ${svc.color}`} />
                                                            </div>
                                                            <span className="text-sm">{g.serviceType}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium truncate max-w-[200px]">{g.subject}</p>
                                                        <p className="text-xs text-muted-foreground">{g.category}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm">{g.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{g.user.phone}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${priority.bg} ${priority.color}`}>
                                                            {g.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                                                            {g.status.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {g.kioskId ? (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Monitor className="w-3 h-3" />
                                                                {g.kioskId}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Web</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedGrievance(g)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Detail Modal */}
            {selectedGrievance && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-primary">{selectedGrievance.ticketNo}</h3>
                                <p className="text-sm text-muted-foreground">{selectedGrievance.category}</p>
                            </div>
                            <button onClick={() => setSelectedGrievance(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Subject</p>
                                <p className="font-medium">{selectedGrievance.subject}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="text-sm">{selectedGrievance.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">User</p>
                                    <p className="font-medium">{selectedGrievance.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedGrievance.user.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Source</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Monitor className="w-4 h-4" />
                                        {selectedGrievance.kioskId || "Web Portal"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                                <div className="flex gap-2 flex-wrap">
                                    {["SUBMITTED", "IN_PROGRESS", "PENDING_INFO", "RESOLVED", "CLOSED"].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(selectedGrievance.id, s)}
                                            disabled={updating || selectedGrievance.status === s}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedGrievance.status === s
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {s.replace("_", " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
