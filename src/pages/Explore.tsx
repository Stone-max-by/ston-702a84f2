import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryCard } from "@/components/explore/CategoryCard";
import { ProductList } from "@/components/explore/ProductList";
import { useProducts } from "@/hooks/useProducts";
import { ProductType } from "@/types/product";
import { Loader2 } from "lucide-react";

const PRODUCT_TYPES: ProductType[] = [
  "game",
  "code",
  "pixellab_plp",
  "capcut_template",
  "font",
  "preset",
  "other",
];

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<ProductType | null>(null);
  const { products, loading } = useProducts();

  // Get visible products only
  const visibleProducts = useMemo(() => {
    return products.filter(p => p.visible !== false);
  }, [products]);

  // Count products by category
  const categoryCounts = useMemo(() => {
    const counts: Record<ProductType, number> = {
      game: 0,
      code: 0,
      pixellab_plp: 0,
      capcut_template: 0,
      font: 0,
      preset: 0,
      other: 0,
    };

    visibleProducts.forEach((product) => {
      if (counts[product.type] !== undefined) {
        counts[product.type]++;
      }
    });

    return counts;
  }, [visibleProducts]);

  // Filter products by selected category
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return visibleProducts.filter(p => p.type === selectedCategory);
  }, [selectedCategory, visibleProducts]);

  // Categories with at least one product
  const availableCategories = PRODUCT_TYPES.filter(type => categoryCounts[type] > 0);

  if (loading) {
    return (
      <AppLayout title="Explore">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={selectedCategory ? "Products" : "Explore"}>
      {selectedCategory ? (
        <ProductList
          products={categoryProducts}
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
        />
      ) : (
        <div className="space-y-3">
          {availableCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No categories available yet
            </div>
          ) : (
            availableCategories.map((type) => (
              <CategoryCard
                key={type}
                type={type}
                count={categoryCounts[type]}
                onClick={() => setSelectedCategory(type)}
              />
            ))
          )}
        </div>
      )}
    </AppLayout>
  );
}