"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Plus,
    Zap,
    Flame,
    Droplets,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    ChevronRight,
    FileText,
    Download,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
    id: string;
    connectionNo: string;
    serviceType: string;
    status: string;
    address: string;
    city: string;
    connectionDate?: string;
    meterNo?: string;
}

const serviceDetails: Record<string, { icon: any, color: string, bg: string }> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

export default function MyConnectionsPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { isAuthenticated, tokens } = useAuthStore();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchConnections();
    }, [isAuthenticated, router]);

    const fetchConnections = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connections`, {
                headers: { Authorization: `Bearer ${tokens?.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnections(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch connections", err);
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
                            {isHindi ? "मेरे कनेक्शन" : "My Connections"}
                        </h1>
                    </div>
                    <Link href="/connections/new">
                        <Button variant="cta" size="sm" className="font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            {isHindi ? "नया कनेक्शन" : "New Connection"}
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>{isHindi ? "लोड हो रहा है..." : "Loading connections..."}</p>
                    </div>
                ) : connections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {connections.map((conn) => {
                            const svc = serviceDetails[conn.serviceType] || serviceDetails.ELECTRICITY;
                            const Icon = svc.icon;
                            const isActive = conn.status === "ACTIVE";

                            return (
                                <div key={conn.id} className="kiosk-card bg-white p-6 border-2 border-transparent hover:border-cta/20 group">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 ${svc.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <Icon className={`w-8 h-8 ${svc.color}`} />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isActive ? "bg-success/10 text-success border-success/20" : "bg-slate-100 text-slate-600 border-slate-200"
                                            }`}>
                                            {conn.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-primary leading-tight lowercase first-letter:uppercase">
                                                {conn.serviceType.toLowerCase()} Service
                                            </h3>
                                            <p className="text-sm font-mono text-slate-500 mt-1">#{conn.connectionNo}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{conn.address}, {conn.city}</span>
                                        </div>

                                        <div className="pt-4 border-t flex items-center justify-between gap-2">
                                            <Link href={`/services/${conn.serviceType.toLowerCase()}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                                                    Manage Service
                                                </Button>
                                            </Link>

                                            {isActive && (
                                                <Button
                                                    variant="cta"
                                                    size="sm"
                                                    className="px-3"
                                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connections/${conn.id}/sanction-letter?lang=${isHindi ? 'hi' : 'en'}`, '_blank')}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">
                            {isHindi ? "कोई कनेक्शन नहीं मिला" : "No connections found"}
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                            {isHindi
                                ? "आपने अभी तक किसी सेवा के लिए आवेदन नहीं किया है।"
                                : "You haven't applied for any utility services yet."}
                        </p>
                        <Link href="/connections/new">
                            <Button variant="cta" className="font-bold">
                                {isHindi ? "नया कनेक्शन आवेदन" : "Apply for New Connection"}
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
