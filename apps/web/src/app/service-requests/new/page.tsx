"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CheckCircle2,
    Zap,
    Flame,
    Droplets,
    Building2,
    User,
    Activity,
    Power,
    Gauge,
    MapPin,
    FileText,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/auth";

const requestTypes = [
    { id: "NAME_CHANGE", icon: User, name: "Name Change / Ownership Transfer", nameHi: "नाम परिवर्तन / स्वामित्व हस्तांतरण", category: "IDENTITY" },
    { id: "LOAD_CHANGE", icon: Activity, name: "Load Enhancement / Reduction", nameHi: "भार बढ़ाना / घटाना", category: "LOAD" },
    { id: "DISCONNECTION", icon: Power, name: "Permanent Disconnection", nameHi: "स्थायी विच्छेदन", category: "TECHNICAL" },
    { id: "METER_TEST", icon: Gauge, name: "Meter Testing Request", nameHi: "मीटर परीक्षण अनुरोध", category: "TECHNICAL" },
    { id: "ADDRESS_UPDATE", icon: MapPin, name: "Billing Address Update", nameHi: "बिलिंग पता अपडेट", category: "IDENTITY" },
];

interface Connection {
    id: string;
    connectionNo: string;
    serviceType: string;
    address: string;
}

export default function NewServiceRequestPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isHindi = i18n.language === "hi";

    const { isAuthenticated, tokens, user } = useAuthStore();

    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedType, setSelectedType] = useState<string>(searchParams.get("type") || "");
    const [selectedConnection, setSelectedConnection] = useState<string>(searchParams.get("connectionId") || "");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                // If only one connection, select it by default
                if (data.data?.length === 1 && !selectedConnection) {
                    setSelectedConnection(data.data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch connections", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType || !description) {
            setError(isHindi ? "कृपया सभी आवश्यक जानकारी भरें।" : "Please fill in all required fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/service-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    type: selectedType,
                    connectionId: selectedConnection || undefined,
                    description,
                    data: {
                        submitted_at: new Date().toISOString(),
                        preferred_contact: user?.phone,
                    },
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/service-requests"), 3000);
            } else {
                const data = await res.json();
                throw new Error(data.error || "Submission failed");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full kiosk-card text-center py-12">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">
                        {isHindi ? "अनुरोध सफलतापूर्वक जमा!" : "Request Submitted Successfully!"}
                    </h1>
                    <p className="text-slate-600 mb-8">
                        {isHindi
                            ? "आपका सेवा अनुरोध दर्ज कर लिया गया है। हम जल्द ही आपसे संपर्क करेंगे।"
                            : "Your service request has been registered. We will contact you soon."}
                    </p>
                    <Link href="/service-requests">
                        <Button variant="cta" className="w-full">
                            {isHindi ? "अनुरोध देखें" : "View My Requests"}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-primary text-white py-6 px-6">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link href="/dashboard" className="hover:opacity-80">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold kiosk-header">
                        {isHindi ? "नया सेवा अनुरोध" : "New Service Request"}
                    </h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 -mt-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Request Type Selection */}
                    <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cta" />
                            {isHindi ? "अनुरोध का प्रकार चुनें" : "Select Request Type"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {requestTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setSelectedType(type.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                            ? "border-cta bg-cta/5 ring-1 ring-cta"
                                            : "border-slate-100 hover:border-slate-200"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-cta text-white" : "bg-slate-100 text-slate-500"
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary text-sm">
                                                {isHindi ? type.nameHi : type.name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Connection Selection */}
                    <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cta" />
                            {isHindi ? "कनेक्शन चुनें" : "Select Connection"}
                        </h2>
                        <div className="space-y-3">
                            {connections.length > 0 ? (
                                connections.map((conn) => (
                                    <button
                                        key={conn.id}
                                        type="button"
                                        onClick={() => setSelectedConnection(conn.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedConnection === conn.id
                                            ? "border-cta bg-cta/5 ring-1 ring-cta"
                                            : "border-slate-100 hover:border-slate-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm text-primary">{conn.connectionNo}</p>
                                                <p className="text-xs text-slate-500">{conn.serviceType}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedConnection === conn.id ? "border-cta bg-cta" : "border-slate-200"
                                            }`}>
                                            {selectedConnection === conn.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-4 italic">
                                    {isHindi ? "कोई सक्रिय कनेक्शन नहीं मिला" : "No active connections found"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-primary mb-4">
                            {isHindi ? "अनुरोध विवरण" : "Request Details"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {isHindi ? "विवरण (कम से कम 10 शब्द)" : "Description (min 10 characters)"}
                                </label>
                                <Textarea
                                    rows={4}
                                    placeholder={isHindi ? "कृपया अपने अनुरोध का विस्तार से वर्णन करें..." : "Describe your request in detail..."}
                                    value={description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                    className="resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="cta"
                                className="w-full h-12 text-lg font-bold"
                                disabled={loading || connections.length === 0}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {isHindi ? "भेजा जा रहा है..." : "Submitting..."}
                                    </>
                                ) : (
                                    isHindi ? "अनुरोध जमा करें" : "Submit Request"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
