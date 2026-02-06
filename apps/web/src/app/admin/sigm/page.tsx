"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Phone,
    Ticket,
    Calendar,
    AlertCircle,
    RefreshCw,
    Search,
    Filter,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/use-toast";

interface BackendAction {
    id: string;
    actionType: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    priority: number;
    requestType: string;
    serviceType: string;
    requestId?: string;
    notes?: string;
    createdAt: string;
    user: {
        name: string;
        phone: string;
    };
}

export default function SIGMOperationsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, tokens } = useAuthStore();

    const [actions, setActions] = useState<BackendAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
        fetchActions();
    }, [isAuthenticated, user, router]);

    const fetchActions = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            const res = await fetch(`${baseUrl}/api/sigm/backend-actions?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${tokens?.accessToken}` },
            });

            const data = await res.json();
            if (res.ok) {
                setActions(data.data || []);
            } else {
                // Mock data if API fails or for demo
                setActions([
                    {
                        id: "act-1",
                        actionType: "LEDGER_UPDATE",
                        description: "Update payment ledger for bill correction",
                        status: "PENDING",
                        priority: 1,
                        requestType: "BILL_PAYMENT",
                        serviceType: "ELECTRICITY",
                        createdAt: new Date().toISOString(),
                        user: { name: "Rajesh Kumar", phone: "9876543210" },
                    },
                    {
                        id: "act-2",
                        actionType: "TECHNICAL_SURVEY",
                        description: "Schedule site visit for new connection feasibility",
                        status: "IN_PROGRESS",
                        priority: 2,
                        requestType: "NEW_CONNECTION",
                        serviceType: "WATER",
                        requestId: "WAT-CON-102",
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        user: { name: "Suman Devi", phone: "9876543211" },
                    },
                    {
                        id: "act-3",
                        actionType: "FIELD_VERIFICATION",
                        description: "Verify grievance location and infrastructure status",
                        status: "PENDING",
                        priority: 1,
                        requestType: "COMPLAINT_REGISTRATION",
                        serviceType: "GAS",
                        requestId: "GRV-992",
                        createdAt: new Date(Date.now() - 43200000).toISOString(),
                        user: { name: "Vijay Singh", phone: "9876543212" },
                    }
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch backend actions:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateActionStatus = async (id: string, status: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            const res = await fetch(`${baseUrl}/api/sigm/backend-actions/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast({ title: "Action Updated", description: `Status changed to ${status}` });
                fetchActions();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update action", variant: "destructive" });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200";
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "FAILED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getPriorityLabel = (p: number) => {
        if (p === 1) return { label: "High", color: "text-red-600 bg-red-50" };
        if (p === 2) return { label: "Medium", color: "text-amber-600 bg-amber-50" };
        return { label: "Low", color: "text-blue-600 bg-blue-50" };
    };

    const filteredActions = actions.filter((action) =>
        action.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-muted-foreground hover:text-primary">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                                <Shield className="w-6 h-6 text-indigo-600" />
                                {isHindi ? "SIGM ऑपरेशंस" : "SIGM Operations Queue"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "नॉन-गारंटीड अनुरोधों के लिए बैकएंड क्रियाएं" : "Manage backend actions for non-guaranteed citizen requests"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); fetchActions(); }} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            {isHindi ? "रिफ्रेश" : "Refresh"}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={isHindi ? "खोजें..." : "Search actions, users..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-11 px-4 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredActions.map((action) => {
                            const priority = getPriorityLabel(action.priority);
                            return (
                                <div key={action.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:border-indigo-300 transition-all">
                                    <div className="p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${action.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                                                    }`}>
                                                    <Ticket className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-lg text-primary">{action.actionType.replace(/_/g, ' ')}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${priority.color}`}>
                                                            {priority.label} Priority
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={action.status}
                                                    onChange={(e) => updateActionStatus(action.id, e.target.value)}
                                                    className={`h-9 px-3 rounded-lg border text-xs font-bold focus:ring-2 outline-none cursor-pointer ${getStatusColor(action.status)}`}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                    <option value="FAILED">FAILED</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium text-primary">{action.user.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-4 h-4" />
                                                <span>{action.user.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                <span>Created: {new Date(action.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="capitalize">{action.requestType.toLowerCase().replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t">
                                        <div className="text-xs text-muted-foreground">
                                            Reference ID: <span className="font-mono">{action.requestId || 'N/A'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 text-xs">View Details</Button>
                                            <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600" onClick={() => updateActionStatus(action.id, 'COMPLETED')}>
                                                Mark Complete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredActions.length === 0 && (
                            <div className="bg-white rounded-xl border p-12 text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-primary mb-2">Queue is Clear!</h3>
                                <p className="text-muted-foreground">All backend actions for guaranteed requests are completed.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
