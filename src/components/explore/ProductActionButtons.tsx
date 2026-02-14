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

interface ProductActionButtonsProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

export function ProductActionButtons({ product, onPurchaseComplete }: ProductActionButtonsProps) {
  const { requireAuth } = useRequireAuth();
  const { balance, hasFile, purchaseProduct } = useUserData();
  const [purchasing, setPurchasing] = useState(false);

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
    toast({ 
      title: "Ads Feature Coming Soon", 
      description: "Ad unlock will be available soon!" 
    });
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
