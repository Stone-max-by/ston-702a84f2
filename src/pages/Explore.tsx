import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBar } from "@/components/games/SearchBar";
import { FilterBar } from "@/components/games/FilterBar";
import { GameCardGrid } from "@/components/games/GameCardGrid";
import { GameCardList } from "@/components/games/GameCardList";
import { useProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { products, loading } = useProducts();

  const filteredProducts = useMemo(() => {
    // Only show visible products
    const visibleProducts = products.filter(p => p.visible !== false);
    
    if (!search.trim()) return visibleProducts;
    return visibleProducts.filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, products]);

  return (
    <AppLayout title="Explore Products">
      <div className="space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        <FilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          gamesCount={filteredProducts.length}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <GameCardGrid key={product.id} game={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <GameCardList key={product.id} game={product} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
