import { useState, useMemo } from "react";
import { Product, ProductType, productTypeLabels, productTypeIcons } from "@/types/product";
import { SearchBar } from "@/components/games/SearchBar";
import { FilterBar } from "@/components/games/FilterBar";
import { GameCardGrid } from "@/components/games/GameCardGrid";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductListProps {
  products: Product[];
  category: ProductType;
  onBack: () => void;
}

export function ProductList({ products, category, onBack }: ProductListProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, products]);

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{productTypeIcons[category]}</span>
          <h2 className="text-lg font-semibold text-foreground">
            {productTypeLabels[category]}
          </h2>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <FilterBar gamesCount={filteredProducts.length} />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found in this category
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <GameCardGrid key={product.id} game={product} />
          ))}
        </div>
      )}
    </div>
  );
}