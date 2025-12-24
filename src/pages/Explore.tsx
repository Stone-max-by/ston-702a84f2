import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProducts } from "@/hooks/useProducts";
import { ProductType, productTypeLabels, productTypeIcons } from "@/types/product";
import { Loader2 } from "lucide-react";
import { GameCardGrid } from "@/components/games/GameCardGrid";
import { GameCardList } from "@/components/games/GameCardList";
import { SearchBar } from "@/components/games/SearchBar";
import { FilterBar } from "@/components/games/FilterBar";
import { cn } from "@/lib/utils";

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
  const [selectedCategory, setSelectedCategory] = useState<ProductType | "all">("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { products, loading } = useProducts();

  // Get visible products only
  const visibleProducts = useMemo(() => {
    return products.filter(p => p.visible !== false);
  }, [products]);

  // Count products by category
  const categoryCounts = useMemo(() => {
    const counts: Record<ProductType | "all", number> = {
      all: visibleProducts.length,
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

  // Filter products by selected category and search
  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory === "all" 
      ? visibleProducts 
      : visibleProducts.filter(p => p.type === selectedCategory);
    
    if (search.trim()) {
      filtered = filtered.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    return filtered;
  }, [selectedCategory, visibleProducts, search]);

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
    <AppLayout title="Explore">
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span>🔥</span>
            <span>All</span>
            <span className="text-xs opacity-70">({categoryCounts.all})</span>
          </button>
          
          {availableCategories.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCategory(type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{productTypeIcons[type]}</span>
              <span>{productTypeLabels[type]}</span>
              <span className="text-xs opacity-70">({categoryCounts[type]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Filter Bar */}
        <FilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          gamesCount={filteredProducts.length}
        />

        {/* Products */}
        {filteredProducts.length === 0 ? (
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
