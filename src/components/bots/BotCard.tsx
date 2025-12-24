import { Download, Folder, Star } from "lucide-react";
import { TelegramBot } from "@/types/bot";

interface BotCardProps {
  bot: TelegramBot;
  onClick: () => void;
}

export function BotCard({ bot, onClick }: BotCardProps) {
  const hasDiscount = bot.originalPrice && bot.originalPrice > bot.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - bot.price / bot.originalPrice!) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className="glass-card overflow-hidden cursor-pointer animate-fade-in hover:border-primary/30 transition-colors"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={bot.image}
          alt={bot.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground">{bot.category}</span>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-1.5 right-1.5">
          {hasDiscount ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/90 text-white">
              -{discountPercent}%
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground">
              ₹{bot.price}
            </span>
          )}
        </div>
        
        {/* Rating badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-card/90 backdrop-blur-sm text-foreground">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="text-[10px] font-medium">{bot.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="p-2 space-y-1">
        <h3 className="font-medium text-xs text-foreground line-clamp-1">
          {bot.name}
        </h3>

        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {bot.shortDescription}
        </p>

        <div className="flex flex-wrap gap-1">
          {bot.features?.slice(0, 2).map((feature, index) => (
            <span key={index} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}