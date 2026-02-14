import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: "bot" | "product";
  isActive: boolean;
  order: number;
  createdAt?: any;
}

export function useCategories(type?: "bot" | "product") {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const ref = collection(db, "categories");
      const q = query(ref, orderBy("order", "asc"));
      const snapshot = await getDocs(q);

      let cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || 0),
      })) as Category[];

      if (type) {
        cats = cats.filter(c => c.type === type);
      }

      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const addCategory = async (data: Omit<Category, "id" | "createdAt">) => {
    await addDoc(collection(db, "categories"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    fetchCategories();
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    await updateDoc(doc(db, "categories", id), data);
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
  };

  // Get only active category names
  const activeCategories = categories.filter(c => c.isActive);
  const categoryNames = activeCategories.map(c => c.name);

  return {
    categories,
    activeCategories,
    categoryNames,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
