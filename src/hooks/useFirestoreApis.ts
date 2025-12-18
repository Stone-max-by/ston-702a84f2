import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ApiProvider, ApiEndpoint, ApiCategory } from "@/types/api";

export function useFirestoreApis() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesRef = collection(db, "apiCategories");
        const categoriesQuery = query(categoriesRef, where("isActive", "==", true));
        const categoriesSnap = await getDocs(categoriesQuery);
        
        const categories: ApiCategory[] = categoriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ApiCategory[];

        // Fetch endpoints
        const endpointsRef = collection(db, "apiEndpoints");
        const endpointsQuery = query(endpointsRef, where("isActive", "==", true));
        const endpointsSnap = await getDocs(endpointsQuery);
        
        const endpoints: ApiEndpoint[] = endpointsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ApiEndpoint[];

        // Group endpoints by category and create providers
        const providersData: ApiProvider[] = categories.map(category => {
          const categoryEndpoints = endpoints.filter(
            ep => ep.categoryId === category.id
          );
          
          return {
            id: category.id,
            name: category.name,
            description: category.description,
            baseUrl: category.baseUrl,
            icon: category.icon || "🔌",
            color: category.color || "from-primary/20 to-primary/10",
            totalEndpoints: categoryEndpoints.length,
            totalRequests: 0, // Can be updated with real stats later
            successRate: 99.5,
            avgResponseTime: 200,
            endpoints: categoryEndpoints,
          };
        });

        setProviders(providersData);
        setError(null);
      } catch (err) {
        console.error("Error fetching API data:", err);
        setError("Failed to load APIs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { providers, loading, error, refetch: () => {} };
}
