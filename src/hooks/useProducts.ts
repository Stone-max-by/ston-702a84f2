import { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductType } from "@/types/product";
import { dummyProducts } from "@/data/dummyProducts";

// Convert dummy products to full Product format
const getDummyProductsWithIds = (): Product[] => {
  return dummyProducts.map((p, index) => ({
    ...p,
    id: `dummy-${index + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })) as Product[];
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        productList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Product);
      });
      
      // Use dummy products if no products in Firebase
      if (productList.length === 0) {
        setProducts(getDummyProductsWithIds());
      } else {
        setProducts(productList);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      // Fallback to dummy products on error
      setProducts(getDummyProductsWithIds());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (productData: Partial<Product>) => {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  };

  // Filter products by type
  const getProductsByType = (type: ProductType) => {
    return products.filter((p) => p.type === type);
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByType,
  };
}
