"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Flame,
  Droplets,
  Building2,
  FileText,
  MessageSquare,
  Bell,
  HelpCircle,
} from "lucide-react";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { ServiceCard } from "@/components/kiosk/service-card";
import { AlertBanner } from "@/components/kiosk/alert-banner";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { t } = useTranslation();

  const services = [
    {
      id: "electricity",
      name: t("services.electricity"),
      nameHi: "बिजली",
      icon: Zap,
      color: "bg-electricity-light",
      iconColor: "text-electricity",
      href: "/services/electricity",
      description: t("services.electricityDesc"),
    },
    {
      id: "gas",
      name: t("services.gas"),
      nameHi: "गैस",
      icon: Flame,
      color: "bg-gas-light",
      iconColor: "text-gas",
      href: "/services/gas",
      description: t("services.gasDesc"),
    },
    {
      id: "water",
      name: t("services.water"),
      nameHi: "पानी",
      icon: Droplets,
      color: "bg-water-light",
      iconColor: "text-water",
      href: "/services/water",
      description: t("services.waterDesc"),
    },
    {
      id: "municipal",
      name: t("services.municipal"),
      nameHi: "नगरपालिका",
      icon: Building2,
      color: "bg-municipal-light",
      iconColor: "text-municipal",
      href: "/services/municipal",
      description: t("services.municipalDesc"),
    },
  ];

  const quickActions = [
    {
      id: "pay-bills",
      name: t("actions.payBills"),
      icon: FileText,
      href: "/bills",
    },
    {
      id: "grievances",
      name: t("actions.grievances"),
      icon: MessageSquare,
      href: "/grievances",
    },
    {
      id: "notifications",
      name: t("actions.notifications"),
      icon: Bell,
      href: "/notifications",
    },
    {
      id: "help",
      name: t("actions.help"),
      icon: HelpCircle,
      href: "/help",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-6 px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">
                {t("app.title")}
              </h1>
              <p className="text-white/80 text-sm">
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Alert Banner */}
      <AlertBanner />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Welcome Section */}
        <section className="text-center mb-8">
          <h2 className="font-heading text-3xl text-primary mb-3">
            {t("home.welcome")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("home.description")}
          </p>
        </section>

        {/* Services Grid */}
        <section className="mb-12">
          <h3 className="font-heading text-xl text-primary mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cta rounded-full"></span>
            {t("home.selectService")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h3 className="font-heading text-xl text-primary mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cta rounded-full"></span>
            {t("home.quickActions")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="kiosk-card flex items-center gap-4 hover:border-cta border-2 border-transparent"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-primary">{action.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Login CTA */}
        <section className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white text-center">
          <h3 className="font-heading text-2xl mb-3">
            {t("home.loginCta.title")}
          </h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            {t("home.loginCta.description")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="kiosk-button bg-cta text-white rounded-xl hover:bg-cta/90"
            >
              {t("auth.login")}
            </Link>
            <Link
              href="/auth/register"
              className="kiosk-button bg-white text-primary rounded-xl hover:bg-white/90"
            >
              {t("auth.register")}
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 py-6 px-8 mt-12">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 SUVIDHA Kiosk • C-DAC Smart City Initiative</p>
          <p className="mt-1">
            {t("footer.helpline")}: 1800-XXX-XXXX
          </p>
        </div>
      </footer>
    </div>
  );
}
