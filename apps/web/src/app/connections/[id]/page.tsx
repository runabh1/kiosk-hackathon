"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Zap,
    Flame,
    Droplets,
    Building2,
    FileText,
    Gauge,
    AlertCircle,
    Calendar,
    MapPin,
    Phone,
    Hash,
    Activity,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
    id: string;
    serviceType: string;
    connectionNo: string;
    meterNo: string | null;
    status: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    connectionDate: string | null;
    sanctionedLoad: number | null;
    lastReading: number | null;
    lastReadingDate: string | null;
    bills: Array<{
        id: string;
        billNo: string;
        amount: number;
        status: string;
        dueDate: string;
    }>;
    meterReadings: Array<{
        id: string;
        reading: number;
        readingDate: string;
        submittedBy: string;
    }>;
    grievances: Array<{
        id: string;
        ticketNo: string;
        subject: string;
        status: string;
    }>;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light", gradient: "from-electricity/20 to-electricity/5" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light", gradient: "from-gas/20 to-gas/5" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light", gradient: "from-water/20 to-water/5" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light", gradient: "from-municipal/20 to-municipal/5" },
};

export default function ConnectionDetailsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const connectionId = params.id as string;
    const isHindi = i18n.language === "hi";

    const { isAuthenticated } = useAuthStore();

    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchConnection();
    }, [isAuthenticated, connectionId, router]);

    const fetchConnection = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/connections/${connectionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setConnection(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch connection:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!connection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-primary text-white py-4 px-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="font-heading text-xl font-bold">Connection Details</h1>
                    </div>
                </header>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Connection not found</p>
                </div>
            </div>
        );
    }

    const svc = serviceIcons[connection.serviceType] || serviceIcons.ELECTRICITY;
    const Icon = svc.icon;
    const unpaidBills = connection.bills.filter(b => b.status === "UNPAID" || b.status === "OVERDUE");

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className={`bg-gradient-to-r ${svc.gradient} py-6 px-6`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-white/20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className={`w-14 h-14 ${svc.bg} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-8 h-8 ${svc.color}`} />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-primary">
                                {connection.serviceType}
                            </h1>
                            <p className="text-muted-foreground font-mono">{connection.connectionNo}</p>
                        </div>
                        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${connection.status === "ACTIVE" ? "bg-success/20 text-success" :
                                connection.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                    "bg-slate-200 text-slate-600"
                            }`}>
                            {connection.status}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Quick Actions */}
                {connection.status === "ACTIVE" && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <Link href={`/connections/${connectionId}/meter-reading`}>
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                                <Gauge className={`w-6 h-6 ${svc.color}`} />
                                <span className="text-xs">{isHindi ? "मीटर रीडिंग" : "Submit Reading"}</span>
                            </Button>
                        </Link>
                        <Link href="/bills">
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 relative">
                                <FileText className={`w-6 h-6 ${svc.color}`} />
                                <span className="text-xs">{isHindi ? "बिल देखें" : "View Bills"}</span>
                                {unpaidBills.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {unpaidBills.length}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href={`/grievances/new?service=${connection.serviceType}`}>
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                                <AlertCircle className={`w-6 h-6 ${svc.color}`} />
                                <span className="text-xs">{isHindi ? "शिकायत दर्ज" : "Report Issue"}</span>
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Connection Details */}
                <div className="kiosk-card mb-6">
                    <h3 className="font-medium text-primary mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        {isHindi ? "कनेक्शन विवरण" : "Connection Details"}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">{isHindi ? "कनेक्शन संख्या" : "Connection No"}</span>
                            <span className="font-mono font-medium">{connection.connectionNo}</span>
                        </div>
                        {connection.meterNo && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">{isHindi ? "मीटर संख्या" : "Meter No"}</span>
                                <span className="font-mono">{connection.meterNo}</span>
                            </div>
                        )}
                        {connection.sanctionedLoad && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">{isHindi ? "स्वीकृत भार" : "Sanctioned Load"}</span>
                                <span>{connection.sanctionedLoad} kW</span>
                            </div>
                        )}
                        {connection.connectionDate && (
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">{isHindi ? "कनेक्शन दिनांक" : "Connection Date"}</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(connection.connectionDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div className="kiosk-card mb-6">
                    <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {isHindi ? "सेवा पता" : "Service Address"}
                    </h3>
                    <p className="text-muted-foreground">
                        {connection.address}<br />
                        {connection.city}, {connection.state} - {connection.pincode}
                    </p>
                </div>

                {/* Last Reading */}
                {connection.lastReading && (
                    <div className="kiosk-card mb-6">
                        <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {isHindi ? "अंतिम मीटर रीडिंग" : "Last Meter Reading"}
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-primary">
                                    {connection.lastReading}
                                    <span className="text-base font-normal text-muted-foreground ml-1">
                                        {connection.serviceType === "ELECTRICITY" ? "kWh" : "units"}
                                    </span>
                                </p>
                                {connection.lastReadingDate && (
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(connection.lastReadingDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <Link href={`/connections/${connectionId}/meter-reading`}>
                                <Button variant="cta" size="sm">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    {isHindi ? "नई रीडिंग" : "New Reading"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Recent Bills */}
                {connection.bills.length > 0 && (
                    <div className="kiosk-card mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-primary flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {isHindi ? "हालिया बिल" : "Recent Bills"}
                            </h3>
                            <Link href="/bills" className="text-sm text-cta hover:underline">
                                {isHindi ? "सभी देखें" : "View All"}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {connection.bills.slice(0, 3).map((bill) => (
                                <div key={bill.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div>
                                        <p className="font-mono text-sm">{bill.billNo}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">₹{bill.amount.toLocaleString()}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${bill.status === "PAID" ? "bg-success/10 text-success" :
                                                bill.status === "OVERDUE" ? "bg-destructive/10 text-destructive" :
                                                    "bg-amber-100 text-amber-700"
                                            }`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Grievances */}
                {connection.grievances.length > 0 && (
                    <div className="kiosk-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-primary flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {isHindi ? "शिकायतें" : "Grievances"}
                            </h3>
                            <Link href="/grievances" className="text-sm text-cta hover:underline">
                                {isHindi ? "सभी देखें" : "View All"}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {connection.grievances.map((grv) => (
                                <Link
                                    key={grv.id}
                                    href={`/grievances/${grv.id}`}
                                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono text-xs text-muted-foreground">{grv.ticketNo}</p>
                                            <p className="text-sm font-medium">{grv.subject}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${grv.status === "RESOLVED" ? "bg-success/10 text-success" :
                                                grv.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                                                    "bg-amber-100 text-amber-700"
                                            }`}>
                                            {grv.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
