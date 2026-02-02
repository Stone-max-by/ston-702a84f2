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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductActionButtonsProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

async function sendFileToTelegram(
  telegramUserId: number,
  product: Product
): Promise<boolean> {
  try {
    for (const file of product.files) {
      const response = await supabase.functions.invoke('send-file', {
        body: {
          telegramUserId,
          telegramFileId: file.telegramFileId,
          fileName: file.name,
          productTitle: product.title,
        },
      });

      if (response.error) {
        console.error('Error sending file:', response.error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Failed to send file to Telegram:', error);
    return false;
  }
}

export function ProductActionButtons({ product, onPurchaseComplete }: ProductActionButtonsProps) {
  const { requireAuth } = useRequireAuth();
  const { balance, updateBalance, addPurchasedFile, hasFile } = useUserData();
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);

  const isOwned = hasFile(product.id);
  
  // Determine which buttons to show
  const hasPrice = (product.price || 0) > 0;
  const hasAds = product.unlockByAds && (product.adCreditsRequired || 0) > 0;
  const hasShortlink = !!product.shortlinkUrl;
  const isFreeDownload = product.isFree && !hasAds && !hasPrice && !hasShortlink;

  const sendFileAfterPurchase = async () => {
    if (!user?.telegramId) {
      toast({ 
        title: "Cannot Send File", 
        description: "Telegram account not linked", 
        variant: "destructive" 
      });
      return;
    }

    if (product.files.length === 0) {
      toast({ 
        title: "No Files", 
        description: "This product has no downloadable files", 
        variant: "destructive" 
      });
      return;
    }

    setSendingFile(true);
    const success = await sendFileToTelegram(user.telegramId, product);
    setSendingFile(false);

    if (success) {
      toast({ 
        title: "File Sent! 📨", 
        description: "Check your Telegram messages" 
      });
    } else {
      toast({ 
        title: "Failed to Send", 
        description: "File purchased but couldn't send to Telegram. Try downloading again.", 
        variant: "destructive" 
      });
    }
  };

  const handleBalancePurchase = async () => {
    if (!requireAuth("purchase this product")) return;
    
    if (isOwned) {
      // Already owned - just send file again
      await sendFileAfterPurchase();
      return;
    }
    
    const price = product.price || 0;
    if (balance < price) {
      toast({ 
        title: "Insufficient Balance", 
        description: `You need ₹${price}, but have ₹${balance}`, 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      setPurchasing(true);
      await updateBalance(balance - price);
      await addPurchasedFile(product.id);
      toast({ title: "Purchase Successful!", description: `${product.title} is now yours.` });
      onPurchaseComplete?.();
      
      // Send file to Telegram after successful purchase
      await sendFileAfterPurchase();
    } catch {
      toast({ title: "Purchase Failed", description: "Please try again.", variant: "destructive" });
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

  const handleFreeDownload = async () => {
    if (!requireAuth("download this product")) return;
    
    if (!isOwned) {
      await addPurchasedFile(product.id);
    }
    toast({ title: "Download Started", description: `Sending ${product.title} to Telegram...` });
    
    await sendFileAfterPurchase();
  };

  const handleDownloadOwned = async () => {
    if (!requireAuth("download this product")) return;
    
    toast({ title: "Sending...", description: `Sending ${product.title} to Telegram...` });
    await sendFileAfterPurchase();
  };

  // If already owned, show download button
  if (isOwned) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={handleDownloadOwned} 
          disabled={sendingFile}
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          {sendingFile ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {sendingFile ? "Sending..." : "Download (Owned)"}
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
          disabled={sendingFile}
          className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
        >
          {sendingFile ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {sendingFile ? "Sending..." : "Download Free"}
        </Button>
      </div>
    );
  }

  // Multiple options available
  const buttons = [];
  
  // Balance button (INR)
  if (hasPrice) {
    buttons.push(
      <Button 
        key="balance"
        onClick={handleBalancePurchase} 
        disabled={purchasing || sendingFile}
        className="flex-1 h-11 text-sm font-semibold gap-2"
      >
        {purchasing || sendingFile ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {purchasing ? "..." : sendingFile ? "Sending..." : `₹${product.price}`}
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
