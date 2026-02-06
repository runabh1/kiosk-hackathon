"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Zap,
  Flame,
  Droplets,
  Building2,
  FileText,
  Plus,
  Gauge,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
  id: string;
  connectionNumber: string;
  address: string;
  status: string;
  meterNumber?: string;
  lastReading?: number;
  lastReadingDate?: string;
}

interface Bill {
  id: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  billPeriod: string;
}

const SERVICE_CONFIG: Record<string, {
  name: string;
  nameHi: string;
  icon: any;
  color: string;
  bg: string;
  features: string[];
}> = {
  electricity: {
    name: "Electricity",
    nameHi: "बिजली",
    icon: Zap,
    color: "text-electricity",
    bg: "bg-electricity-light",
    features: ["Pay Bills", "View Usage", "Report Outage", "New Connection"],
  },
  gas: {
    name: "Gas",
    nameHi: "गैस",
    icon: Flame,
    color: "text-gas",
    bg: "bg-gas-light",
    features: ["Pay Bills", "Book Cylinder", "Report Leakage", "New Connection"],
  },
  water: {
    name: "Water",
    nameHi: "पानी",
    icon: Droplets,
    color: "text-water",
    bg: "bg-water-light",
    features: ["Pay Bills", "Report Leakage", "Quality Complaint", "New Connection"],
  },
  municipal: {
    name: "Municipal",
    nameHi: "नगरपालिका",
    icon: Building2,
    color: "text-municipal",
    bg: "bg-municipal-light",
    features: ["Waste Collection", "Streetlight Issue", "Road Repair", "Drainage"],
  },
};

export default function ServicePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const serviceType = params.type as string;
  const { isAuthenticated, tokens } = useAuthStore();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const config = SERVICE_CONFIG[serviceType?.toLowerCase()];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!config) {
      router.push("/dashboard");
      return;
    }
    fetchServiceData();
  }, [isAuthenticated, serviceType, config, router]);

  const fetchServiceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${tokens?.accessToken}` };

      // Fetch connections for this service
      const connRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connections?serviceType=${serviceType.toUpperCase()}`,
        { headers }
      );
      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.data || []);
      }

      // Fetch pending bills
      const billsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills?serviceType=${serviceType.toUpperCase()}&status=UNPAID`,
        { headers }
      );
      if (billsRes.ok) {
        const data = await billsRes.json();
        setPendingBills(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!config || !isAuthenticated) return null;

  const Icon = config.icon;
  const displayName = i18n.language === "hi" ? config.nameHi : config.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className={`${config.bg} py-6 px-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="hover:opacity-80">
              <ArrowLeft className={`w-6 h-6 ${config.color}`} />
            </Link>
            <div className={`w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div>
              <h1 className={`font-heading text-2xl font-bold ${config.color}`}>
                {displayName}
              </h1>
              <p className="text-slate-600 text-sm">Manage your {config.name.toLowerCase()} services</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Pending Bills Alert */}
        {pendingBills.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {pendingBills.length} pending bill{pendingBills.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-700">
                Total: ₹{pendingBills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
              </p>
            </div>
            <Link href="/bills">
              <Button size="sm" variant="cta">Pay Now</Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {config.features.map((feature, idx) => (
              <Link
                key={feature}
                href={
                  feature.includes("Bill") ? "/bills" :
                    feature.includes("Connection") ? "/connections/new" :
                      "/grievances/new"
                }
                className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent"
              >
                <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center mb-2`}>
                  {idx === 0 ? <FileText className={`w-5 h-5 ${config.color}`} /> :
                    idx === 1 ? <Gauge className={`w-5 h-5 ${config.color}`} /> :
                      idx === 2 ? <AlertCircle className={`w-5 h-5 ${config.color}`} /> :
                        <Plus className={`w-5 h-5 ${config.color}`} />}
                </div>
                <span className="text-sm font-medium text-primary">{feature}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* My Connections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg text-primary">My Connections</h2>
            <Link href="/connections/new">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Connection
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
          ) : connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="kiosk-card flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-primary">
                      Connection: {conn.connectionNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">{conn.address}</p>
                    {conn.meterNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Meter: {conn.meterNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {conn.lastReading && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Last Reading</p>
                        <p className="font-medium">{conn.lastReading} units</p>
                      </div>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${conn.status === "ACTIVE" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600"
                      }`}>
                      {conn.status}
                    </span>
                  </div>
                  {conn.status === "ACTIVE" && (
                    <Link href={`/connections/${conn.id}/meter-reading`}>
                      <Button variant="outline" size="sm">
                        <Gauge className="w-4 h-4 mr-2" />
                        Submit Reading
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon className={`w-12 h-12 mx-auto text-slate-300 mb-4`} />
              <p className="text-muted-foreground mb-4">No {config.name.toLowerCase()} connections yet</p>
              <Link href="/connections/new">
                <Button variant="cta">Apply for New Connection</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
