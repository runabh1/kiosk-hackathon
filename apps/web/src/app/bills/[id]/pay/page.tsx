"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  Loader2,
  Download,
  Printer,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/store/auth";
import { useSIGM } from "@/lib/hooks/useSIGM";
import { GuaranteeCheckModal } from "@/components/kiosk/GuaranteeCheckModal";

interface Bill {
  id: string;
  serviceType: string;
  connectionNumber: string;
  billNumber: string;
  amount: number;
  totalAmount: number;
  dueDate: string;
  billPeriod: string;
  connection?: {
    connectionNo: string;
    serviceType: string;
  };
}

interface PaymentResult {
  paymentId: string;
  transactionId: string;
  amount: number;
  status: string;
  receiptNo: string;
}

type PaymentMethod = "UPI" | "CARD" | "NET_BANKING";

export default function PayBillPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, tokens } = useAuthStore();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [upiId, setUpiId] = useState("");
  const [sigmCompleted, setSigmCompleted] = useState(false);

  // SIGM Hook Integration
  const {
    isChecking,
    checkResult,
    isModalOpen,
    performCheck,
    acknowledgeCheck,
    recordSubmission,
    closeModal,
    reset: resetSIGM,
    canProceed,
    isBlocked,
  } = useSIGM({
    requestType: "BILL_PAYMENT",
    serviceType: (bill?.serviceType as any) || "ELECTRICITY",
    onCheckComplete: (result) => {
      console.log("SIGM Check completed:", result.guaranteeStatus);
    },
    onError: (error) => {
      toast({
        title: "Guarantee Check Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchBill();
  }, [isAuthenticated, params.id]);

  const fetchBill = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills/${params.id}`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setBill(data.data);
      } else {
        toast({ title: "Bill not found", variant: "destructive" });
        router.push("/bills");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initiate SIGM check before payment
  const handleInitiatePayment = async () => {
    if (!paymentMethod || !bill) return;

    // Perform SIGM guarantee check
    await performCheck({
      billId: bill.id,
      amount: bill.totalAmount || bill.amount,
      paymentMethod,
    });
  };

  // Handle acknowledgment
  const handleAcknowledge = async (sigmLogId: string) => {
    await acknowledgeCheck();
  };

  // Handle cancel from modal
  const handleCancel = () => {
    closeModal();
    resetSIGM();
  };

  // Handle proceed after SIGM check
  const handleProceed = async () => {
    closeModal();
    setSigmCompleted(true);
    await processPayment();
  };

  // Process the actual payment
  const processPayment = async () => {
    if (!paymentMethod || !bill) return;

    setProcessing(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            billId: bill.id,
            amount: bill.totalAmount || bill.amount,
            method: paymentMethod,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPaymentResult(data.data);

        // Record the submission with SIGM (fire-and-forget, don't block payment success)
        if (checkResult?.sigmLogId) {
          recordSubmission(data.data.paymentId, bill.id).catch(() => {
            // Silently ignore SIGM recording errors - payment was successful
          });
        }

        toast({
          title: "Payment Successful!",
          description: `Receipt No: ${data.data.receiptNo}`,
        });
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: "UPI" as const, name: "UPI / BHIM", icon: Smartphone, desc: "Pay using any UPI app" },
    { id: "CARD" as const, name: "Credit/Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
    { id: "NET_BANKING" as const, name: "Net Banking", icon: Building2, desc: "All major banks" },
  ];

  if (!isAuthenticated) return null;

  // Success State
  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <header className="bg-success text-white py-4 px-6">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h1 className="font-heading text-xl font-bold">Payment Successful!</h1>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          {/* Guarantee Badge */}
          {checkResult?.guaranteeStatus === "GUARANTEED" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-800 text-sm">
                  {i18n.language === "hi"
                    ? "गारंटीड: आपका भुगतान पूर्ण हो गया"
                    : "Guaranteed: Your payment is complete"}
                </p>
                <p className="text-emerald-600 text-xs">
                  {i18n.language === "hi"
                    ? "किसी दोबारा विजिट की जरूरत नहीं"
                    : "No repeat visit needed"}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm">Amount Paid</p>
              <p className="font-heading text-4xl text-primary font-bold">
                ₹{paymentResult.amount?.toLocaleString() || (bill?.totalAmount || bill?.amount)?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono">{paymentResult.transactionId}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Receipt No.</span>
                <span className="font-mono">{paymentResult.receiptNo}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">{paymentResult.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button variant="outline" className="h-14" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="h-14">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <Link href="/dashboard">
            <Button variant="cta" size="xl" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading || !bill) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SIGM Guarantee Check Modal */}
      <GuaranteeCheckModal
        isOpen={isModalOpen}
        checkResult={checkResult}
        isLoading={isChecking}
        onAcknowledge={handleAcknowledge}
        onCancel={handleCancel}
        onProceed={handleProceed}
        language={i18n.language as "en" | "hi"}
      />

      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/bills" className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold">Pay Bill</h1>
            <p className="text-white/80 text-sm">Bill #{bill.billNumber || bill.connection?.connectionNo}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        {/* Bill Summary */}
        <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm">{bill.serviceType || bill.connection?.serviceType}</p>
              <p className="text-sm text-muted-foreground">
                Connection: {bill.connectionNumber || bill.connection?.connectionNo}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Period</p>
              <p className="font-medium">{bill.billPeriod || "Current"}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-sm">Amount to Pay</p>
            <p className="font-heading text-3xl text-primary font-bold">
              ₹{(bill.totalAmount || bill.amount)?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* SIGM Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium">
              {i18n.language === "hi"
                ? "सिंगल-इंटरेक्शन गारंटी मोड सक्षम"
                : "Single-Interaction Guarantee Mode Enabled"}
            </p>
            <p className="text-blue-600 text-xs">
              {i18n.language === "hi"
                ? "भुगतान से पहले हम आपके अनुरोध की जांच करेंगे"
                : "We'll verify your request before payment"}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <h2 className="font-heading text-lg text-primary mb-4">Select Payment Method</h2>
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all cursor-pointer ${paymentMethod === method.id
                ? "border-cta bg-cta/5"
                : "border-slate-200 hover:border-cta/50"
                }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${paymentMethod === method.id ? "bg-cta text-white" : "bg-slate-100 text-slate-600"
                }`}>
                <method.icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-medium text-primary">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.desc}</p>
              </div>
              {paymentMethod === method.id && (
                <CheckCircle className="w-5 h-5 text-cta ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* UPI ID Input (if UPI selected) */}
        {paymentMethod === "UPI" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              Enter UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full h-14 px-4 rounded-lg border-2 border-slate-200 focus:border-cta focus:ring-2 focus:ring-cta/20 outline-none transition-colors text-lg"
            />
          </div>
        )}

        {/* Pay Button with SIGM Check */}
        <Button
          variant="cta"
          size="xl"
          className="w-full"
          disabled={!paymentMethod || processing || isChecking || (paymentMethod === "UPI" && !upiId)}
          onClick={handleInitiatePayment}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Verify & Pay ₹{(bill.totalAmount || bill.amount)?.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          🔒 Secured by 256-bit encryption • Single-Interaction Guaranteed
        </p>
      </div>
    </div>
  );
}
