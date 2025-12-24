import { useState, useMemo } from "react";
import { Bot, Search, Sparkles, TrendingUp, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BotCard } from "@/components/bots/BotCard";
import { BotDetailModal } from "@/components/bots/BotDetailModal";
import { BotPurchaseModal } from "@/components/bots/BotPurchaseModal";
import { useBots } from "@/hooks/useBots";
import { TelegramBot } from "@/types/bot";
import { FilterSheet, SortOption } from "@/components/shared/FilterSheet";
import { cn } from "@/lib/utils";

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'utility', label: 'Utility', icon: TrendingUp },
  { id: 'entertainment', label: 'Entertainment', icon: Clock },
];

export default function BotMarketplace() {
  const { bots, loading, error } = useBots();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [selectedBot, setSelectedBot] = useState<TelegramBot | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const filteredBots = useMemo(() => {
    let filtered = bots.filter(bot => {
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || bot.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort bots
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "popular":
          return (b.totalSales || 0) - (a.totalSales || 0);
        case "downloads":
          return (b.totalSales || 0) - (a.totalSales || 0);
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [bots, searchQuery, selectedCategory, sortBy]);

  const handleBotClick = (bot: TelegramBot) => {
    setSelectedBot(bot);
    setDetailModalOpen(true);
  };

  const handleGetNow = () => {
    setDetailModalOpen(false);
    setPurchaseModalOpen(true);
  };

  return (
    <AppLayout title="Bot Marketplace">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Telegram Bots</h2>
            <p className="text-xs text-muted-foreground">Buy & deploy instantly</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Stats Banner */}
        <div className="flex gap-2">
          <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <p className="text-lg font-bold">{bots.length}</p>
            <p className="text-xs text-muted-foreground">Total Bots</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-success/10 to-transparent border border-success/20">
            <p className="text-lg font-bold text-success">Instant</p>
            <p className="text-xs text-muted-foreground">Delivery</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
            <p className="text-lg font-bold text-yellow-500">24/7</p>
            <p className="text-xs text-muted-foreground">Support</p>
          </div>
        </div>

        {/* Filter & Results */}
        <FilterSheet
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={filteredBots.length}
          showPriceSort={true}
        />

        {/* Bot Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No bots found</p>
            <p className="text-xs text-muted-foreground/70">Try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredBots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onClick={() => handleBotClick(bot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <BotDetailModal
        bot={selectedBot}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onGetNow={handleGetNow}
      />

      {/* Purchase Modal */}
      <BotPurchaseModal
        bot={selectedBot}
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
      />
    </AppLayout>
  );
}
