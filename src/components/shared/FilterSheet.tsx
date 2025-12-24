import { useState } from "react";
import { Filter, ArrowUpDown, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "popular" | "downloads";

interface FilterSheetProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
  showPriceSort?: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "popular", label: "Most Popular" },
  { value: "downloads", label: "Most Downloads" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

export function FilterSheet({ 
  sortBy, 
  onSortChange, 
  resultCount,
  showPriceSort = true 
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  const filteredOptions = showPriceSort 
    ? sortOptions 
    : sortOptions.filter(opt => !opt.value.startsWith("price"));

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Sort";

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {resultCount} {resultCount === 1 ? 'item' : 'items'} found
      </p>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            <ArrowUpDown className="w-3 h-3 ml-1" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Sort & Filter</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Sort By</h4>
              <div className="grid grid-cols-2 gap-2">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      sortBy === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}