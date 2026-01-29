import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BotPurchase {
  id: string;
  botId: string;
  botName: string;
  userId: string;
  userName: string;
  telegramId?: number;
  amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  createdAt: Date;
}

export function useBotPurchases() {
  const [purchases, setPurchases] = useState<BotPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "bot_purchases"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: BotPurchase[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            botId: data.botId || '',
            botName: data.botName || 'Unknown Bot',
            userId: data.userId || '',
            userName: data.userName || 'Unknown User',
            telegramId: data.telegramId,
            amount: data.amount || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setPurchases(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching bot purchases:", err);
        setError("Failed to load purchases");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = purchases.filter(p => p.status === 'pending').length;
  const deliveredCount = purchases.filter(p => p.status === 'delivered').length;

  return {
    purchases,
    loading,
    error,
    totalRevenue,
    pendingCount,
    deliveredCount,
  };
}
