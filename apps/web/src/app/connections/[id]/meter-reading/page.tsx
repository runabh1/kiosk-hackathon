"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Gauge,
    Camera,
    Check,
    Loader2,
    AlertCircle,
    Zap,
    Flame,
    Droplets,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
    id: string;
    serviceType: string;
    connectionNo: string;
    status: string;
    address: string;
    city: string;
    lastReading: number | null;
    lastReadingDate: string | null;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
};

export default function MeterReadingPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const connectionId = params.id as string;
    const isHindi = i18n.language === "hi";

    const { isAuthenticated } = useAuthStore();

    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [reading, setReading] = useState("");

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
            } else {
                setError("Connection not found");
            }
        } catch (err) {
            setError("Failed to load connection details");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const readingValue = parseFloat(reading);

        if (connection?.lastReading && readingValue < connection.lastReading) {
            setError(isHindi
                ? "नई रीडिंग पिछली रीडिंग से कम नहीं हो सकती"
                : "New reading cannot be less than previous reading"
            );
            setSubmitting(false);
            return;
        }

        try {
            const token = useAuthStore.getState().tokens?.accessToken;

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/connections/${connectionId}/meter-reading`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reading: readingValue }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit reading");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cta" />
            </div>
        );
    }

    if (!connection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "मीटर रीडिंग" : "Meter Reading"}
                        </h1>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-muted-foreground">{error || "Connection not found"}</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const svc = serviceIcons[connection.serviceType] || serviceIcons.ELECTRICITY;
    const Icon = svc.icon;

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
                            {isHindi ? "मीटर रीडिंग जमा करें" : "Submit Meter Reading"}
                        </h1>
                        <p className="text-white/70 text-sm">{connection.connectionNo}</p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            {isHindi ? "रीडिंग सफलतापूर्वक जमा!" : "Reading Submitted!"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {isHindi
                                ? "आपकी मीटर रीडिंग दर्ज कर ली गई है।"
                                : "Your meter reading has been recorded."}
                        </p>
                        <div className="bg-slate-100 rounded-xl py-4 px-6 inline-block mb-8">
                            <p className="text-3xl font-mono font-bold text-primary">
                                {reading} {connection.serviceType === "ELECTRICITY" ? "kWh" : "units"}
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={() => router.push("/dashboard")}>
                                {isHindi ? "डैशबोर्ड" : "Dashboard"}
                            </Button>
                            <Button variant="cta" onClick={() => router.back()}>
                                {isHindi ? "वापस जाएं" : "Go Back"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Connection Info */}
                        <div className="kiosk-card mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 ${svc.bg} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-7 h-7 ${svc.color}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-primary text-lg">{connection.serviceType}</p>
                                    <p className="text-sm text-muted-foreground">{connection.connectionNo}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {connection.address}, {connection.city}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Previous Reading */}
                        {connection.lastReading && (
                            <div className="kiosk-card mb-6 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {isHindi ? "पिछली रीडिंग" : "Previous Reading"}
                                        </p>
                                        <p className="text-2xl font-bold text-primary">
                                            {connection.lastReading} {connection.serviceType === "ELECTRICITY" ? "kWh" : "units"}
                                        </p>
                                    </div>
                                    {connection.lastReadingDate && (
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? "दिनांक" : "Date"}
                                            </p>
                                            <p className="font-medium text-primary">
                                                {new Date(connection.lastReadingDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reading Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="kiosk-card mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Gauge className="w-5 h-5 text-cta" />
                                    <h3 className="font-medium text-primary">
                                        {isHindi ? "नई मीटर रीडिंग" : "New Meter Reading"}
                                    </h3>
                                </div>

                                <div className="mb-4">
                                    <Label htmlFor="reading" className="text-base">
                                        {isHindi ? "वर्तमान मीटर रीडिंग दर्ज करें" : "Enter Current Meter Reading"} *
                                    </Label>
                                    <div className="relative mt-2">
                                        <Input
                                            id="reading"
                                            type="number"
                                            step="0.01"
                                            value={reading}
                                            onChange={(e) => setReading(e.target.value)}
                                            placeholder={connection.lastReading ? `> ${connection.lastReading}` : "0.00"}
                                            required
                                            className="text-2xl h-16 font-mono text-center"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {connection.serviceType === "ELECTRICITY" ? "kWh" : "units"}
                                        </span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Photo Capture (Placeholder) */}
                            <div className="kiosk-card mb-6 border-dashed border-2">
                                <button
                                    type="button"
                                    className="w-full py-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Camera className="w-10 h-10" />
                                    <span className="text-sm">
                                        {isHindi ? "मीटर फोटो अपलोड करें (वैकल्पिक)" : "Upload Meter Photo (Optional)"}
                                    </span>
                                </button>
                            </div>

                            <Button
                                type="submit"
                                variant="cta"
                                size="lg"
                                className="w-full"
                                disabled={submitting || !reading}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {isHindi ? "जमा कर रहा है..." : "Submitting..."}
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        {isHindi ? "रीडिंग जमा करें" : "Submit Reading"}
                                    </>
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
