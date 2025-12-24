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
      <SheetContent side="bottom" className="bg-card border-white/10 h-[80vh] rounded-t-2xl !p-0">
        <div className="flex flex-col h-full">
          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          
          <SheetHeader className="px-4 pb-3 pr-12">
            <SheetTitle className="flex items-center gap-3 text-foreground">
              <button 
                onClick={handleShare} 
                className="shrink-0 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5 text-muted-foreground" />}
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-base font-bold truncate">{bot.name}</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Thumbnail */}
            <div className="relative rounded-xl overflow-hidden bg-background">
              <img 
                src={bot.image} 
                alt={bot.name} 
                className="w-full h-auto max-h-52 object-contain bg-black/20" 
              />
              {hasDiscount && (
                <Badge className="absolute top-3 right-3 bg-destructive/90 text-destructive-foreground text-sm px-2 py-1">
                  -{discountPercent}%
                </Badge>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs px-2.5 py-1">{bot.category}</Badge>
              {bot.features?.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2.5 py-1 bg-muted/50">{feature}</Badge>
              ))}
            </div>

            {/* Stats & Rating */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <StarRating value={bot.rating} readonly size="sm" showValue />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Users className="w-4 h-4" />
                <span className="font-medium">{bot.totalSales} sales</span>
              </span>
            </div>

            {/* User Rating */}
            <div className="bg-background rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-foreground mb-3">Rate this Bot</h4>
              <StarRating value={userRating} onChange={handleRating} size="lg" />
            </div>

            {/* Description */}
            <div className="bg-background rounded-xl p-4 border border-white/10">
              <p className="text-sm text-foreground/80 leading-relaxed">{bot.description}</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="text-foreground font-medium">Instant</span>
              </div>
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-success" />
                <span className="text-foreground font-medium">Secure</span>
              </div>
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <span className="text-foreground font-medium">24/7 Support</span>
              </div>
            </div>

            {/* All Features */}
            {bot.features && bot.features.length > 0 && (
              <div className="bg-background rounded-xl p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {bot.features.map((feature, index) => (
                    <span key={index} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price Info */}
            <div className="flex items-center justify-between bg-background rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Tag className="w-4 h-4" />
                <span>Price</span>
              </div>
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="text-base text-muted-foreground line-through">
                    ₹{bot.originalPrice}
                  </span>
                )}
                <span className="font-bold text-xl text-success">₹{bot.price}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-white/10 bg-card">
            <Button onClick={onGetNow} className="w-full h-12 text-base font-bold gap-2">
              <Zap className="w-5 h-5" />
              Get Now - ₹{bot.price}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
