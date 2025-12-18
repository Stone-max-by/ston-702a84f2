import { createContext, useContext, ReactNode } from "react";
import { ApiPricingPlan, UserApiPurchase } from "@/types/apiPricing";
import { Transaction } from "@/types/transaction";
import { useUserData } from "@/hooks/useUserData";
import { useTransactions } from "@/hooks/useTransactions";
import { usePurchases } from "@/hooks/usePurchases";

interface UserApiCreditsContextType {
  // Balance & Coins
  balance: number;
  coins: number;
  addBalance: (amount: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  
  // Purchases
  purchases: UserApiPurchase[];
  totalRequests: number;
  usedRequests: number;
  remainingRequests: number;
  purchasePlan: (plan: ApiPricingPlan) => Promise<boolean>;
  useRequest: () => Promise<boolean>;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<string | null>;
  
  // Ad Rewards
  adsWatchedToday: number;
  totalAdsWatched: number;
  bonusClaimed: boolean;
  maxAdsPerDay: number;
  coinsPerAd: number;
  dailyBonusAmount: number;
  canClaimBonus: boolean;
  recordAdWatch: () => Promise<boolean>;
  claimDailyBonus: () => Promise<boolean>;
  
  // Loading state
  loading: boolean;
}

const UserApiCreditsContext = createContext<UserApiCreditsContextType | null>(null);

export function UserApiCreditsProvider({ children }: { children: ReactNode }) {
  const {
    loading: userLoading,
    balance,
    coins,
    addBalance,
    addCoins,
    adRewards,
    recordAdWatch,
    claimDailyBonus,
    maxAdsPerDay,
    coinsPerAd,
    dailyBonusAmount,
  } = useUserData();

  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
  } = useTransactions();

  const {
    purchases,
    loading: purchasesLoading,
    totalRequests,
    usedRequests,
    remainingRequests,
    createPurchase,
    useRequest,
  } = usePurchases();

  const loading = userLoading || transactionsLoading || purchasesLoading;
  const canClaimBonus = adRewards.adsWatchedToday >= maxAdsPerDay && !adRewards.bonusClaimed;

  const purchasePlan = async (plan: ApiPricingPlan): Promise<boolean> => {
    if (balance < plan.price) return false;

    // Deduct balance
    await addBalance(-plan.price);

    // Add transaction
    await addTransaction({
      type: "purchase",
      amount: -plan.price,
      description: `${plan.name} Plan - ${plan.requests} requests`,
      status: "completed",
    });

    // Create purchase
    const purchaseId = await createPurchase(plan);
    return !!purchaseId;
  };

  const handleAddBalance = async (amount: number) => {
    await addBalance(amount);
    await addTransaction({
      type: "deposit",
      amount: amount,
      description: "Deposit",
      status: "completed",
    });
  };

  return (
    <UserApiCreditsContext.Provider
      value={{
        // Balance & Coins
        balance,
        coins,
        addBalance: handleAddBalance,
        addCoins,
        
        // Purchases
        purchases,
        totalRequests,
        usedRequests,
        remainingRequests,
        purchasePlan,
        useRequest,
        
        // Transactions
        transactions,
        addTransaction,
        
        // Ad Rewards
        adsWatchedToday: adRewards.adsWatchedToday,
        totalAdsWatched: adRewards.totalAdsWatched,
        bonusClaimed: adRewards.bonusClaimed,
        maxAdsPerDay,
        coinsPerAd,
        dailyBonusAmount,
        canClaimBonus,
        recordAdWatch,
        claimDailyBonus,
        
        // Loading
        loading,
      }}
    >
      {children}
    </UserApiCreditsContext.Provider>
  );
}

export function useUserApiCredits() {
  const context = useContext(UserApiCreditsContext);
  if (!context) {
    throw new Error("useUserApiCredits must be used within UserApiCreditsProvider");
  }
  return context;
}
