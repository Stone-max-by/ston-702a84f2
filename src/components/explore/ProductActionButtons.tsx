import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Wallet,
  Play,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "@/hooks/use-toast";
import { showRewardedAd } from "@/lib/monetag";
import { Progress } from "@/components/ui/progress";

interface ProductActionButtonsProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

export function ProductActionButtons({ product, onPurchaseComplete }: ProductActionButtonsProps) {
  const { requireAuth } = useRequireAuth();
  const { balance, hasFile, purchaseProduct, watchAdForProduct, productAdProgress } = useUserData();
  const [purchasing, setPurchasing] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  const isOwned = hasFile(product.id);
  
  const hasPrice = (product.price || 0) > 0;
  const hasAds = product.unlockByAds && (product.adCreditsRequired || 0) > 0;
  const hasShortlink = !!product.shortlinkUrl;
  const isFreeDownload = product.isFree && !hasAds && !hasPrice && !hasShortlink;

  const handlePurchase = async () => {
    if (!requireAuth("purchase this product")) return;
    
    setPurchasing(true);
    try {
      const result = await purchaseProduct(product.id);
      
      if (result.alreadyOwned) {
        toast({ title: "File Sent! 📨", description: "Check your Telegram messages" });
      } else if (result.success) {
        toast({ title: "Purchase Successful!", description: `${product.title} is now yours.` });
        if (result.fileSent) {
          toast({ title: "File Sent! 📨", description: "Check your Telegram messages" });
        }
        onPurchaseComplete?.();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Purchase Failed", description: message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const handleWatchAdForProduct = async () => {
    if (!requireAuth("unlock this product")) return;
    
    setWatchingAd(true);
    try {
      // First show the Monetag ad
      const adCompleted = await showRewardedAd();
      if (!adCompleted) {
        toast({ title: "Ad Not Completed", description: "Please watch the full ad.", variant: "destructive" });
        setWatchingAd(false);
        return;
      }

      // Ad watched → record on backend
      const result = await watchAdForProduct(product.id);
      
      if (result.alreadyOwned) {
        toast({ title: "File Sent! 📨", description: "Check your Telegram messages" });
      } else if (result.unlocked) {
        toast({ title: "Product Unlocked! 🎉", description: `${product.title} is now yours!` });
        if (result.fileSent) {
          toast({ title: "File Sent! 📨", description: "Check your Telegram messages" });
        }
        onPurchaseComplete?.();
      } else {
        toast({ title: "Ad Watched! ✅", description: `${result.adsWatched}/${result.adsRequired} ads done.` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setWatchingAd(false);
    }
  };

  const handleShortlink = () => {
    if (!product.shortlinkUrl) return;
    window.open(product.shortlinkUrl, "_blank", "noopener,noreferrer");
  };

  // If already owned, show download button
  if (isOwned) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={handlePurchase} 
          disabled={purchasing}
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {purchasing ? "Sending..." : "Download (Owned)"}
        </Button>
      </div>
    );
  }

  // Free download
  if (isFreeDownload) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={handlePurchase} 
          disabled={purchasing}
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {purchasing ? "Sending..." : "Download Free"}
        </Button>
      </div>
    );
  }

  // Multiple options
  const buttons = [];
  
  if (hasPrice) {
    buttons.push(
      <Button 
        key="balance"
        onClick={handlePurchase} 
        disabled={purchasing}
        className="flex-1 h-11 text-sm font-semibold gap-2"
      >
        {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
        {purchasing ? "Processing..." : `₹${product.price}`}
      </Button>
    );
  }
  
  if (hasAds) {
    const adsRequired = product.adCreditsRequired || 1;
    const adsWatched = productAdProgress[product.id] || 0;
    const progressPercent = Math.min((adsWatched / adsRequired) * 100, 100);

    buttons.push(
      <div key="ads" className="flex-1 space-y-1.5">
        <Button 
          onClick={handleWatchAdForProduct}
          disabled={watchingAd || purchasing}
          variant="secondary"
          className="w-full h-11 text-sm font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {watchingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {watchingAd ? "Watching..." : `Watch Ad (${adsWatched}/${adsRequired})`}
        </Button>
        {adsWatched > 0 && (
          <Progress value={progressPercent} className="h-1.5" />
        )}
      </div>
    );
  }
  
  if (hasShortlink) {
    buttons.push(
      <Button 
        key="shortlink"
        onClick={handleShortlink}
        variant="secondary"
        className="flex-1 h-11 text-sm font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <ExternalLink className="w-4 h-4" />
        Link
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center mb-1">Choose download option</p>
      <div className="flex gap-2 items-end">
        {buttons}
      </div>
    </div>
  );
}
