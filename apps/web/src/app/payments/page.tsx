"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Check,
    Clock,
    XCircle,
    FileText,
    Zap,
    Flame,
    Droplets,
    Building2,
    Download,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Payment {
    id: string;
    amount: number;
    transactionId: string;
    receiptNo: string;
    paymentMethod: string;
    paidAt: string;
    status: string;
    bill: {
        billNo: string;
        serviceType: string;
        connection: {
            connectionNo: string;
        };
    };
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    SUCCESS: { icon: Check, color: "text-success", bg: "bg-success/10" },
    PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    FAILED: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function PaymentHistoryPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { isAuthenticated } = useAuthStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchPayments();
    }, [isAuthenticated, router]);

    const fetchPayments = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/billing/payments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setPayments(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch payments:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = filter === "all"
        ? payments
        : payments.filter(p => p.bill.serviceType === filter);

    const totalPaid = payments
        .filter(p => p.status === "SUCCESS")
        .reduce((sum, p) => sum + p.amount, 0);

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-primary text-white py-4 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "भुगतान इतिहास" : "Payment History"}
                        </h1>
                        <p className="text-white/70 text-sm">
                            {isHindi ? "आपके सभी भुगतान" : "All your transactions"}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Stats Card */}
                <div className="kiosk-card mb-6 bg-gradient-to-r from-success/10 to-success/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {isHindi ? "कुल भुगतान" : "Total Paid"}
                            </p>
                            <p className="text-3xl font-bold text-success">
                                ₹{totalPaid.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                                {isHindi ? "लेनदेन" : "Transactions"}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                                {payments.filter(p => p.status === "SUCCESS").length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    {["all", "ELECTRICITY", "GAS", "WATER", "MUNICIPAL"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {f === "all" ? (isHindi ? "सभी" : "All") : f}
                        </button>
                    ))}
                </div>

                {/* Payments List */}
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {isHindi ? "लोड हो रहा है..." : "Loading..."}
                    </div>
                ) : filteredPayments.length > 0 ? (
                    <div className="space-y-3">
                        {filteredPayments.map((payment) => {
                            const svc = serviceIcons[payment.bill.serviceType] || serviceIcons.ELECTRICITY;
                            const Icon = svc.icon;
                            const status = statusConfig[payment.status] || statusConfig.PENDING;
                            const StatusIcon = status.icon;

                            return (
                                <div key={payment.id} className="kiosk-card">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${svc.bg} rounded-xl flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${svc.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-primary">
                                                    {payment.bill.serviceType}
                                                </p>
                                                <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${status.bg} ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {payment.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "बिल" : "Bill"}: {payment.bill.billNo}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(payment.paidAt).toLocaleDateString()} • {payment.paymentMethod}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                                            {payment.status === "SUCCESS" && (
                                                <Link href={`/bills/${payment.id}/receipt`}>
                                                    <Button variant="ghost" size="sm" className="text-xs">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        {isHindi ? "रसीद" : "Receipt"}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-muted-foreground">
                            {isHindi ? "कोई भुगतान नहीं मिला" : "No payments found"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
