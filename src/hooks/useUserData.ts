import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, collection, where, getDocs, increment } from "firebase/firestore";
import { UserData, AdRewardsData, ReferralData, UserApiKey, UserActivePlan } from "@/types/user";
import { getTelegramStartParam } from "@/lib/telegram";

// Helper to generate API key (pr-live- + 24 characters = 32 total)
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
            // Create new user
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

            // Generate API key for new user
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

  const updateBalance = useCallback(async (newBalance: number) => {
    const docId = getUserDocId();
    if (!docId) return;
    await updateDoc(doc(db, "users", docId), {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId]);

  const addBalance = useCallback(async (amount: number) => {
    if (!userData) return;
    await updateBalance(userData.balance + amount);
  }, [userData, updateBalance]);

  const updateCoins = useCallback(async (newCoins: number) => {
    const docId = getUserDocId();
    if (!docId) return;
    await updateDoc(doc(db, "users", docId), {
      coins: newCoins,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId]);

  const addCoins = useCallback(async (amount: number) => {
    if (!userData) return;
    await updateCoins(userData.coins + amount);
  }, [userData, updateCoins]);

  const updateApiCredits = useCallback(async (newCredits: number) => {
    const docId = getUserDocId();
    if (!docId) return;
    await updateDoc(doc(db, "users", docId), {
      apiCredits: newCredits,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId]);

  const useApiCredit = useCallback(async (): Promise<boolean> => {
    if (!userData || userData.apiCredits <= 0) return false;
    await updateApiCredits(userData.apiCredits - 1);
    return true;
  }, [userData, updateApiCredits]);

  const revokeApiKey = useCallback(async () => {
    const docId = getUserDocId();
    if (!docId || !userData?.apiKey) return;
    await updateDoc(doc(db, "users", docId), {
      "apiKey.isActive": false,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId, userData]);

  const regenerateApiKey = useCallback(async (): Promise<string | null> => {
    const docId = getUserDocId();
    if (!docId) return null;

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

    await updateDoc(doc(db, "users", docId), {
      apiKey,
      updatedAt: new Date().toISOString(),
    });

    setNewApiKey(rawKey);
    return rawKey;
  }, [getUserDocId]);

  const purchasePlan = useCallback(async (plan: { id: string; name: string; credits: number; validityDays: number }) => {
    const docId = getUserDocId();
    if (!docId || !userData) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.validityDays);

    const activePlan: UserActivePlan = {
      planId: plan.id,
      planName: plan.name,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      totalCredits: plan.credits,
    };

    await updateDoc(doc(db, "users", docId), {
      activePlan,
      apiCredits: userData.apiCredits + plan.credits,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId, userData]);

  const updateAdRewards = useCallback(async (adRewards: Partial<AdRewardsData>) => {
    const docId = getUserDocId();
    if (!docId || !userData) return;
    const updatedAdRewards = { ...userData.adRewards, ...adRewards };
    await updateDoc(doc(db, "users", docId), {
      adRewards: updatedAdRewards,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId, userData]);

  const recordAdWatch = useCallback(async (): Promise<boolean> => {
    if (!userData) return false;
    const maxAdsPerDay = 10;
    if (userData.adRewards.adsWatchedToday >= maxAdsPerDay) return false;
    const today = new Date().toISOString().split("T")[0];
    await updateAdRewards({
      adsWatchedToday: userData.adRewards.adsWatchedToday + 1,
      totalAdsWatched: userData.adRewards.totalAdsWatched + 1,
      lastWatchDate: today,
    });
    return true;
  }, [userData, updateAdRewards]);

  const claimDailyBonus = useCallback(async (): Promise<boolean> => {
    if (!userData) return false;
    const maxAdsPerDay = 10;
    if (userData.adRewards.bonusClaimed || userData.adRewards.adsWatchedToday < maxAdsPerDay) {
      return false;
    }
    await updateAdRewards({ bonusClaimed: true });
    return true;
  }, [userData, updateAdRewards]);

  const addPurchasedFile = useCallback(async (fileId: string) => {
    const docId = getUserDocId();
    if (!docId || !userData) return;
    if (userData.purchasedFiles?.includes(fileId)) return;
    const updatedFiles = [...(userData.purchasedFiles || []), fileId];
    await updateDoc(doc(db, "users", docId), {
      purchasedFiles: updatedFiles,
      updatedAt: new Date().toISOString(),
    });
  }, [getUserDocId, userData]);

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
    updateBalance,
    addBalance,
    
    coins: userData?.coins ?? 0,
    updateCoins,
    addCoins,
    
    apiCredits: userData?.apiCredits ?? 0,
    apiKey: userData?.apiKey ?? null,
    activePlan: userData?.activePlan ?? null,
    updateApiCredits,
    useApiCredit,
    revokeApiKey,
    regenerateApiKey,
    purchasePlan,
    
    purchasedFiles: userData?.purchasedFiles ?? [],
    addPurchasedFile,
    hasFile,
    
    adRewards: userData?.adRewards ?? DEFAULT_AD_REWARDS,
    recordAdWatch,
    claimDailyBonus,
    
    referral: userData?.referral ?? DEFAULT_REFERRAL,
    referralBonusCoins: 50,
    
    maxAdsPerDay: 10,
    coinsPerAd: 5,
    dailyBonusAmount: 10,
  };
}
