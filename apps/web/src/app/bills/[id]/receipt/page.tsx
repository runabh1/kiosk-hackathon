"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Download,
    Printer,
    Check,
    Loader2,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Zap,
    Flame,
    Droplets,
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
        periodFrom: string;
        periodTo: string;
        connection: {
            serviceType: string;
            connectionNo: string;
            address: string;
            city: string;
        };
    };
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

export default function ReceiptPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const paymentId = params.id as string;
    const receiptRef = useRef<HTMLDivElement>(null);
    const isHindi = i18n.language === "hi";

    const { isAuthenticated } = useAuthStore();

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchReceipt();
    }, [isAuthenticated, paymentId, router]);

    const fetchReceipt = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/billing/receipt/${paymentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setPayment(data.data);
            } else {
                setError("Receipt not found");
            }
        } catch (err) {
            setError("Failed to load receipt");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Create a simple text-based receipt for download
        if (!payment) return;

        const receiptText = `
SUVIDHA - UNIFIED CIVIC SERVICES
================================
PAYMENT RECEIPT
================================

Receipt No: ${payment.receiptNo}
Transaction ID: ${payment.transactionId}
Date: ${new Date(payment.paidAt).toLocaleString()}

SERVICE DETAILS
---------------
Service: ${payment.bill.connection.serviceType}
Connection No: ${payment.bill.connection.connectionNo}
Address: ${payment.bill.connection.address}, ${payment.bill.connection.city}

PAYMENT DETAILS
---------------
Bill No: ${payment.bill.billNo}
Bill Period: ${new Date(payment.bill.periodFrom).toLocaleDateString()} - ${new Date(payment.bill.periodTo).toLocaleDateString()}
Amount Paid: ₹${payment.amount.toLocaleString()}
Payment Method: ${payment.paymentMethod}
Status: ${payment.status}

================================
Thank you for your payment!
This is a computer generated receipt.
================================
    `;

        const blob = new Blob([receiptText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Receipt_${payment.receiptNo}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cta" />
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-primary text-white py-4 px-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="font-heading text-xl font-bold">Receipt</h1>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-8 text-center">
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    const svc = serviceIcons[payment.bill.connection.serviceType] || serviceIcons.ELECTRICITY;
    const Icon = svc.icon;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header - Hidden when printing */}
            <header className="bg-primary text-white py-4 px-6 print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "भुगतान रसीद" : "Payment Receipt"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleDownload}>
                            <Download className="w-4 h-4 mr-2" />
                            {isHindi ? "डाउनलोड" : "Download"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            {isHindi ? "प्रिंट" : "Print"}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Receipt Card */}
                <div ref={receiptRef} className="bg-white rounded-2xl shadow-lg border overflow-hidden print:shadow-none print:border-2">
                    {/* Receipt Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Building2 className="w-8 h-8" />
                            <h2 className="text-2xl font-bold">SUVIDHA</h2>
                        </div>
                        <p className="text-white/80 text-sm">
                            {isHindi ? "एकीकृत नागरिक सेवा पोर्टल" : "Unified Civic Services Portal"}
                        </p>
                    </div>

                    {/* Success Badge */}
                    <div className="flex justify-center -mt-5">
                        <div className="bg-success text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">
                                {isHindi ? "भुगतान सफल" : "Payment Successful"}
                            </span>
                        </div>
                    </div>

                    {/* Receipt Content */}
                    <div className="p-6">
                        {/* Amount */}
                        <div className="text-center mb-6 py-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">
                                {isHindi ? "भुगतान राशि" : "Amount Paid"}
                            </p>
                            <p className="text-4xl font-bold text-primary">
                                ₹{payment.amount.toLocaleString()}
                            </p>
                        </div>

                        {/* Receipt Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Transaction Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-primary border-b pb-2">
                                    {isHindi ? "लेनदेन विवरण" : "Transaction Details"}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "रसीद संख्या" : "Receipt No"}
                                        </span>
                                        <span className="font-mono font-medium">{payment.receiptNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "लेनदेन ID" : "Transaction ID"}
                                        </span>
                                        <span className="font-mono text-xs">{payment.transactionId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "दिनांक और समय" : "Date & Time"}
                                        </span>
                                        <span>{new Date(payment.paidAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "भुगतान विधि" : "Payment Method"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CreditCard className="w-4 h-4" />
                                            {payment.paymentMethod}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-primary border-b pb-2">
                                    {isHindi ? "सेवा विवरण" : "Service Details"}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "सेवा प्रकार" : "Service Type"}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <div className={`w-6 h-6 ${svc.bg} rounded flex items-center justify-center`}>
                                                <Icon className={`w-4 h-4 ${svc.color}`} />
                                            </div>
                                            {payment.bill.connection.serviceType}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "कनेक्शन संख्या" : "Connection No"}
                                        </span>
                                        <span className="font-mono">{payment.bill.connection.connectionNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "बिल संख्या" : "Bill No"}
                                        </span>
                                        <span className="font-mono">{payment.bill.billNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {isHindi ? "बिल अवधि" : "Bill Period"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(payment.bill.periodFrom).toLocaleDateString()} - {new Date(payment.bill.periodTo).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">
                                {isHindi ? "सेवा पता" : "Service Address"}
                            </p>
                            <p className="font-medium">
                                {payment.bill.connection.address}, {payment.bill.connection.city}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
                            <p>{isHindi ? "यह एक कंप्यूटर जनित रसीद है।" : "This is a computer generated receipt."}</p>
                            <p className="mt-1">
                                {isHindi ? "भुगतान के लिए धन्यवाद!" : "Thank you for your payment!"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Hidden when printing */}
                <div className="mt-6 flex gap-4 print:hidden">
                    <Button variant="outline" className="flex-1" onClick={() => router.push("/bills")}>
                        <FileText className="w-4 h-4 mr-2" />
                        {isHindi ? "सभी बिल देखें" : "View All Bills"}
                    </Button>
                    <Button variant="cta" className="flex-1" onClick={() => router.push("/dashboard")}>
                        {isHindi ? "डैशबोर्ड पर जाएं" : "Go to Dashboard"}
                    </Button>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
        }
      `}</style>
        </div>
    );
}
