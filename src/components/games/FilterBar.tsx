import { Filter, ArrowUpDown, Sun } from "lucide-react";

interface FilterBarProps {
  gamesCount: number;
}

export function FilterBar({ gamesCount }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="filter-btn relative">
            <Filter className="w-4 h-4" />
          </button>
          <button className="filter-btn relative">
            <ArrowUpDown className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground">
              2
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="filter-btn">
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {gamesCount.toLocaleString()} games found
      </p>
    </div>
  );
}
