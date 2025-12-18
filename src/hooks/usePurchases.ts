import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { UserApiPurchase, ApiPricingPlan } from "@/types/apiPricing";

const REFERRAL_BONUS_COINS = 50; // Coins referrer earns per purchase

export function usePurchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<UserApiPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserId = useCallback(() => {
    if (!user?.telegramId) return null;
    return String(user.telegramId);
  }, [user]);

  useEffect(() => {
    const userId = getUserId();
    
    if (!userId) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    const purchasesQuery = query(
      collection(db, "purchases"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(purchasesQuery, (snapshot) => {
      const purchaseData: UserApiPurchase[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserApiPurchase[];
      setPurchases(purchaseData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching purchases:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [getUserId]);

  const activePurchases = purchases.filter((p) => p.status === "active");
  const totalRequests = activePurchases.reduce((sum, p) => sum + p.totalRequests, 0);
  const usedRequests = activePurchases.reduce((sum, p) => sum + p.usedRequests, 0);
  const remainingRequests = totalRequests - usedRequests;

  const createPurchase = useCallback(async (plan: ApiPricingPlan): Promise<string | null> => {
    const userId = getUserId();
    if (!userId) return null;

    const validityDays = parseInt(plan.validity.split(" ")[0]) || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    const docRef = await addDoc(collection(db, "purchases"), {
      planId: plan.id,
      userId,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      totalRequests: plan.requests,
      usedRequests: 0,
      status: "active",
    });

    // Credit referrer if this user was referred
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const referredBy = userData?.referral?.referredBy;
        
        if (referredBy) {
          // Add coins to referrer
          await updateDoc(doc(db, "users", referredBy), {
            coins: increment(REFERRAL_BONUS_COINS),
            "referral.referralEarnings": increment(REFERRAL_BONUS_COINS),
            updatedAt: new Date().toISOString(),
          });
          console.log(`Credited ${REFERRAL_BONUS_COINS} coins to referrer ${referredBy}`);
        }
      }
    } catch (error) {
      console.error("Error crediting referrer:", error);
    }

    return docRef.id;
  }, [getUserId]);

  const useRequest = useCallback(async (): Promise<boolean> => {
    const activePurchase = purchases.find(
      (p) => p.status === "active" && p.usedRequests < p.totalRequests
    );

    if (!activePurchase) return false;

    const purchaseRef = doc(db, "purchases", activePurchase.id);
    const newUsedRequests = activePurchase.usedRequests + 1;
    
    await updateDoc(purchaseRef, {
      usedRequests: newUsedRequests,
      status: newUsedRequests >= activePurchase.totalRequests ? "exhausted" : "active",
    });

    return true;
  }, [purchases]);

  return {
    purchases,
    activePurchases,
    loading,
    totalRequests,
    usedRequests,
    remainingRequests,
    createPurchase,
    useRequest,
  };
}
