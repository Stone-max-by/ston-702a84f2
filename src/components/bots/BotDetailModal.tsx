import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Users,
  Zap,
  Shield,
  Clock,
  Share2,
  Check,
  Tag,
  Code,
} from "lucide-react";
import { TelegramBot } from "@/types/bot";
import { toast } from "@/hooks/use-toast";
import { StarRating } from "@/components/shared/StarRating";

interface BotDetailModalProps {
  bot: TelegramBot | null;
  open: boolean;
  onClose: () => void;
  onGetNow: () => void;
}

export function BotDetailModal({ bot, open, onClose, onGetNow }: BotDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);

  if (!bot) return null;

  const hasDiscount = bot.originalPrice && bot.originalPrice > bot.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - bot.price / bot.originalPrice!) * 100) 
    : 0;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/bots/${bot.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link Copied" });
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    toast({ title: "Rating Submitted", description: `You rated ${bot.name} ${rating} stars` });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-card border-white/10 h-[75vh] rounded-t-2xl !p-0">
        <div className="flex flex-col h-full">
          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          
          <SheetHeader className="px-4 pb-2 pr-12">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <button 
                onClick={handleShare} 
                className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold truncate">{bot.name}</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Thumbnail */}
            <div className="relative rounded-lg overflow-hidden bg-background">
              <img 
                src={bot.image} 
                alt={bot.name} 
                className="w-full h-auto max-h-48 object-contain bg-black/20" 
              />
              {hasDiscount && (
                <Badge className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs">
                  -{discountPercent}%
                </Badge>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{bot.category}</Badge>
              {bot.features?.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-[11px] px-2 py-0.5 bg-muted/50">{feature}</Badge>
              ))}
            </div>

            {/* Stats & Rating */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                <StarRating value={bot.rating} readonly size="sm" showValue />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                <Users className="w-3 h-3" />{bot.totalSales} sales
              </span>
            </div>

            {/* User Rating */}
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-xs font-semibold text-foreground mb-2">Rate this Bot</h4>
              <StarRating value={userRating} onChange={handleRating} size="md" />
            </div>

            {/* Description */}
            <div className="bg-background rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-foreground/80 leading-relaxed">{bot.description}</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <Zap className="w-4 h-4 mx-auto mb-0.5 text-primary" />
                <span className="text-foreground">Instant</span>
              </div>
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <Shield className="w-4 h-4 mx-auto mb-0.5 text-success" />
                <span className="text-foreground">Secure</span>
              </div>
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <Clock className="w-4 h-4 mx-auto mb-0.5 text-yellow-500" />
                <span className="text-foreground">24/7 Support</span>
              </div>
            </div>

            {/* All Features */}
            {bot.features && bot.features.length > 0 && (
              <div className="bg-background rounded-lg p-2.5 border border-white/5">
                <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" /> Features
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {bot.features.map((feature, index) => (
                    <span key={index} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price Info */}
            <div className="flex items-center justify-between bg-background rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Tag className="w-3.5 h-3.5" />
                <span>Price</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{bot.originalPrice}
                  </span>
                )}
                <span className="font-bold text-base text-success">₹{bot.price}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-3 border-t border-white/5 bg-card">
            <Button onClick={onGetNow} className="w-full h-10 text-sm font-semibold gap-1.5">
              <Zap className="w-4 h-4" />
              Get Now - ₹{bot.price}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
