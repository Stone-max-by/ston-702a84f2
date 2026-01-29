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
      <SheetContent side="bottom" className="h-auto max-h-[85vh] bg-background border-t border-border rounded-t-3xl p-0">
        <div className="flex flex-col">
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-4">
            <SheetTitle className="text-left">
              <span className="text-xl font-bold">Choose Plan</span>
            </SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="text-sm font-semibold text-foreground">₹{balance}</span>
            </div>
          </SheetHeader>

          {/* Plans */}
          <div className="px-5 pb-4 space-y-3">
            {apiPricingPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const perRequest = (plan.price / plan.requests).toFixed(2);
              
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(isSelected ? null : plan)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Plan name & badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground">{plan.name}</span>
                        {plan.popular && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-warning/20 text-warning rounded-full">
                            Popular
                          </span>
                        )}
                        {plan.bestValue && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-success/20 text-success rounded-full">
                            Best Value
                          </span>
                        )}
                      </div>
                      
                      {/* Price & details */}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                        <span className="text-xs text-muted-foreground">
                          {plan.requests} requests • {plan.validity}
                        </span>
                      </div>
                      
                      {/* Per request */}
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{perRequest}/request
                      </p>
                    </div>

                    {/* Radio */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </div>

                  {/* Features - show when selected */}
                  {isSelected && plan.features.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
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
          <div className="px-5 pb-5 pt-2">
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
