"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, KeyRound, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { useAuthStore } from "@/lib/store/auth";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit Indian phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("otp");
        if (data.otp) setMockOtp(data.otp);
        toast({
          title: "OTP Sent",
          description: `OTP sent to +91 ${phone}`,
        });
      } else {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    // Move to details step (OTP verified during final registration)
    setStep("details");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 2) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          ...formData,
          language: i18n.language,
        }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data.user, data.data.tokens);
        toast({
          title: "Registration Successful!",
          description: `Welcome, ${data.data.user.name}!`,
          variant: "success",
        });
        if (data.data.user.role === "ADMIN" || data.data.user.role === "STAFF") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span>{t("common.back")}</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl text-primary mb-2">
              {t("auth.register")}
            </h1>
            <p className="text-muted-foreground">
              {step === "phone" && t("auth.enterPhone")}
              {step === "otp" && t("auth.enterOtp")}
              {step === "details" && "Enter your details"}
            </p>

            {/* Step indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {["phone", "otp", "details"].map((s, i) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${step === s ? "bg-cta" : i < ["phone", "otp", "details"].indexOf(step) ? "bg-success" : "bg-slate-200"
                    }`}
                />
              ))}
            </div>
          </div>

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">{t("auth.phone")}</Label>
                <div className="flex gap-3">
                  <div className="flex items-center px-4 bg-slate-100 rounded-lg text-muted-foreground">+91</div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <Button type="submit" size="xl" variant="cta" className="w-full" disabled={loading || phone.length !== 10}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
                {t("auth.sendOtp")}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-base">{t("auth.otp")}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  inputMode="numeric"
                />
                {mockOtp && (
                  <p className="text-sm text-muted-foreground text-center">
                    [Dev] Mock OTP: <code className="bg-slate-100 px-2 py-1 rounded">{mockOtp}</code>
                  </p>
                )}
              </div>
              <Button type="submit" size="xl" variant="cta" className="w-full" disabled={otp.length !== 6}>
                <KeyRound className="w-5 h-5 mr-2" />
                {t("common.next")}
              </Button>
            </form>
          )}

          {step === "details" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">{t("auth.name")} *</Label>
                <Input
                  id="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-base">Address</Label>
                <Input
                  id="address"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-base">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-base">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="123456"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <Button type="submit" size="xl" variant="cta" className="w-full mt-6" disabled={loading || !formData.name}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <User className="w-5 h-5 mr-2" />}
                {t("common.submit")}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t("auth.existingUser")}{" "}
              <Link href="/auth/login" className="text-cta hover:underline font-medium">
                {t("auth.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
