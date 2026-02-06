"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Grievance {
  id: string;
  ticketNumber: string;
  serviceType: string;
  category: string;
  subject: string;
  status: "SUBMITTED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function GrievancesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, tokens } = useAuthStore();

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchGrievances();
  }, [isAuthenticated, router]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/grievances`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch grievances:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusStyles: Record<string, { icon: any; bg: string; text: string }> = {
    SUBMITTED: { icon: AlertCircle, bg: "bg-amber-100", text: "text-amber-700" },
    OPEN: { icon: AlertCircle, bg: "bg-amber-100", text: "text-amber-700" },
    IN_PROGRESS: { icon: Clock, bg: "bg-blue-100", text: "text-blue-700" },
    RESOLVED: { icon: CheckCircle, bg: "bg-success/10", text: "text-success" },
    CLOSED: { icon: CheckCircle, bg: "bg-slate-100", text: "text-slate-600" },
    REJECTED: { icon: AlertCircle, bg: "bg-red-100", text: "text-red-700" },
  };

  const filteredGrievances = grievances.filter((g) => {
    if (filter === "ALL") return true;
    if (filter === "OPEN") return g.status === "SUBMITTED" || g.status === "IN_PROGRESS";
    if (filter === "RESOLVED") return g.status === "RESOLVED" || g.status === "CLOSED";
    return true;
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:opacity-80">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-heading text-xl font-bold">{t("grievance.title")}</h1>
              <p className="text-white/80 text-sm">Track and manage complaints</p>
            </div>
          </div>
          <Link href="/grievances/new">
            <Button variant="cta" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t("grievance.newGrievance")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${filter === f
                ? "bg-cta text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-cta"
                }`}
            >
              {f === "ALL" ? "All" : f === "OPEN" ? "Open" : "Resolved"}
            </button>
          ))}
        </div>

        {/* Grievances List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : filteredGrievances.length > 0 ? (
          <div className="space-y-4">
            {filteredGrievances.map((grievance) => {
              // Safe fallback for status - use SUBMITTED style as default if status not found
              const status = statusStyles[grievance.status] || statusStyles.SUBMITTED;
              const StatusIcon = status.icon;

              return (
                <Link
                  key={grievance.id}
                  href={`/grievances/${grievance.id}`}
                  className="kiosk-card flex items-center gap-4 hover:border-cta border-2 border-transparent"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-slate-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{grievance.ticketNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {grievance.serviceType}
                      </span>
                    </div>
                    <p className="font-medium text-primary truncate">
                      {grievance.subject}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(grievance.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {grievance.status.replace("_", " ")}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground mb-4">{t("grievance.noGrievances")}</p>
            <Link href="/grievances/new">
              <Button variant="cta">
                <Plus className="w-4 h-4 mr-2" />
                {t("grievance.newGrievance")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
