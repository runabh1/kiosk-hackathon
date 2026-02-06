import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/provider";
import { AccessibilityProvider } from "@/lib/context/accessibility";
import { AccessibilityToolbar } from "@/components/kiosk/AccessibilityToolbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SUVIDHA Kiosk - Unified Civic Services",
  description: "Self-service kiosk for Electricity, Gas, Water, and Municipal services",
  keywords: ["civic services", "kiosk", "smart city", "electricity", "water", "gas", "municipal"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          <AccessibilityProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <main id="main-content">
              {children}
            </main>
            <AccessibilityToolbar />
            <Toaster />
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

