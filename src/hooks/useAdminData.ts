import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  getDocs,
  orderBy,
  limit,
  increment
} from "firebase/firestore";
import { UserData } from "@/types/user";
import { ApiEndpoint, ApiCategory } from "@/types/api";

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalPurchases: number;
  totalRevenue: number;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as UserData[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserBalance = useCallback(async (userId: string, amount: number) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      balance: increment(amount),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const updateUserCoins = useCallback(async (userId: string, amount: number) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      coins: increment(amount),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const banUser = useCallback(async (userId: string, banned: boolean) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      banned,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  return {
    users,
    loading,
    updateUserBalance,
    updateUserCoins,
    banUser,
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalPurchases: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, transactionsSnap, purchasesSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "transactions")),
          getDocs(collection(db, "purchases")),
        ]);

        let totalRevenue = 0;
        transactionsSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.type === "deposit" && data.amount > 0) {
            totalRevenue += data.amount;
          }
        });

        setStats({
          totalUsers: usersSnap.size,
          totalTransactions: transactionsSnap.size,
          totalPurchases: purchasesSnap.size,
          totalRevenue,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Also set up real-time listener for users count
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}

export function useAdminApiCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoriesQuery = query(collection(db, "apiCategories"));
    
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as ApiCategory[];
      setCategories(categoriesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = useCallback(async (category: Omit<ApiCategory, "id">) => {
    try {
      await addDoc(collection(db, "apiCategories"), {
        ...category,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Firestore addCategory error:", error);
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<ApiCategory>) => {
    try {
      const categoryRef = doc(db, "apiCategories", id);
      await updateDoc(categoryRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Firestore updateCategory error:", error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "apiCategories", id));
    } catch (error) {
      console.error("Firestore deleteCategory error:", error);
      throw error;
    }
  }, []);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useAdminApiEndpoints() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpointsQuery = query(collection(db, "apiEndpoints"));
    
    const unsubscribe = onSnapshot(endpointsQuery, (snapshot) => {
      const endpointsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as ApiEndpoint[];
      setEndpoints(endpointsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching endpoints:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addEndpoint = useCallback(async (endpoint: Omit<ApiEndpoint, "id">) => {
    try {
      await addDoc(collection(db, "apiEndpoints"), {
        ...endpoint,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Firestore addEndpoint error:", error);
      throw error;
    }
  }, []);

  const updateEndpoint = useCallback(async (id: string, data: Partial<ApiEndpoint>) => {
    try {
      const endpointRef = doc(db, "apiEndpoints", id);
      await updateDoc(endpointRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Firestore updateEndpoint error:", error);
      throw error;
    }
  }, []);

  const deleteEndpoint = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "apiEndpoints", id));
    } catch (error) {
      console.error("Firestore deleteEndpoint error:", error);
      throw error;
    }
  }, []);

  return {
    endpoints,
    loading,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
  };
}
