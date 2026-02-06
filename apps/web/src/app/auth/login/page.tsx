"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { useAuthStore } from "@/lib/store/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { login, isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState<string | null>(null);

  // No auto-redirect here to allow users to switch accounts/roles easily
  // while testing. Only redirect after explicit login or if manually navigating.
  useEffect(() => {
    // Optional: Only redirect if we're sure we want to block the login page
    // For now, keeping it open for better UX during role-switching
  }, []);

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
        // For development - show mock OTP
        if (data.otp) {
          setMockOtp(data.otp);
        }
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
        description: error.message || "Failed to send OTP",
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

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (data.success) {
        const user = data.data.user;
        login(user, data.data.tokens);
        toast({
          title: "Welcome!",
          description: `Logged in as ${user.name}`,
          variant: "success",
        });

        // Redirect based on role - Keep it simple
        if (user.role === "ADMIN" || user.role === "STAFF") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid OTP or user not registered",
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
              {t("auth.login")}
            </h1>
            <p className="text-muted-foreground">
              {step === "phone" ? t("auth.enterPhone") : t("auth.enterOtp")}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">
                  {t("auth.phone")}
                </Label>
                <div className="flex gap-3">
                  <div className="flex items-center px-4 bg-slate-100 rounded-lg text-muted-foreground">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="xl"
                variant="cta"
                className="w-full"
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Phone className="w-5 h-5 mr-2" />
                )}
                {t("auth.sendOtp")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-base">
                  {t("auth.otp")}
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
                {mockOtp && (
                  <p className="text-sm text-muted-foreground text-center">
                    [Dev] Mock OTP: <code className="bg-slate-100 px-2 py-1 rounded">{mockOtp}</code>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="xl"
                variant="cta"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-5 h-5 mr-2" />
                )}
                {t("auth.verifyOtp")}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setMockOtp(null);
                }}
                className="w-full text-center text-cta hover:underline cursor-pointer"
              >
                Change phone number
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t("auth.newUser")}{" "}
              <Link href="/auth/register" className="text-cta hover:underline font-medium">
                {t("auth.register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
