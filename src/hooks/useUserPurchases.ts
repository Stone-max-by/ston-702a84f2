import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPurchase {
  id: string;
  type: 'bot' | 'product';
  itemId: string;
  itemName: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export function useUserPurchases() {
  const { user } = useAuth();
  const [botPurchases, setBotPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setBotPurchases([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "bot_purchases"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: UserPurchase[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            type: 'bot',
            itemId: data.botId || '',
            itemName: data.botName || 'Unknown Bot',
            amount: data.amount || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setBotPurchases(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user purchases:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const totalSpent = botPurchases.reduce((sum, p) => sum + p.amount, 0);

  return {
    botPurchases,
    loading,
    totalSpent,
    totalPurchases: botPurchases.length,
  };
}
