import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, IndianRupee, QrCode, Sparkles, Wallet } from "lucide-react";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";

const PRESET_AMOUNTS = [
  { amount: 50, label: "₹50", popular: false },
  { amount: 100, label: "₹100", popular: true },
  { amount: 200, label: "₹200", popular: false },
  { amount: 500, label: "₹500", popular: false },
];

export default function Deposit() {
  const navigate = useNavigate();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const [step, setStep] = useState<"amount" | "qr" | "success">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const { addBalance, balance } = useUserApiCredits();

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('add money to your wallet');
    }
  }, []);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const getFinalAmount = () => {
    return selectedAmount || parseInt(customAmount) || 0;
  };

  const handleProceedToQR = () => {
    if (!requireAuth('add money to your wallet')) return;
    
    const amount = getFinalAmount();
    if (amount < 10) {
      toast.error("Minimum deposit amount is ₹10");
      return;
    }
    setStep("qr");
  };

  const handlePaymentReceived = async () => {
    const amount = getFinalAmount();
    await addBalance(amount);
    setStep("success");
    toast.success(`₹${amount} added to your balance!`);
  };

  const handleBack = () => {
    if (step === "qr") {
      setStep("amount");
    } else if (step === "success") {
      navigate(-1);
    }
  };

  return (
    <AppLayout
      title={step === "amount" ? "Add Money" : step === "qr" ? "Scan & Pay" : "Success"}
      showBack
      onBack={step === "amount" ? () => navigate(-1) : handleBack}
    >
      <div className="p-4 pb-8">
        {step === "amount" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-foreground">₹{balance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Select Amount</h3>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_AMOUNTS.map((item) => (
                  <button
                    key={item.amount}
                    onClick={() => handleAmountSelect(item.amount)}
                    className={`relative h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                      selectedAmount === item.amount
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                    }`}
                  >
                    {item.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Popular
                      </span>
                    )}
                    <span className={`text-2xl font-bold ${selectedAmount === item.amount ? "text-primary" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider">
                  or enter custom
                </span>
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-16 h-14 text-xl font-semibold bg-card border-border rounded-xl focus:border-primary focus:ring-primary"
              />
            </div>

            {/* Proceed Button */}
            <Button
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              onClick={handleProceedToQR}
              disabled={getFinalAmount() < 10}
            >
              <span>Pay ₹{getFinalAmount() || 0}</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Minimum deposit: ₹10 • Instant credit to wallet
            </p>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Amount Display */}
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="text-4xl font-bold text-foreground">
                ₹{getFinalAmount()}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-black/20">
                <div className="w-52 h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] bg-[length:4px_4px]" />
                  <QrCode className="h-36 w-36 text-gray-800" />
                </div>
              </div>
            </div>

            {/* UPI Details */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">UPI ID</span>
                <span className="text-sm font-medium text-foreground">payments@yourupi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium text-foreground">Your Business</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground text-center">
                Scan the QR code using any UPI app like GPay, PhonePe, or Paytm
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              className="w-full h-14 text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/30"
              onClick={handlePaymentReceived}
            >
              <Check className="mr-2 h-5 w-5" />
              I've Completed Payment
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-8 pt-12 animate-in fade-in zoom-in-95 duration-500">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/30">
                  <Check className="h-14 w-14 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-foreground">
                ₹{getFinalAmount()} Added!
              </p>
              <p className="text-muted-foreground">
                Your wallet has been credited successfully
              </p>
            </div>

            {/* New Balance Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Balance</p>
                  <p className="text-2xl font-bold text-foreground">₹{balance.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                className="w-full h-14 text-lg font-semibold rounded-xl"
                onClick={() => navigate("/transactions")}
              >
                View Transactions
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-border"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
