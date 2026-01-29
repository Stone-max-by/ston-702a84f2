import { Star, ChevronRight } from "lucide-react";
import { TelegramBot } from "@/types/bot";

interface BotCardListProps {
  bot: TelegramBot;
  onClick: () => void;
}

export function BotCardList({ bot, onClick }: BotCardListProps) {
  const hasDiscount = bot.originalPrice && bot.originalPrice > bot.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - bot.price / bot.originalPrice!) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className="glass-card overflow-hidden cursor-pointer animate-fade-in hover:border-primary/30 transition-colors flex gap-3 p-3"
    >
      {/* Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
        <img
          src={bot.image}
          alt={bot.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {hasDiscount && (
          <div className="absolute top-1 right-1">
            <span className="text-[9px] px-1 py-0.5 rounded-full bg-destructive/90 text-white">
              -{discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-1">
              {bot.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              {bot.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {bot.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Rating */}
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span className="text-[10px] font-medium text-foreground">{bot.rating.toFixed(1)}</span>
            </div>
            
            {/* Features count */}
            <span className="text-[10px] text-muted-foreground">
              {bot.features?.length || 0} features
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5">
            {hasDiscount && (
              <span className="text-[10px] text-muted-foreground line-through">
                ₹{bot.originalPrice}
              </span>
            )}
            <span className="text-sm font-bold text-primary">₹{bot.price}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
