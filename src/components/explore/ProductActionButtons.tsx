import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Wallet,
  Play,
  ExternalLink,
  CheckCircle,
  Loader2,
  Coins,
} from "lucide-react";
import { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "@/hooks/use-toast";
import { showRewardedAd } from "@/lib/monetag";

interface ProductActionButtonsProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

export function ProductActionButtons({ product, onPurchaseComplete }: ProductActionButtonsProps) {
  const { requireAuth } = useRequireAuth();
  const { balance, coins, hasFile, purchaseProduct, unlockProductWithAds } = useUserData();
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

  const handleWatchAds = async () => {
    if (!requireAuth("unlock this product")) return;
    
    const requiredCoins = (product.adCreditsRequired || 1) * 5;
    const userCoins = balance; // coins from useUserData
    
    // If user already has enough coins, unlock directly
    if (coins >= requiredCoins) {
      setPurchasing(true);
      try {
        const result = await unlockProductWithAds(product.id);
        if (result.success) {
          toast({ title: "Product Unlocked! 🎉", description: `${product.title} is now yours.` });
          onPurchaseComplete?.();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast({ title: "Unlock Failed", description: message, variant: "destructive" });
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // Otherwise, show Monetag ad to earn coins
    setWatchingAd(true);
    try {
      const adCompleted = await showRewardedAd();
      if (adCompleted) {
        toast({ title: "Ad Watched! 🎬", description: "Coins will be credited shortly via server." });
      } else {
        toast({ title: "Ad Not Completed", description: "Please watch the full ad.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ad Error", description: "Something went wrong. Try again.", variant: "destructive" });
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
    const requiredCoins = (product.adCreditsRequired || 1) * 5;
    const hasEnoughCoins = coins >= requiredCoins;
    buttons.push(
      <Button 
        key="ads"
        onClick={handleWatchAds}
        disabled={watchingAd || purchasing}
        variant="secondary"
        className="flex-1 h-11 text-sm font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        {watchingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : hasEnoughCoins ? <Coins className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {watchingAd ? "Watching..." : hasEnoughCoins ? "Unlock" : `${product.adCreditsRequired} Ads`}
      </Button>
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
      <div className="flex gap-2">
        {buttons}
      </div>
    </div>
  );
}
