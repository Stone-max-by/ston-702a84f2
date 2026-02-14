import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, collection, where, getDocs, increment } from "firebase/firestore";
import { UserData, AdRewardsData, ReferralData, UserApiKey, UserActivePlan } from "@/types/user";
import { getTelegramStartParam } from "@/lib/telegram";
import { secureApiCall } from "@/lib/secureApi";

// Helper to generate API key (for initial user creation only)
const generateApiKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from({ length: 24 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `pr-live-${randomPart}`;
};

const hashKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const DEFAULT_AD_REWARDS: AdRewardsData = {
  adsWatchedToday: 0,
  lastWatchDate: "",
  totalAdsWatched: 0,
  bonusClaimed: false,
};

const generateReferralCode = (telegramId: number): string => {
  return `REF${telegramId.toString(36).toUpperCase()}`;
};

const DEFAULT_REFERRAL: ReferralData = {
  referralCode: "",
  referralCount: 0,
  referralEarnings: 0,
};

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const getUserDocId = useCallback(() => {
    if (!user?.telegramId) return null;
    return String(user.telegramId);
  }, [user]);

  useEffect(() => {
    const docId = getUserDocId();
    setError(null);

    if (!docId || !user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, "users", docId);

    const unsubscribe = onSnapshot(
      userRef,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            const needsUpdate = !data.purchasedFiles;
            const today = new Date().toISOString().split("T")[0];
            const needsAdReset = data.adRewards?.lastWatchDate !== today;

            if (needsUpdate || needsAdReset) {
              const updates: any = { updatedAt: new Date().toISOString() };
              if (needsUpdate) updates.purchasedFiles = [];
              if (needsAdReset) {
                updates.adRewards = {
                  ...(data.adRewards ?? DEFAULT_AD_REWARDS),
                  adsWatchedToday: 0,
                  bonusClaimed: false,
                  lastWatchDate: today,
                };
              }
              await updateDoc(userRef, updates);
              setUserData({
                ...data,
                purchasedFiles: data.purchasedFiles || [],
                adRewards: needsAdReset ? updates.adRewards : data.adRewards,
              });
            } else {
              setUserData({ ...data, purchasedFiles: data.purchasedFiles || [] });
            }
          } else {
            // Create new user (initial creation only - this is fine client-side)
            const referralCode = generateReferralCode(user.telegramId!);
            const startParam = getTelegramStartParam();
            let referredBy: string | undefined;

            if (startParam) {
              const referrerQuery = query(
                collection(db, "users"),
                where("referral.referralCode", "==", startParam)
              );
              const referrerSnapshot = await getDocs(referrerQuery);
              if (!referrerSnapshot.empty) {
                const referrerDoc = referrerSnapshot.docs[0];
                referredBy = referrerDoc.id;
                await updateDoc(doc(db, "users", referredBy), {
                  "referral.referralCount": increment(1),
                  updatedAt: new Date().toISOString(),
                });
              }
            }

            const rawKey = generateApiKey();
            const keyHash = await hashKey(rawKey);
            const keyPrefix = rawKey.slice(0, 8);

            const apiKey: UserApiKey = {
              key: rawKey,
              keyPrefix,
              keyHash,
              isActive: true,
              createdAt: new Date().toISOString(),
            };

            const newUserData: UserData = {
              id: docId,
              telegramId: user.telegramId!,
              displayName: user.displayName,
              ...(user.username ? { username: user.username } : {}),
              ...(user.photoURL ? { photoURL: user.photoURL } : {}),
              balance: 500,
              coins: 100,
              apiCredits: 100,
              apiKey,
              purchasedFiles: [],
              adRewards: {
                ...DEFAULT_AD_REWARDS,
                lastWatchDate: new Date().toISOString().split("T")[0],
              },
              referral: {
                referralCode,
                ...(referredBy ? { referredBy } : {}),
                referralCount: 0,
                referralEarnings: 0,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userRef, newUserData);
            setNewApiKey(rawKey);
            setUserData(newUserData);
          }
          setLoading(false);
        } catch (e) {
          console.error("useUserData error:", e);
          const message = e instanceof Error ? e.message : "Failed to load user data";
          setError(message);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firebase Error:", error);
        setError(error.message || "Failed to load user data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, getUserDocId]);

  // ===== SECURE API WRITE OPERATIONS =====
  // All writes go through the backend edge function

  const purchaseProduct = useCallback(async (productId: string) => {
    return secureApiCall('purchase-product', { productId });
  }, []);

  const purchaseBot = useCallback(async (botId: string) => {
    return secureApiCall('purchase-bot', { botId });
  }, []);

  const convertCoins = useCallback(async (coinsAmount: number) => {
    return secureApiCall('convert-coins', { coinsAmount });
  }, []);

  const recordAdWatch = useCallback(async (coinsToAdd: number = 5): Promise<boolean> => {
    try {
      await secureApiCall('record-ad-watch', { coinsToAdd });
      return true;
    } catch {
      return false;
    }
  }, []);

  const claimDailyBonus = useCallback(async (bonusAmount: number = 10): Promise<boolean> => {
    try {
      await secureApiCall('claim-daily-bonus', { bonusAmount });
      return true;
    } catch {
      return false;
    }
  }, []);

  const claimStreak = useCallback(async (coinsReward: number) => {
    return secureApiCall('claim-streak', { coinsReward });
  }, []);

  const redeemCode = useCallback(async (code: string) => {
    return secureApiCall('redeem-code', { code });
  }, []);

  const watchAdForProduct = useCallback(async (productId: string) => {
    return secureApiCall('watch-ad-for-product', { productId });
  }, []);

  const revokeApiKey = useCallback(async () => {
    return secureApiCall('revoke-api-key');
  }, []);

  const regenerateApiKey = useCallback(async (): Promise<string | null> => {
    try {
      const result = await secureApiCall<{ apiKey: string }>('regenerate-api-key');
      setNewApiKey(result.apiKey);
      return result.apiKey;
    } catch {
      return null;
    }
  }, []);

  const purchasePlan = useCallback(async (plan: { id: string; name: string; credits: number; validityDays: number; price?: number }) => {
    return secureApiCall('purchase-api-plan', {
      planId: plan.id,
      planName: plan.name,
      credits: plan.credits,
      validityDays: plan.validityDays,
      price: plan.price || 0,
    });
  }, []);

  const hasFile = useCallback((fileId: string): boolean => {
    return userData?.purchasedFiles?.includes(fileId) ?? false;
  }, [userData]);

  const clearNewApiKey = useCallback(() => {
    setNewApiKey(null);
  }, []);

  return {
    userData,
    loading,
    error,
    newApiKey,
    clearNewApiKey,
    
    balance: userData?.balance ?? 0,
    coins: userData?.coins ?? 0,
    
    apiCredits: userData?.apiCredits ?? 0,
    apiKey: userData?.apiKey ?? null,
    activePlan: userData?.activePlan ?? null,
    
    purchasedFiles: userData?.purchasedFiles ?? [],
    hasFile,
    
    adRewards: userData?.adRewards ?? DEFAULT_AD_REWARDS,
    referral: userData?.referral ?? DEFAULT_REFERRAL,
    productAdProgress: (userData as any)?.productAdProgress ?? {},
    
    // Secure write operations (all go through backend)
    purchaseProduct,
    purchaseBot,
    convertCoins,
    recordAdWatch,
    claimDailyBonus,
    claimStreak,
    redeemCode,
    watchAdForProduct,
    revokeApiKey,
    regenerateApiKey,
    purchasePlan,
    
    // Constants
    referralBonusCoins: 50,
    maxAdsPerDay: 10,
    coinsPerAd: 5,
    dailyBonusAmount: 10,
  };
}
