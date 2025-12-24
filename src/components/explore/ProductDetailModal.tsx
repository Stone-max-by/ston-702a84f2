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
  Star,
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
                <span className="text-base">{productTypeIcons[product.type]}</span>
                <span className="text-sm font-semibold truncate">{product.title}</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Thumbnail */}
            <div className="relative rounded-lg overflow-hidden bg-background">
              <img 
                src={screenshots[0]} 
                alt={product.title} 
                className="w-full h-auto max-h-48 object-contain bg-black/20" 
              />
              {screenshots.length > 1 && (
                <Badge className="absolute bottom-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-[11px] px-1.5 py-0.5">
                  +{screenshots.length - 1}
                </Badge>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{productTypeLabels[product.type]}</Badge>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">{product.category}</Badge>
              {product.isNew && <Badge className="bg-green-500/20 text-green-400 border-0 text-[11px] px-2 py-0.5">NEW</Badge>}
              {product.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px] px-2 py-0.5 bg-muted/50">{tag}</Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                <Download className="w-3 h-3" />{product.downloads}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                <Eye className="w-3 h-3" />{product.views}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                <Heart className="w-3 h-3" />{product.likes}
              </span>
              {product.rating && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{product.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-background rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{product.description}</p>
            </div>

            {/* File Info Grid */}
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <HardDrive className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <span className="text-foreground">{product.sizeFormatted}</span>
              </div>
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <FileArchive className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <span className="text-foreground">{product.filesCount}</span>
              </div>
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <span className="text-foreground">v{product.version}</span>
              </div>
              <div className="bg-background rounded-lg p-2 border border-white/5 text-center">
                <Calendar className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <span className="text-foreground">{product.releaseYear}</span>
              </div>
            </div>

            {/* Platform & Uploader Row */}
            <div className="flex items-center justify-between text-xs bg-background rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground">
                {product.platform?.length > 0 && (
                  <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" />{product.platform.join(", ")}</span>
                )}
                {product.language?.length > 0 && (
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{product.language[0]}</span>
                )}
              </div>
              <span className="text-foreground font-medium">{product.uploader}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-3 border-t border-white/5 bg-card">
            {isOwned ? (
              <Button onClick={handleAction} className="w-full h-10 text-sm font-semibold gap-1.5 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" />Download (Owned)
              </Button>
            ) : product.isFree && !product.unlockByAds ? (
              <Button onClick={handleAction} className="w-full h-10 text-sm font-semibold gap-1.5 bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4" />Download Free
              </Button>
            ) : product.unlockByAds ? (
              <Button onClick={handleAction} className="w-full h-10 text-sm font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700">
                <Play className="w-4 h-4" />Watch {product.adCreditsRequired} Ad{(product.adCreditsRequired || 1) > 1 ? 's' : ''}
              </Button>
            ) : (
              <Button onClick={handleAction} disabled={purchasing} className="w-full h-10 text-sm font-semibold gap-1.5">
                {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                {purchasing ? "Processing..." : `Buy for ${product.coinPrice} Coins`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
