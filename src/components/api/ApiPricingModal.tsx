import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Coins, ArrowRight, Sparkles, Trophy, Calendar, TrendingUp, Wallet } from "lucide-react";
import { apiPricingPlans, profitConfig } from "@/data/apiPricingPlans";
import { ApiPricingPlan } from "@/types/apiPricing";
import { toast } from "sonner";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface ApiPricingModalProps {
  open: boolean;
  onClose: () => void;
  providerName?: string;
}

export function ApiPricingModal({ open, onClose, providerName }: ApiPricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<ApiPricingPlan | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { balance, purchasePlan, remainingRequests } = useUserApiCredits();
  const { requireAuth } = useRequireAuth();

  const handlePurchase = async (plan: ApiPricingPlan) => {
    if (!requireAuth('purchase this plan')) return;
    
    if (balance < plan.price) {
      toast.error("Insufficient balance!", {
        description: `You need ₹${plan.price} but have ₹${balance}. Please add funds.`,
      });
      return;
    }

    setIsPurchasing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = await purchasePlan(plan);
    
    if (success) {
      toast.success(`Successfully purchased ${plan.name} plan!`, {
        description: `You now have ${plan.requests} API requests valid for ${plan.validity}`,
      });
      onClose();
    } else {
      toast.error("Purchase failed. Please try again.");
    }
    
    setIsPurchasing(false);
  };

  const calculatePerRequest = (plan: ApiPricingPlan) => {
    return (plan.price / plan.requests).toFixed(2);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "starter": return "⚡";
      case "popular": return "🔥";
      case "unlimited": return "🚀";
      default: return "✨";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] bg-background border-t border-white/10 rounded-t-3xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-white/10 shrink-0">
            <SheetTitle className="text-center">
              <div className="text-lg font-bold text-foreground">
                API Plans
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                Ek plan lo, saari APIs use karo ✨
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/20 rounded-lg">
                  <Wallet className="w-4 h-4 text-success" />
                  <span className="text-sm font-bold text-success">₹{balance}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-lg">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{remainingRequests}</span>
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {apiPricingPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                className={`w-full rounded-xl border p-4 text-left transition-all relative overflow-hidden ${
                  selectedPlan?.id === plan.id
                    ? "border-primary bg-primary/10"
                    : plan.bestValue
                    ? "border-success/50 bg-success/5 hover:border-success"
                    : plan.popular
                    ? "border-warning/50 bg-warning/5 hover:border-warning"
                    : "border-white/10 bg-card hover:border-white/20"
                }`}
              >
                {/* Best Value / Popular Ribbon */}
                {(plan.bestValue || plan.popular) && (
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-lg ${
                    plan.bestValue ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"
                  }`}>
                    {plan.bestValue ? "🏆 BEST VALUE" : "🔥 POPULAR"}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getPlanIcon(plan.id)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">{plan.name} Plan</span>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-md">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold text-primary">{plan.requests.toLocaleString()} Requests</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{plan.validity}</span>
                      </div>
                    </div>

                    {/* Tagline */}
                    {plan.tagline && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {plan.tagline}
                      </p>
                    )}

                    {/* Per request cost */}
                    <p className={`text-[11px] mt-1 ${
                      plan.bestValue ? "text-success" : plan.popular ? "text-warning" : "text-muted-foreground"
                    }`}>
                      ₹{calculatePerRequest(plan)} per request
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    selectedPlan?.id === plan.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}>
                    {selectedPlan?.id === plan.id && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </div>

                {/* Features */}
                <div className={`mt-3 space-y-1.5 overflow-hidden transition-all ${
                  selectedPlan?.id === plan.id ? "max-h-48" : "max-h-0"
                }`}>
                  <div className="pt-2 border-t border-white/10">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                        <Check className="w-3 h-3 text-success shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}

            {/* Info */}
            <div className="p-3 rounded-xl bg-card border border-white/5 text-center">
              <p className="text-xs text-muted-foreground">
                💡 Jitna bada plan, utna kam per request cost
              </p>
            </div>
          </div>

          {/* Purchase Button */}
          <div className="p-4 border-t border-white/10 shrink-0 bg-background">
            <Button
              onClick={() => selectedPlan && handlePurchase(selectedPlan)}
              disabled={!selectedPlan || isPurchasing}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {isPurchasing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </span>
              ) : selectedPlan ? (
                <span className="flex items-center gap-2">
                  Purchase {selectedPlan.name} – ₹{selectedPlan.price}
                  <ArrowRight className="w-4 h-4" />
                </span>
              ) : (
                "Select a plan to continue"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
