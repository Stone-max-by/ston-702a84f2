import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Zap, ArrowRight, Wallet } from "lucide-react";
import { apiPricingPlans } from "@/data/apiPricingPlans";
import { ApiPricingPlan } from "@/types/apiPricing";
import { toast } from "sonner";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface ApiPricingModalProps {
  open: boolean;
  onClose: () => void;
  providerName?: string;
}

export function ApiPricingModal({ open, onClose }: ApiPricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<ApiPricingPlan | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { balance, purchasePlan } = useUserApiCredits();
  const { requireAuth } = useRequireAuth();

  const handlePurchase = async (plan: ApiPricingPlan) => {
    if (!requireAuth('purchase this plan')) return;
    
    if (balance < plan.price) {
      toast.error("Insufficient balance!", {
        description: `You need ₹${plan.price} but have ₹${balance}`,
      });
      return;
    }

    setIsPurchasing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const success = await purchasePlan(plan);
    
    if (success) {
      toast.success(`${plan.name} plan activated!`, {
        description: `${plan.requests} requests for ${plan.validity}`,
      });
      onClose();
    } else {
      toast.error("Purchase failed");
    }
    
    setIsPurchasing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] bg-background border-t border-border rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-4 shrink-0">
            <SheetTitle className="text-left">
              <span className="text-lg font-bold">Choose Plan</span>
            </SheetTitle>
            <div className="flex items-center gap-2 mt-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Balance:</span>
              <span className="text-sm font-bold text-foreground">₹{balance}</span>
            </div>
          </SheetHeader>

          {/* Plans */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2.5">
            {apiPricingPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const perRequest = (plan.price / plan.requests).toFixed(2);
              
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(isSelected ? null : plan)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Plan name & badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                        {plan.popular && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-warning/20 text-warning rounded">
                            POPULAR
                          </span>
                        )}
                        {plan.bestValue && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-success/20 text-success rounded">
                            BEST VALUE
                          </span>
                        )}
                      </div>
                      
                      {/* Price & details */}
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-bold text-foreground">₹{plan.price}</span>
                        <span className="text-[11px] text-muted-foreground">
                          • {plan.requests} requests • {plan.validity}
                        </span>
                      </div>
                      
                      {/* Per request */}
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        ≈ ₹{perRequest} per request
                      </p>
                    </div>

                    {/* Radio */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>

                  {/* Features - show when selected */}
                  {isSelected && plan.features.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Check className="w-3 h-3 text-success shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Purchase Button */}
          <div className="shrink-0 px-5 pb-5 pt-3 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <Button
              onClick={() => selectedPlan && handlePurchase(selectedPlan)}
              disabled={!selectedPlan || isPurchasing || (selectedPlan && balance < selectedPlan.price)}
              className="w-full h-12 text-base font-semibold"
            >
              {isPurchasing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </span>
              ) : selectedPlan ? (
                balance < selectedPlan.price ? (
                  <span>Insufficient Balance</span>
                ) : (
                  <span className="flex items-center gap-2">
                    Buy {selectedPlan.name} – ₹{selectedPlan.price}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )
              ) : (
                "Select a plan"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
