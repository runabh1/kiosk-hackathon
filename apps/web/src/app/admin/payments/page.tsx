"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CreditCard,
    Search,
    Filter,
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Flame,
    Droplets,
    Building2,
    Eye,
    Receipt,
    TrendingUp,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";

interface Payment {
    id: string;
    amount: number;
    method: string;
    status: string;
    transactionId: string;
    receiptNo: string;
    paidAt: string;
    createdAt: string;
    user: {
        name: string;
        phone: string;
    };
    bill: {
        billNo: string;
        serviceType: string;
        connection: {
            connectionNo: string;
        };
    };
}

interface PaymentStats {
    todayTotal: number;
    todayCount: number;
    weekTotal: number;
    weekCount: number;
    monthTotal: number;
    monthCount: number;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
    SUCCESS: { bg: "bg-success/10", text: "text-success", icon: CheckCircle },
    PENDING: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
    FAILED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    REFUNDED: { bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
};

export default function AdminPaymentsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated, tokens } = useAuthStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");
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
        fetchPayments();
    }, [isAuthenticated, user, router]);

    const fetchPayments = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            // Mock data for now - replace with actual API call
            setPayments([
                {
                    id: "pay1",
                    amount: 2450,
                    method: "UPI",
                    status: "SUCCESS",
                    transactionId: "TXN" + Date.now(),
                    receiptNo: "RCP001",
                    paidAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    user: { name: "Rahul Sharma", phone: "9876543210" },
                    bill: { billNo: "ELEC-2024-001", serviceType: "ELECTRICITY", connection: { connectionNo: "ELEC001" } },
                },
                {
                    id: "pay2",
                    amount: 890,
                    method: "CARD",
                    status: "SUCCESS",
                    transactionId: "TXN" + (Date.now() - 1000),
                    receiptNo: "RCP002",
                    paidAt: new Date(Date.now() - 3600000).toISOString(),
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    user: { name: "Priya Mehta", phone: "9876543211" },
                    bill: { billNo: "WAT-2024-001", serviceType: "WATER", connection: { connectionNo: "WAT001" } },
                },
                {
                    id: "pay3",
                    amount: 1200,
                    method: "NET_BANKING",
                    status: "PENDING",
                    transactionId: "TXN" + (Date.now() - 2000),
                    receiptNo: "RCP003",
                    paidAt: new Date(Date.now() - 7200000).toISOString(),
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    user: { name: "Amit Kumar", phone: "9876543212" },
                    bill: { billNo: "GAS-2024-001", serviceType: "GAS", connection: { connectionNo: "GAS001" } },
                },
                {
                    id: "pay4",
                    amount: 3500,
                    method: "UPI",
                    status: "SUCCESS",
                    transactionId: "TXN" + (Date.now() - 3000),
                    receiptNo: "RCP004",
                    paidAt: new Date(Date.now() - 86400000).toISOString(),
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    user: { name: "Sunita Devi", phone: "9876543213" },
                    bill: { billNo: "ELEC-2024-002", serviceType: "ELECTRICITY", connection: { connectionNo: "ELEC002" } },
                },
                {
                    id: "pay5",
                    amount: 450,
                    method: "CARD",
                    status: "FAILED",
                    transactionId: "TXN" + (Date.now() - 4000),
                    receiptNo: "",
                    paidAt: "",
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    user: { name: "Vikram Rao", phone: "9876543214" },
                    bill: { billNo: "MUN-2024-001", serviceType: "MUNICIPAL", connection: { connectionNo: "MUN001" } },
                },
            ]);

            setStats({
                todayTotal: 3340,
                todayCount: 3,
                weekTotal: 15680,
                weekCount: 12,
                monthTotal: 67890,
                monthCount: 45,
            });
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPayments();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.bill.billNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
        const matchesService = serviceFilter === "all" || payment.bill.serviceType === serviceFilter;
        return matchesSearch && matchesStatus && matchesService;
    });

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
                                <CreditCard className="w-6 h-6" />
                                {isHindi ? "भुगतान प्रबंधन" : "Payment Management"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "सभी भुगतान लेनदेन देखें और प्रबंधित करें" : "View and manage all payment transactions"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            {isHindi ? "निर्यात" : "Export"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
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
                ) : (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "आज का संग्रह" : "Today's Collection"}
                                            </p>
                                            <p className="text-3xl font-bold text-success mt-1">
                                                ₹{stats.todayTotal.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-success" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {stats.todayCount} {isHindi ? "लेनदेन" : "transactions"}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "इस सप्ताह" : "This Week"}
                                            </p>
                                            <p className="text-3xl font-bold text-blue-600 mt-1">
                                                ₹{stats.weekTotal.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {stats.weekCount} {isHindi ? "लेनदेन" : "transactions"}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "इस महीने" : "This Month"}
                                            </p>
                                            <p className="text-3xl font-bold text-purple-600 mt-1">
                                                ₹{stats.monthTotal.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {stats.monthCount} {isHindi ? "लेनदेन" : "transactions"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder={isHindi ? "नाम, ट्रांजेक्शन ID, बिल नंबर खोजें..." : "Search by name, transaction ID, bill no..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-10 px-3 rounded-md border border-slate-200 text-sm"
                                    >
                                        <option value="all">{isHindi ? "सभी स्थिति" : "All Status"}</option>
                                        <option value="SUCCESS">{isHindi ? "सफल" : "Success"}</option>
                                        <option value="PENDING">{isHindi ? "लंबित" : "Pending"}</option>
                                        <option value="FAILED">{isHindi ? "विफल" : "Failed"}</option>
                                    </select>
                                    <select
                                        value={serviceFilter}
                                        onChange={(e) => setServiceFilter(e.target.value)}
                                        className="h-10 px-3 rounded-md border border-slate-200 text-sm"
                                    >
                                        <option value="all">{isHindi ? "सभी सेवाएं" : "All Services"}</option>
                                        <option value="ELECTRICITY">{isHindi ? "बिजली" : "Electricity"}</option>
                                        <option value="WATER">{isHindi ? "पानी" : "Water"}</option>
                                        <option value="GAS">{isHindi ? "गैस" : "Gas"}</option>
                                        <option value="MUNICIPAL">{isHindi ? "नगरपालिका" : "Municipal"}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Payments Table */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "ट्रांजेक्शन" : "Transaction"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "उपयोगकर्ता" : "User"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "सेवा" : "Service"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "राशि" : "Amount"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "विधि" : "Method"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "स्थिति" : "Status"}
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "दिनांक" : "Date"}
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                                {isHindi ? "क्रियाएं" : "Actions"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredPayments.map((payment) => {
                                            const svc = serviceIcons[payment.bill.serviceType];
                                            const SvcIcon = svc?.icon || Building2;
                                            const status = statusStyles[payment.status] || statusStyles.PENDING;
                                            const StatusIcon = status.icon;

                                            return (
                                                <tr key={payment.id} className="hover:bg-slate-50">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-mono text-sm font-medium">{payment.transactionId}</p>
                                                            {payment.receiptNo && (
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                    <Receipt className="w-3 h-3" />
                                                                    {payment.receiptNo}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium text-sm">{payment.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.user.phone}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 ${svc?.bg || 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                                                                <SvcIcon className={`w-4 h-4 ${svc?.color || 'text-slate-600'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{payment.bill.billNo}</p>
                                                                <p className="text-xs text-muted-foreground">{payment.bill.connection.connectionNo}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="text-lg font-bold text-primary">₹{payment.amount.toLocaleString()}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm">{payment.method.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="text-sm">{formatDate(payment.paidAt || payment.createdAt)}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {filteredPayments.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>{isHindi ? "कोई भुगतान नहीं मिला" : "No payments found"}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
