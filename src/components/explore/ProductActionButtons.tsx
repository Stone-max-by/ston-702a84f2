import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Coins,
  Play,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "@/hooks/use-toast";

interface ProductActionButtonsProps {
  product: Product;
}

export function ProductActionButtons({ product }: ProductActionButtonsProps) {
  const { requireAuth } = useRequireAuth();
  const { coins, updateCoins, addPurchasedFile, hasFile } = useUserData();
  const [purchasing, setPurchasing] = useState(false);

  const isOwned = hasFile(product.id);
  
  // Determine which buttons to show
  const hasCoins = (product.coinPrice || 0) > 0;
  const hasAds = product.unlockByAds && (product.adCreditsRequired || 0) > 0;
  const hasShortlink = !!product.shortlinkUrl;
  const isFreeDownload = product.isFree && !hasAds && !hasCoins && !hasShortlink;

  const handleCoinPurchase = async () => {
    if (!requireAuth("purchase this product")) return;
    
    if (isOwned) {
      toast({ title: "Already Owned", description: "You already own this product!" });
      return;
    }
    
    const price = product.coinPrice || 0;
    if (coins < price) {
      toast({ 
        title: "Insufficient Coins", 
        description: `You need ${price} coins, but have ${coins}`, 
        variant: "destructive" 
      });
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

  const handleWatchAds = () => {
    if (!requireAuth("unlock this product")) return;
    toast({ 
      title: "Watch Ads to Unlock", 
      description: `Watch ${product.adCreditsRequired} ad(s) to unlock this download` 
    });
    // TODO: Implement ad watching flow
  };

  const handleShortlink = () => {
    if (!product.shortlinkUrl) return;
    window.open(product.shortlinkUrl, "_blank", "noopener,noreferrer");
  };

  const handleFreeDownload = async () => {
    if (!requireAuth("download this product")) return;
    
    if (!isOwned) {
      await addPurchasedFile(product.id);
    }
    toast({ title: "Download Started", description: `Downloading ${product.title}...` });
    // TODO: Trigger actual download
  };

  // If already owned, show download button
  if (isOwned) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={handleFreeDownload} 
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4" />
          Download (Owned)
        </Button>
      </div>
    );
  }

  // Free download without any requirements
  if (isFreeDownload) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={handleFreeDownload} 
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Download Free
        </Button>
      </div>
    );
  }

  // Multiple options available
  const buttons = [];
  
  // Coins button
  if (hasCoins) {
    buttons.push(
      <Button 
        key="coins"
        onClick={handleCoinPurchase} 
        disabled={purchasing}
        className="flex-1 h-11 text-sm font-semibold gap-2"
      >
        {purchasing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Coins className="w-4 h-4" />
        )}
        {purchasing ? "..." : `${product.coinPrice} Coins`}
      </Button>
    );
  }
  
  // Ads button
  if (hasAds) {
    buttons.push(
      <Button 
        key="ads"
        onClick={handleWatchAds}
        variant="secondary"
        className="flex-1 h-11 text-sm font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        <Play className="w-4 h-4" />
        {product.adCreditsRequired} Ads
      </Button>
    );
  }
  
  // Shortlink button
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
      {/* Title */}
      <p className="text-xs text-muted-foreground text-center mb-1">Choose download option</p>
      
      {/* Buttons row */}
      <div className="flex gap-2">
        {buttons}
      </div>
    </div>
  );
}
