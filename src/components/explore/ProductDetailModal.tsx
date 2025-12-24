import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  Heart,
  Calendar,
  HardDrive,
  FileArchive,
  Globe,
  Monitor,
  Share2,
  Clock,
  Play,
  Coins,
  CheckCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Product, productTypeLabels, productTypeIcons } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "@/hooks/use-toast";
import { StarRating } from "@/components/shared/StarRating";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, open, onClose }: ProductDetailModalProps) {
  const { requireAuth } = useRequireAuth();
  const { coins, updateCoins, addPurchasedFile, hasFile } = useUserData();
  const [purchasing, setPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);

  if (!product) return null;

  const isOwned = hasFile(product.id);
  const screenshots = product.screenshots?.length ? product.screenshots : [product.thumbnail];

  const handleAction = async () => {
    if (!requireAuth("access this product")) return;
    
    if (isOwned) {
      toast({ title: "Download Started", description: `Downloading ${product.title}...` });
      return;
    }
    
    if (product.isFree && !product.unlockByAds) {
      await addPurchasedFile(product.id);
      toast({ title: "Download Started", description: `Downloading ${product.title}...` });
      return;
    }
    
    if (product.unlockByAds) {
      toast({ title: "Watch Ads Required", description: `Watch ${product.adCreditsRequired} ad(s) to unlock` });
      return;
    }
    
    const price = product.coinPrice || 0;
    if (coins < price) {
      toast({ title: "Insufficient Coins", description: `Need ${price} coins, have ${coins}`, variant: "destructive" });
      return;
    }
    
    try {
      setPurchasing(true);
      await updateCoins(coins - price);
      await addPurchasedFile(product.id);
      toast({ title: "Purchase Successful!", description: `${product.title} is now yours.` });
    } catch {
      toast({ title: "Purchase Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/product/${product.slug || product.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link Copied" });
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    toast({ title: "Rating Submitted", description: `You rated ${product.title} ${rating} stars` });
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
                <span className="text-lg">{productTypeIcons[product.type]}</span>
                <span className="text-base font-bold truncate">{product.title}</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Thumbnail */}
            <div className="relative rounded-xl overflow-hidden bg-background">
              <img 
                src={screenshots[0]} 
                alt={product.title} 
                className="w-full h-auto max-h-52 object-contain bg-black/20" 
              />
              {screenshots.length > 1 && (
                <Badge className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1">
                  +{screenshots.length - 1}
                </Badge>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs px-2.5 py-1">{productTypeLabels[product.type]}</Badge>
              <Badge variant="outline" className="text-xs px-2.5 py-1">{product.category}</Badge>
              {product.isNew && <Badge className="bg-green-500/20 text-green-400 border-0 text-xs px-2.5 py-1">NEW</Badge>}
              {product.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2.5 py-1 bg-muted/50">{tag}</Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Download className="w-4 h-4" />
                <span className="font-medium">{product.downloads}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{product.views}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Heart className="w-4 h-4" />
                <span className="font-medium">{product.likes}</span>
              </span>
              {product.rating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                  <StarRating value={product.rating} readonly size="sm" showValue />
                </div>
              )}
            </div>

            {/* User Rating */}
            <div className="bg-background rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-foreground mb-3">Rate this Product</h4>
              <StarRating value={userRating} onChange={handleRating} size="lg" />
            </div>

            {/* Description */}
            <div className="bg-background rounded-xl p-4 border border-white/10">
              <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>
            </div>

            {/* File Info Grid */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <HardDrive className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-foreground font-medium">{product.sizeFormatted}</span>
              </div>
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <FileArchive className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-foreground font-medium">{product.filesCount}</span>
              </div>
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-foreground font-medium">v{product.version}</span>
              </div>
              <div className="bg-background rounded-xl p-3 border border-white/10 text-center">
                <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-foreground font-medium">{product.releaseYear}</span>
              </div>
            </div>

            {/* Platform & Uploader Row */}
            <div className="flex items-center justify-between text-sm bg-background rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 text-muted-foreground">
                {product.platform?.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-4 h-4" />
                    <span className="font-medium">{product.platform.join(", ")}</span>
                  </span>
                )}
                {product.language?.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">{product.language[0]}</span>
                  </span>
                )}
              </div>
              <span className="text-foreground font-semibold">{product.uploader}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-white/10 bg-card">
            {isOwned ? (
              <Button onClick={handleAction} className="w-full h-12 text-base font-bold gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-5 h-5" />Download (Owned)
              </Button>
            ) : product.isFree && !product.unlockByAds ? (
              <Button onClick={handleAction} className="w-full h-12 text-base font-bold gap-2 bg-green-600 hover:bg-green-700">
                <Download className="w-5 h-5" />Download Free
              </Button>
            ) : product.unlockByAds ? (
              <Button onClick={handleAction} className="w-full h-12 text-base font-bold gap-2 bg-amber-600 hover:bg-amber-700">
                <Play className="w-5 h-5" />Watch {product.adCreditsRequired} Ad{(product.adCreditsRequired || 1) > 1 ? 's' : ''}
              </Button>
            ) : (
              <Button onClick={handleAction} disabled={purchasing} className="w-full h-12 text-base font-bold gap-2">
                {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coins className="w-5 h-5" />}
                {purchasing ? "Processing..." : `Buy for ${product.coinPrice} Coins`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
