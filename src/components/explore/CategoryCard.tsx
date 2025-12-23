import { ProductType, productTypeLabels, productTypeIcons } from "@/types/product";
import { ChevronRight } from "lucide-react";

interface CategoryCardProps {
  type: ProductType;
  count: number;
  onClick: () => void;
}

export function CategoryCard({ type, count, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-4 flex items-center gap-4 w-full text-left hover:border-primary/30 transition-all active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
        {productTypeIcons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{productTypeLabels[type]}</h3>
        <p className="text-sm text-muted-foreground">{count} items</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}