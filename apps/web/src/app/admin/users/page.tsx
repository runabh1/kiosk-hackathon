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
    UserCircle,
    CheckCircle2,
    XCircle,
    Calendar,
    Phone,
    Mail,
    MapPin,
    ArrowUpDown,
    Filter,
    Zap,
    RefreshCw,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";

interface UserListItem {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    isVerified: boolean;
    createdAt: string;
    _count: {
        connections: number;
        grievances: number;
    };
}

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
    { id: "sigm", name: "SIGM Metrics", nameHi: "सिंगल-इंटरेक्शन", icon: Shield, href: "/admin" },
];


export default function AdminUsersPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user: currentUser, isAuthenticated, logout } = useAuthStore();

    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        if (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF") {
            router.push("/dashboard");
            return;
        }
        fetchUsers();
    }, [isAuthenticated, currentUser, page, search]);

    const fetchUsers = async () => {
        try {
            setRefreshing(true);
            const token = useAuthStore.getState().tokens?.accessToken;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const url = new URL(`${baseUrl}/api/admin/users`);
            url.searchParams.append("page", page.toString());
            url.searchParams.append("limit", "10");
            if (search) url.searchParams.append("search", search);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
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
        fetchUsers();
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
                        const isActive = item.id === "users";
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
                                {isHindi ? "उपयोगकर्ता प्रबंधन" : "User Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "पंजीकृत नागरिकों की सूची" : "List of registered citizens on the platform"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={isHindi ? "खोजें..." : "Search users..."}
                                    className="pl-9 w-64 h-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>
                            <Button variant="outline" size="icon" onClick={() => fetchUsers()} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* User Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-primary">{isHindi ? "नागरिक सूची" : "Citizen List"}</h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    {users.length} Users
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filter
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <ArrowUpDown className="w-4 h-4 mr-2" />
                                    Sort
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-xs font-bold text-muted-foreground uppercase border-b">
                                    <tr>
                                        <th className="px-6 py-4">{isHindi ? "उपयोगकर्ता" : "User"}</th>
                                        <th className="px-6 py-4">{isHindi ? "संपर्क" : "Contact"}</th>
                                        <th className="px-6 py-4">{isHindi ? "स्थान" : "Location"}</th>
                                        <th className="px-6 py-4 text-center">{isHindi ? "स्थिति" : "Status"}</th>
                                        <th className="px-6 py-4 text-right">{isHindi ? "गतिविधि" : "Activity"}</th>
                                        <th className="px-6 py-4 text-center">{isHindi ? "कार्य" : "Actions"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                                                    <span>Loading users...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                {isHindi ? "कोई उपयोगकर्ता नहीं मिला" : "No users found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary">{u.name}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm flex items-center gap-2">
                                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                                            {u.phone}
                                                        </p>
                                                        {u.email && (
                                                            <p className="text-xs flex items-center gap-2 text-muted-foreground">
                                                                <Mail className="w-3 h-3" />
                                                                {u.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        {u.city || "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {u.isVerified ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                            <Clock className="w-3 h-3" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                            {u._count.connections} Connections
                                                        </span>
                                                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                                                            {u._count.grievances} Grievances
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
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

