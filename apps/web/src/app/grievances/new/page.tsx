"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Zap,
  Flame,
  Droplets,
  Building2,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/store/auth";

const CATEGORIES = {
  ELECTRICITY: [
    "Billing Error",
    "Power Outage",
    "Meter Issue",
    "Connection Request",
    "Voltage Fluctuation",
    "Other",
  ],
  GAS: [
    "Billing Issue",
    "Gas Leakage",
    "Supply Problem",
    "Cylinder Request",
    "Meter Reading",
    "Other",
  ],
  WATER: [
    "Billing Issue",
    "Low Pressure",
    "Water Quality",
    "Leakage",
    "New Connection",
    "Other",
  ],
  MUNICIPAL: [
    "Waste Collection",
    "Streetlight",
    "Road Issue",
    "Drainage",
    "Public Health",
    "Other",
  ],
};

const PRIORITIES = [
  { id: "LOW", name: "Low", color: "bg-slate-100 text-slate-600" },
  { id: "MEDIUM", name: "Medium", color: "bg-amber-100 text-amber-700" },
  { id: "HIGH", name: "High", color: "bg-orange-100 text-orange-700" },
  { id: "URGENT", name: "Urgent", color: "bg-red-100 text-red-700" },
];

export default function NewGrievancePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, tokens } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceType: "",
    category: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
    address: "",
    connectionNumber: "",
  });

  const serviceTypes = [
    { id: "ELECTRICITY", name: "Electricity", icon: Zap, color: "bg-electricity-light text-electricity" },
    { id: "GAS", name: "Gas", icon: Flame, color: "bg-gas-light text-gas" },
    { id: "WATER", name: "Water", icon: Droplets, color: "bg-water-light text-water" },
    { id: "MUNICIPAL", name: "Municipal", icon: Building2, color: "bg-municipal-light text-municipal" },
  ];

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceType || !formData.category || !formData.subject || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/grievances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccess(data.data.ticketNo);
        toast({
          title: "Grievance Submitted!",
          description: `Ticket #${data.data.ticketNo} created`,
        });
      } else {
        throw new Error(data.message || data.error || "Submission failed");
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please check your input and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Return null while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <header className="bg-success text-white py-4 px-6">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h1 className="font-heading text-xl font-bold">Grievance Submitted!</h1>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-kiosk p-8 text-center mb-6 w-full">
            <p className="text-muted-foreground text-sm mb-2">Your Ticket Number</p>
            <p className="font-mono text-3xl text-primary font-bold mb-4">#{success}</p>
            <p className="text-sm text-muted-foreground">
              Save this number to track your complaint status
            </p>
          </div>

          <div className="space-y-3 w-full">
            <Link href={`/grievances`}>
              <Button variant="cta" size="xl" className="w-full">
                View My Grievances
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="xl" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/grievances" className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold">{t("grievance.newGrievance")}</h1>
            <p className="text-white/80 text-sm">File a new complaint</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Service Type */}
        <div>
          <Label className="text-base mb-3 block">Select Service *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {serviceTypes.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setFormData({ ...formData, serviceType: svc.id, category: "" })}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${formData.serviceType === svc.id
                  ? "border-cta bg-cta/5"
                  : "border-slate-200 hover:border-cta/50"
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${svc.color}`}>
                  <svc.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{svc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        {formData.serviceType && (
          <div>
            <Label className="text-base mb-3 block">{t("grievance.category")} *</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES[formData.serviceType as keyof typeof CATEGORIES]?.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${formData.category === cat
                    ? "bg-cta text-white"
                    : "bg-white border border-slate-200 hover:border-cta"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Priority */}
        <div>
          <Label className="text-base mb-3 block">{t("grievance.priority")}</Label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setFormData({ ...formData, priority: p.id })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${formData.priority === p.id
                  ? `${p.color} ring-2 ring-offset-2 ring-cta/30`
                  : "bg-white border border-slate-200 hover:border-cta"
                  }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="subject" className="text-base">
            {t("grievance.subject")} *
          </Label>
          <Input
            id="subject"
            placeholder="Brief summary of your issue"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="mt-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-base">
            {t("grievance.description")} *
          </Label>
          <textarea
            id="description"
            placeholder="Describe your issue in detail (minimum 10 characters)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-2 w-full h-32 px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-cta focus:ring-2 focus:ring-cta/20 outline-none transition-colors resize-none"
            required
            minLength={10}
          />
          <p className={`text-xs mt-1 ${formData.description.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
            {formData.description.length}/10 characters minimum
          </p>
        </div>

        {/* Connection Number (Optional) */}
        <div>
          <Label htmlFor="connectionNumber" className="text-base">
            Connection Number (Optional)
          </Label>
          <Input
            id="connectionNumber"
            placeholder="Enter if applicable"
            value={formData.connectionNumber}
            onChange={(e) => setFormData({ ...formData, connectionNumber: e.target.value })}
            className="mt-2"
          />
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-base">
            Location/Address
          </Label>
          <Input
            id="address"
            placeholder="Where is the issue located?"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="mt-2"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="cta"
          size="xl"
          className="w-full"
          disabled={loading || !formData.serviceType || !formData.category || !formData.subject || formData.description.length < 10}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            t("grievance.submit")
          )}
        </Button>
      </form>
    </div>
  );
}
