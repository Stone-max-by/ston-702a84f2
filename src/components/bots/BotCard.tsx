import { Star, Zap, Users } from "lucide-react";
import { TelegramBot } from "@/types/bot";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      className="group relative bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={bot.image} 
          alt={bot.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
            {bot.category}
          </Badge>
          {hasDiscount && (
            <Badge className="bg-destructive/90 text-destructive-foreground text-xs">
              -{discountPercent}%
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="text-xs font-medium">{bot.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-1">{bot.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{bot.shortDescription}</p>
        
        {/* Stats & Price */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              <span>{bot.totalSales}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-primary" />
              <span>Instant</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{bot.originalPrice}
              </span>
            )}
            <span className={cn(
              "font-bold text-sm",
              hasDiscount ? "text-success" : "text-foreground"
            )}>
              ₹{bot.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
