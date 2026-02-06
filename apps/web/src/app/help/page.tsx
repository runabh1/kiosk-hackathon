"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    Clock,
    FileText,
    MessageSquare,
    HelpCircle,
    ChevronRight,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HelpPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const faqs = [
        {
            question: isHindi ? "मैं अपना बिल कैसे भुगतान करूं?" : "How do I pay my bill?",
            answer: isHindi
                ? "होमपेज से 'बिल भुगतान' चुनें, अपना बिल चुनें, और UPI, कार्ड या नेट बैंकिंग का उपयोग करके भुगतान करें।"
                : "Select 'Pay Bills' from the homepage, choose your bill, and pay using UPI, Card, or Net Banking.",
        },
        {
            question: isHindi ? "मैं शिकायत कैसे दर्ज करूं?" : "How do I file a grievance?",
            answer: isHindi
                ? "'शिकायतें' अनुभाग पर जाएं, 'नई शिकायत' पर क्लिक करें, सेवा प्रकार चुनें और अपनी समस्या का वर्णन करें।"
                : "Go to 'Grievances' section, click 'New Grievance', select the service type, and describe your issue.",
        },
        {
            question: isHindi ? "मैं नए कनेक्शन के लिए कैसे आवेदन करूं?" : "How do I apply for a new connection?",
            answer: isHindi
                ? "लॉगिन करें, डैशबोर्ड से 'नया कनेक्शन' चुनें, सेवा प्रकार और स्थान विवरण भरें।"
                : "Login, select 'New Connection' from dashboard, fill in service type and location details.",
        },
        {
            question: isHindi ? "मैं अपनी मीटर रीडिंग कैसे जमा करूं?" : "How do I submit my meter reading?",
            answer: isHindi
                ? "अपने कनेक्शन पृष्ठ पर जाएं और 'मीटर रीडिंग जमा करें' पर क्लिक करें। वर्तमान रीडिंग दर्ज करें।"
                : "Go to your connection page and click 'Submit Meter Reading'. Enter the current reading.",
        },
        {
            question: isHindi ? "मैं अपनी रसीद कैसे डाउनलोड करूं?" : "How do I download my receipt?",
            answer: isHindi
                ? "भुगतान इतिहास में जाएं, लेनदेन चुनें और 'रसीद' बटन पर क्लिक करें।"
                : "Go to Payment History, select the transaction, and click the 'Receipt' button.",
        },
    ];

    const contacts = [
        {
            icon: Phone,
            title: isHindi ? "हेल्पलाइन" : "Helpline",
            value: "1800-XXX-XXXX",
            subtitle: isHindi ? "24x7 उपलब्ध" : "Available 24x7",
        },
        {
            icon: Mail,
            title: isHindi ? "ईमेल" : "Email",
            value: "support@suvidha.gov.in",
            subtitle: isHindi ? "48 घंटे में जवाब" : "Response within 48 hours",
        },
        {
            icon: MapPin,
            title: isHindi ? "कार्यालय" : "Office",
            value: isHindi ? "सिविक सेंटर, स्मार्ट सिटी" : "Civic Center, Smart City",
            subtitle: isHindi ? "सोम-शनि: 9 AM - 6 PM" : "Mon-Sat: 9 AM - 6 PM",
        },
    ];

    const quickLinks = [
        { name: isHindi ? "बिल भुगतान गाइड" : "Bill Payment Guide", href: "/help/bills" },
        { name: isHindi ? "शिकायत प्रक्रिया" : "Grievance Process", href: "/help/grievances" },
        { name: isHindi ? "कनेक्शन प्रकार" : "Connection Types", href: "/help/connections" },
        { name: isHindi ? "दस्तावेज़ आवश्यकताएं" : "Document Requirements", href: "/help/documents" },
    ];

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
                    <div>
                        <h1 className="font-heading text-xl font-bold">
                            {isHindi ? "सहायता केंद्र" : "Help Center"}
                        </h1>
                        <p className="text-white/70 text-sm">
                            {isHindi ? "अक्सर पूछे जाने वाले प्रश्न और संपर्क" : "FAQs & Contact Information"}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Emergency Banner */}
                <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                            <Phone className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                            <p className="font-bold text-destructive">
                                {isHindi ? "आपातकालीन हेल्पलाइन" : "Emergency Helpline"}
                            </p>
                            <p className="text-2xl font-bold text-primary">1800-XXX-XXXX</p>
                        </div>
                    </div>
                </div>

                {/* FAQs */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        {isHindi ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <details
                                key={idx}
                                className="kiosk-card group"
                            >
                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                    <span className="font-medium text-primary">{faq.question}</span>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                                </summary>
                                <p className="mt-3 text-muted-foreground text-sm border-t pt-3">
                                    {faq.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        {isHindi ? "संपर्क करें" : "Contact Us"}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {contacts.map((contact, idx) => (
                            <div key={idx} className="kiosk-card text-center">
                                <div className="w-12 h-12 bg-cta/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <contact.icon className="w-6 h-6 text-cta" />
                                </div>
                                <p className="text-sm text-muted-foreground">{contact.title}</p>
                                <p className="font-bold text-primary">{contact.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{contact.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Links */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {isHindi ? "उपयोगी लिंक" : "Quick Links"}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {quickLinks.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.href}
                                className="kiosk-card flex items-center justify-between hover:border-cta border-2 border-transparent"
                            >
                                <span className="font-medium text-primary">{link.name}</span>
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Operating Hours */}
                <section>
                    <div className="kiosk-card bg-slate-50">
                        <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {isHindi ? "कियोस्क संचालन समय" : "Kiosk Operating Hours"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">{isHindi ? "सोमवार - शनिवार" : "Monday - Saturday"}</p>
                                <p className="font-medium">8:00 AM - 8:00 PM</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">{isHindi ? "रविवार और छुट्टियां" : "Sunday & Holidays"}</p>
                                <p className="font-medium">10:00 AM - 4:00 PM</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
