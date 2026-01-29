import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Promotion {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreatePromotionData {
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  expiresAt?: Date;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "promotions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Promotion[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            title: data.title || '',
            message: data.message || '',
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl,
            linkText: data.linkText,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            expiresAt: data.expiresAt?.toDate?.(),
          });
        });
        setPromotions(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching promotions:", err);
        setError("Failed to load promotions");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createPromotion = async (data: CreatePromotionData) => {
    try {
      await addDoc(collection(db, "promotions"), {
        ...data,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error creating promotion:", err);
      return false;
    }
  };

  const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    try {
      await updateDoc(doc(db, "promotions", id), data);
      return true;
    } catch (err) {
      console.error("Error updating promotion:", err);
      return false;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await deleteDoc(doc(db, "promotions", id));
      return true;
    } catch (err) {
      console.error("Error deleting promotion:", err);
      return false;
    }
  };

  const togglePromotion = async (id: string, isActive: boolean) => {
    return updatePromotion(id, { isActive });
  };

  const activePromotions = promotions.filter(p => p.isActive);

  return {
    promotions,
    activePromotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
  };
}
