"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    Zap,
    Flame,
    Droplets,
    Building2,
    MapPin,
    Check,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";

const serviceTypes = [
    {
        id: "ELECTRICITY",
        name: "Electricity",
        nameHi: "बिजली",
        icon: Zap,
        color: "text-electricity",
        bg: "bg-electricity-light",
        borderColor: "border-electricity",
        description: "New electricity connection",
        descriptionHi: "नया बिजली कनेक्शन",
    },
    {
        id: "GAS",
        name: "Gas (PNG)",
        nameHi: "गैस (पीएनजी)",
        icon: Flame,
        color: "text-gas",
        bg: "bg-gas-light",
        borderColor: "border-gas",
        description: "Piped natural gas connection",
        descriptionHi: "पाइप्ड प्राकृतिक गैस कनेक्शन",
    },
    {
        id: "WATER",
        name: "Water Supply",
        nameHi: "जलापूर्ति",
        icon: Droplets,
        color: "text-water",
        bg: "bg-water-light",
        borderColor: "border-water",
        description: "Municipal water connection",
        descriptionHi: "नगरपालिका जल कनेक्शन",
    },
    {
        id: "MUNICIPAL",
        name: "Municipal Services",
        nameHi: "नगरपालिका सेवाएं",
        icon: Building2,
        color: "text-municipal",
        bg: "bg-municipal-light",
        borderColor: "border-municipal",
        description: "Waste collection & civic services",
        descriptionHi: "अपशिष्ट संग्रह एवं नागरिक सेवाएँ",
    },
];

export default function NewConnectionPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const isHindi = i18n.language === "hi";

    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "Assam",
        pincode: user?.pincode || "",
        sanctionedLoad: "",
    });

    const handleServiceSelect = (serviceId: string) => {
        setSelectedService(serviceId);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = useAuthStore.getState().tokens?.accessToken;

            const body: any = {
                serviceType: selectedService,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
            };

            if (selectedService === "ELECTRICITY" && formData.sanctionedLoad) {
                body.sanctionedLoad = parseFloat(formData.sanctionedLoad);
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/connections/apply`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit application");
            }

            setSuccess(data.data.connectionNo);
            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        router.push("/auth/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-primary text-white py-4 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => (step > 1 && step < 3 ? setStep(step - 1) : router.back())}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "नया कनेक्शन आवेदन" : "New Connection Application"}
                        </h1>
                        <p className="text-white/70 text-sm">
                            {isHindi ? `चरण ${step} का 3` : `Step ${step} of 3`}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-cta" : "bg-slate-200"
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1: Select Service */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-medium text-primary mb-4">
                            {isHindi ? "सेवा प्रकार चुनें" : "Select Service Type"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serviceTypes.map((service) => {
                                const Icon = service.icon;
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service.id)}
                                        className={`kiosk-card flex items-start gap-4 text-left hover:border-cta border-2 border-transparent transition-all`}
                                    >
                                        <div className={`w-14 h-14 ${service.bg} rounded-xl flex items-center justify-center`}>
                                            <Icon className={`w-7 h-7 ${service.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-primary text-lg">
                                                {isHindi ? service.nameHi : service.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isHindi ? service.descriptionHi : service.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Address Details */}
                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <div className="kiosk-card mb-4">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                {(() => {
                                    const svc = serviceTypes.find((s) => s.id === selectedService);
                                    if (!svc) return null;
                                    const Icon = svc.icon;
                                    return (
                                        <>
                                            <div className={`w-10 h-10 ${svc.bg} rounded-lg flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${svc.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary">
                                                    {isHindi ? svc.nameHi : svc.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isHindi ? "नया कनेक्शन" : "New Connection"}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <h3 className="font-medium text-primary mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {isHindi ? "कनेक्शन पता" : "Connection Address"}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="address">
                                        {isHindi ? "पूरा पता" : "Full Address"} *
                                    </Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={isHindi ? "घर/फ्लैट नंबर, गली, क्षेत्र" : "House/Flat No, Street, Area"}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">{isHindi ? "शहर" : "City"} *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder={isHindi ? "शहर का नाम" : "City name"}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state">{isHindi ? "राज्य" : "State"} *</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="pincode">{isHindi ? "पिनकोड" : "PIN Code"} *</Label>
                                        <Input
                                            id="pincode"
                                            value={formData.pincode}
                                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                            placeholder="781001"
                                            pattern="\d{6}"
                                            maxLength={6}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    {selectedService === "ELECTRICITY" && (
                                        <div>
                                            <Label htmlFor="load">
                                                {isHindi ? "स्वीकृत भार (kW)" : "Sanctioned Load (kW)"}
                                            </Label>
                                            <Input
                                                id="load"
                                                type="number"
                                                step="0.1"
                                                value={formData.sanctionedLoad}
                                                onChange={(e) => setFormData({ ...formData, sanctionedLoad: e.target.value })}
                                                placeholder="2.0"
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="cta"
                            size="lg"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {isHindi ? "जमा कर रहा है..." : "Submitting..."}
                                </>
                            ) : (
                                isHindi ? "आवेदन जमा करें" : "Submit Application"
                            )}
                        </Button>
                    </form>
                )}

                {/* Step 3: Success */}
                {step === 3 && success && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            {isHindi ? "आवेदन सफलतापूर्वक जमा!" : "Application Submitted!"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {isHindi
                                ? "आपका कनेक्शन आवेदन संख्या है:"
                                : "Your connection application number is:"}
                        </p>
                        <div className="bg-slate-100 rounded-xl py-4 px-6 inline-block mb-6">
                            <p className="text-2xl font-mono font-bold text-primary">{success}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-8">
                            {isHindi
                                ? "आपको जल्द ही SMS/ईमेल के माध्यम से अपडेट प्राप्त होगा।"
                                : "You will receive updates via SMS/Email shortly."}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={() => router.push("/dashboard")}>
                                {isHindi ? "डैशबोर्ड पर जाएं" : "Go to Dashboard"}
                            </Button>
                            <Button variant="cta" onClick={() => {
                                setStep(1);
                                setSelectedService("");
                                setSuccess(null);
                            }}>
                                {isHindi ? "नया आवेदन" : "New Application"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
