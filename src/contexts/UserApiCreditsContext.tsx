import { createContext, useContext, ReactNode } from "react";
import { ApiPricingPlan, UserApiPurchase } from "@/types/apiPricing";
import { Transaction } from "@/types/transaction";
import { useUserData } from "@/hooks/useUserData";
import { useTransactions } from "@/hooks/useTransactions";
import { usePurchases } from "@/hooks/usePurchases";

interface UserApiCreditsContextType {
  balance: number;
  coins: number;
  purchases: UserApiPurchase[];
  totalRequests: number;
  usedRequests: number;
  remainingRequests: number;
  purchasePlan: (plan: ApiPricingPlan) => Promise<boolean>;
  useRequest: () => Promise<boolean>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<string | null>;
  adsWatchedToday: number;
  totalAdsWatched: number;
  bonusClaimed: boolean;
  maxAdsPerDay: number;
  coinsPerAd: number;
  dailyBonusAmount: number;
  canClaimBonus: boolean;
  recordAdWatch: (coinsToAdd?: number) => Promise<boolean>;
  claimDailyBonus: (bonusAmount?: number) => Promise<boolean>;
  loading: boolean;
}

const UserApiCreditsContext = createContext<UserApiCreditsContextType | null>(null);

export function UserApiCreditsProvider({ children }: { children: ReactNode }) {
  const {
    loading: userLoading,
    balance,
    coins,
    adRewards,
    recordAdWatch,
    claimDailyBonus,
    maxAdsPerDay,
    coinsPerAd,
    dailyBonusAmount,
    purchasePlan: securePurchasePlan,
  } = useUserData();

  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions();
  const { purchases, loading: purchasesLoading, totalRequests, usedRequests, remainingRequests, createPurchase, useRequest } = usePurchases();

  const loading = userLoading || transactionsLoading || purchasesLoading;
  const canClaimBonus = adRewards.adsWatchedToday >= maxAdsPerDay && !adRewards.bonusClaimed;

  const purchasePlan = async (plan: ApiPricingPlan): Promise<boolean> => {
    if (balance < plan.price) return false;
    try {
      await securePurchasePlan({
        id: plan.id,
        name: plan.name,
        credits: plan.requests,
        validityDays: parseInt(plan.validity.split(" ")[0]) || 30,
        price: plan.price,
      });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <UserApiCreditsContext.Provider
      value={{
        balance, coins, purchases, totalRequests, usedRequests, remainingRequests,
        purchasePlan, useRequest, transactions, addTransaction,
        adsWatchedToday: adRewards.adsWatchedToday, totalAdsWatched: adRewards.totalAdsWatched,
        bonusClaimed: adRewards.bonusClaimed, maxAdsPerDay, coinsPerAd, dailyBonusAmount,
        canClaimBonus, recordAdWatch, claimDailyBonus, loading,
      }}
    >
      {children}
    </UserApiCreditsContext.Provider>
  );
}

export function useUserApiCredits() {
  const context = useContext(UserApiCreditsContext);
  if (!context) throw new Error("useUserApiCredits must be used within UserApiCreditsProvider");
  return context;
}
