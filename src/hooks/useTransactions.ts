import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { Transaction } from "@/types/transaction";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserId = useCallback(() => {
    if (!user?.telegramId) return null;
    return String(user.telegramId);
  }, [user]);

  useEffect(() => {
    const userId = getUserId();
    
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const txns: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(txns);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [getUserId]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "date">) => {
    const userId = getUserId();
    if (!userId) return null;

    const docRef = await addDoc(collection(db, "transactions"), {
      ...transaction,
      userId,
      date: new Date().toISOString(),
    });

    return docRef.id;
  }, [getUserId]);

  return {
    transactions,
    loading,
    addTransaction,
  };
}
