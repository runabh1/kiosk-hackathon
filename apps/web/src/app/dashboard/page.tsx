"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Flame,
  Droplets,
  Building2,
  FileText,
  MessageSquare,
  Bell,
  LogOut,
  User,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Sparkles,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { useAuthStore } from "@/lib/store/auth";

interface Bill {
  id: string;
  serviceType: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Connection {
  id: string;
  serviceType: string;
  connectionNumber: string;
  status: string;
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Redirect admins/staff away from citizen dashboard
    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      router.push("/admin");
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      const token = useAuthStore.getState().tokens?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch pending bills
      const billsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills?status=UNPAID`,
        { headers }
      );
      if (billsRes.ok) {
        const data = await billsRes.json();
        setPendingBills(data.data?.slice(0, 3) || []);
      }

      // Fetch connections
      const connRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connections`,
        { headers }
      );
      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
  };

  const quickLinks = [
    { id: "bills", name: t("actions.payBills"), icon: FileText, href: "/bills", count: pendingBills.length },
    { id: "connections", name: "My Connections", icon: Zap, href: "/connections" },
    { id: "grievances", name: t("actions.grievances"), icon: MessageSquare, href: "/grievances" },
    { id: "requests", name: "Service Requests", icon: Activity, href: "/service-requests" },
    { id: "notifications", name: t("actions.notifications"), icon: Bell, href: "/notifications" },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Welcome back,</p>
            <h1 className="font-heading text-xl font-bold">{user?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {(user?.role === "ADMIN" || user?.role === "STAFF") && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  Admin Panel
                </Button>
              </Link>
            )}
            <LanguageToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("auth.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Pending Bills Alert */}
        {pendingBills.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                You have {pendingBills.length} pending bill{pendingBills.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-700">
                Total: ₹{pendingBills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
              </p>
            </div>
            <Link href="/bills" className="ml-auto">
              <Button size="sm" variant="cta">
                Pay Now
              </Button>
            </Link>
          </div>
        )}

        {/* Smart Assistant - Prominent Feature */}
        <section className="mb-8">
          <Link href="/assistant">
            <div className="relative overflow-hidden bg-gradient-to-r from-cta via-cta to-primary rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">
                      {i18n.language === "hi"
                        ? "बताइए आप क्या करना चाहते हैं"
                        : "Tell me what you want to do"}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {i18n.language === "hi"
                        ? "मेनू छोड़ें • बस कहें • हम आपको ले जाएंगे"
                        : "Skip menus • Just say it • We'll take you there"}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-white/70 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium">
                    {i18n.language === "hi" ? "अभी आज़माएं" : "Try Now"}
                  </span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Quick Links */}
        <section className="mb-8">
          <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cta rounded-full"></span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="kiosk-card flex flex-col items-center text-center p-6 hover:border-cta border-2 border-transparent relative"
              >
                <link.icon className="w-8 h-8 text-cta mb-3" />
                <span className="font-medium text-primary">{link.name}</span>
                {link.count && link.count > 0 && (
                  <span className="absolute top-3 right-3 bg-cta text-white text-xs px-2 py-0.5 rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* My Connections */}
        <section className="mb-8">
          <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cta rounded-full"></span>
            My Service Connections
          </h2>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((conn) => {
                const svc = serviceIcons[conn.serviceType] || serviceIcons.ELECTRICITY;
                const Icon = svc.icon;
                return (
                  <Link
                    key={conn.id}
                    href={`/services/${conn.serviceType.toLowerCase()}`}
                    className="kiosk-card flex items-center gap-4 hover:border-cta border-2 border-transparent"
                  >
                    <div className={`w-12 h-12 ${svc.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${svc.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{conn.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        Connection: {conn.connectionNumber}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${conn.status === "ACTIVE" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600"
                      }`}>
                      {conn.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                );
              })}
              {/* Add New Connection Button */}
              <Link
                href="/connections/new"
                className="kiosk-card flex items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-200 hover:border-cta hover:bg-cta/5 transition-colors"
              >
                <div className="w-10 h-10 bg-cta/10 rounded-full flex items-center justify-center">
                  <span className="text-cta text-2xl font-light">+</span>
                </div>
                <span className="font-medium text-primary">Apply for New Connection</span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active connections yet</p>
              <Link href="/connections/new">
                <Button variant="cta">Apply for New Connection</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Recent Bills */}
        {pendingBills.length > 0 && (
          <section>
            <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-cta rounded-full"></span>
              Pending Bills
            </h2>
            <div className="space-y-3">
              {pendingBills.map((bill) => {
                const svc = serviceIcons[bill.serviceType] || serviceIcons.ELECTRICITY;
                const Icon = svc.icon;
                return (
                  <div
                    key={bill.id}
                    className="kiosk-card flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 ${svc.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${svc.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{bill.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-lg">₹{bill.amount.toLocaleString()}</p>
                    <Link href={`/bills/${bill.id}/pay`}>
                      <Button size="sm" variant="cta">Pay</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
