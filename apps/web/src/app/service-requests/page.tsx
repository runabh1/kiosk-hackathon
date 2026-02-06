"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowRight,
    Activity,
    FileText,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface ServiceRequest {
    id: string;
    type: string;
    status: string;
    description: string;
    createdAt: string;
    connection?: {
        connectionNo: string;
        serviceType: string;
    };
}

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    COMPLETED: "bg-success/10 text-success border-success/20",
};

export default function ServiceRequestsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { isAuthenticated, tokens } = useAuthStore();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchRequests();
    }, [isAuthenticated, router]);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/service-requests`, {
                headers: { Authorization: `Bearer ${tokens?.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-primary text-white py-6 px-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold kiosk-header">
                            {isHindi ? "मेरे सेवा अनुरोध" : "My Service Requests"}
                        </h1>
                    </div>
                    <Link href="/service-requests/new">
                        <Button variant="cta" size="sm" className="font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            {isHindi ? "नया अनुरोध" : "New Request"}
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>{isHindi ? "लोड हो रहा है..." : "Loading requests..."}</p>
                    </div>
                ) : requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <div key={req.id} className="kiosk-card bg-white border-2 border-transparent hover:border-cta/20 p-5 group transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-primary group-hover:text-cta transition-colors">
                                                {req.type.replace('_', ' ')}
                                            </h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(req.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[req.status] || "bg-slate-100 text-slate-600"}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-600">
                                                {req.connection ? req.connection.connectionNo : (isHindi ? "सामान्य अनुरोध" : "General Request")}
                                            </span>
                                        </div>
                                        {req.connection && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border">
                                                {req.connection.serviceType}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        {req.description}
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t flex items-center justify-end gap-3">
                                    {req.status === 'COMPLETED' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/service-requests/${req.id}/certificate?lang=${isHindi ? 'hi' : 'en'}`, '_blank')}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            {isHindi ? "प्रमाण पत्र" : "Certificate"}
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="text-cta hover:text-cta hover:bg-cta/5">
                                        {isHindi ? "विवरण देखें" : "View Details"}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">
                            {isHindi ? "कोई अनुरोध नहीं मिला" : "No requests yet"}
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                            {isHindi
                                ? "आपने अभी तक कोई सेवा अनुरोध जमा नहीं किया है।"
                                : "You haven't submitted any service requests yet."}
                        </p>
                        <Link href="/service-requests/new">
                            <Button variant="cta" className="font-bold">
                                {isHindi ? "पहला अनुरोध शुरू करें" : "Start First Request"}
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
