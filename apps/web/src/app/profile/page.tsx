"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  ChevronLeft,
  Check,
  Zap,
  Flame,
  Droplets,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
  id: string;
  serviceType: string;
  connectionNo: string;
  status: string;
  address: string;
  city: string;
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(user?.language || "en");

  const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchConnections();
  }, [isAuthenticated, router]);

  const fetchConnections = async () => {
    try {
      const token = useAuthStore.getState().tokens?.accessToken;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/connections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setConnections(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    // In production, save to backend
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!isAuthenticated || !user) return null;

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
          <h1 className="font-heading text-xl font-bold">My Profile</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <div className="kiosk-card mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-cta to-cta/70 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary">{user.name}</h2>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 {user.phone}</span>
                </div>
                {user.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <section className="mb-6">
          <h3 className="font-heading text-lg text-primary mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language / भाषा
          </h3>
          <div className="kiosk-card">
            <div className="flex gap-4">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 py-4 rounded-xl font-medium transition-all ${language === "en"
                    ? "bg-cta text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <span className="text-lg">🇬🇧</span>
                <p className="mt-1">English</p>
              </button>
              <button
                onClick={() => handleLanguageChange("hi")}
                className={`flex-1 py-4 rounded-xl font-medium transition-all ${language === "hi"
                    ? "bg-cta text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <span className="text-lg">🇮🇳</span>
                <p className="mt-1">हिंदी</p>
              </button>
            </div>
          </div>
        </section>

        {/* My Connections */}
        <section className="mb-6">
          <h3 className="font-heading text-lg text-primary mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            My Service Connections
          </h3>

          {loading ? (
            <div className="kiosk-card text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((conn) => {
                const svc = serviceIcons[conn.serviceType] || serviceIcons.ELECTRICITY;
                const Icon = svc.icon;
                return (
                  <div key={conn.id} className="kiosk-card flex items-center gap-4">
                    <div className={`w-12 h-12 ${svc.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${svc.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{conn.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        {conn.connectionNo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conn.address}, {conn.city}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${conn.status === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : conn.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                      {conn.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kiosk-card text-center py-8">
              <p className="text-muted-foreground mb-4">No connections yet</p>
              <Button variant="cta" onClick={() => router.push("/connections/new")}>
                Apply for New Connection
              </Button>
            </div>
          )}
        </section>

        {/* Account Actions */}
        <section>
          <div className="kiosk-card">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
