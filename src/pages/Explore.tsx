import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProducts } from "@/hooks/useProducts";
import { Product, ProductType, productTypeLabels, productTypeIcons } from "@/types/product";
import { Loader2, Search } from "lucide-react";
import { GameCardGrid } from "@/components/games/GameCardGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductDetailModal } from "@/components/explore/ProductDetailModal";
import { FilterSheet, SortOption } from "@/components/shared/FilterSheet";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

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
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, loading } = useProducts();

  // Reset visible count when category or search changes
  const handleCategoryChange = (category: ProductType | "all") => {
    setSelectedCategory(category);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

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

  // Filter and sort products
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

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "downloads":
          return (b.downloads || 0) - (a.downloads || 0);
        case "price_low":
          return (a.priceUSD || 0) - (b.priceUSD || 0);
        case "price_high":
          return (b.priceUSD || 0) - (a.priceUSD || 0);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [selectedCategory, visibleProducts, search, sortBy]);

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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <span>🔥</span>
            <span>All</span>
            <span className="opacity-70">({categoryCounts.all})</span>
          </button>
          
          {availableCategories.map((type) => (
            <button
              key={type}
              onClick={() => handleCategoryChange(type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{productTypeIcons[type]}</span>
              <span>{productTypeLabels[type]}</span>
              <span className="opacity-70">({categoryCounts[type]})</span>
            </button>
          ))}
        </div>

        {/* Filter & Results Count */}
        <FilterSheet
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={filteredProducts.length}
          showPriceSort={true}
        />

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <GameCardGrid 
                  key={product.id} 
                  game={product} 
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  className="w-full max-w-xs"
                >
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </AppLayout>
  );
}
