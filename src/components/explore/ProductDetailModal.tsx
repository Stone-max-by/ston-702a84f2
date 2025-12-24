import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  Copy,
  Check,
} from "lucide-react";
import { Product, productTypeLabels, productTypeIcons, formatFileSize } from "@/types/product";
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
    
    // Already owned - just download
    if (isOwned) {
      toast({
        title: "Download Started",
        description: `Downloading ${product.title}...`,
      });
      return;
    }
    
    // Free product
    if (product.isFree && !product.unlockByAds) {
      await addPurchasedFile(product.id);
      toast({
        title: "Download Started",
        description: `Downloading ${product.title}...`,
      });
      return;
    }
    
    // Unlock by ads
    if (product.unlockByAds) {
      toast({
        title: "Watch Ads Required",
        description: `Watch ${product.adCreditsRequired} ad(s) to unlock this product`,
      });
      return;
    }
    
    // Paid product - purchase with coins
    const price = product.coinPrice || 0;
    
    if (coins < price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${price} coins but only have ${coins}. Get more coins to purchase.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setPurchasing(true);
      await updateCoins(coins - price);
      await addPurchasedFile(product.id);
      toast({
        title: "Purchase Successful!",
        description: `${product.title} is now yours. Downloading...`,
      });
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-card border-white/10 h-[90vh] rounded-t-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/5">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground flex-1 min-w-0">
                <span className="text-lg">{productTypeIcons[product.type]}</span>
                <span className="text-sm font-semibold truncate">{product.title}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Screenshots Carousel */}
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {screenshots.map((screenshot, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video rounded-xl overflow-hidden bg-background">
                        <img
                          src={screenshot}
                          alt={`${product.title} screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {screenshots.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
              
              {screenshots.length > 1 && (
                <Badge className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-[10px]">
                  {screenshots.length} images
                </Badge>
              )}
            </div>

            {/* Tags & Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {productTypeLabels[product.type]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
              {product.isNew && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">NEW</Badge>
              )}
              {product.trending && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">🔥 Trending</Badge>
              )}
              {product.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] bg-muted/50">{tag}</Badge>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md">
                <Download className="w-3 h-3" />
                <span>{product.downloads}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md">
                <Eye className="w-3 h-3" />
                <span>{product.views}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md">
                <Heart className="w-3 h-3" />
                <span>{product.likes}</span>
              </div>
              {product.rating && (
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">About</h4>
              <p className="text-xs text-foreground/80 leading-relaxed">{product.description}</p>
            </div>

            {/* File Info */}
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">File Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="w-3 h-3" />
                  <span>{product.sizeFormatted}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileArchive className="w-3 h-3" />
                  <span>{product.filesCount} files</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>v{product.version}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{product.releaseYear}</span>
                </div>
              </div>

              {/* Individual Files */}
              {product.files?.length > 0 && (
                <div className="space-y-1.5 pt-2 mt-2 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground font-medium">Files:</p>
                  {product.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between text-[10px] bg-muted/30 rounded px-2 py-1.5"
                    >
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-muted-foreground ml-2">{formatFileSize(file.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform & Language */}
            {(product.platform?.length || product.language?.length) && (
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Compatibility</h4>
                <div className="space-y-1.5 text-xs">
                  {product.platform?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Monitor className="w-3 h-3" />
                      <span>{product.platform.join(", ")}</span>
                    </div>
                  )}
                  {product.language?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      <span>{product.language.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {product.requirements && (
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">System Requirements</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {product.requirements.os && <p>OS: {product.requirements.os}</p>}
                  {product.requirements.processor && <p>CPU: {product.requirements.processor}</p>}
                  {product.requirements.ram && <p>RAM: {product.requirements.ram}</p>}
                  {product.requirements.storage && <p>Storage: {product.requirements.storage}</p>}
                  {product.requirements.graphics && <p>GPU: {product.requirements.graphics}</p>}
                </div>
              </div>
            )}

            {/* Uploader Info */}
            <div className="bg-background rounded-lg p-3 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Uploaded by</p>
                <p className="text-xs font-medium">{product.uploader}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Upload Date</p>
                <p className="text-xs">{product.uploadDate}</p>
              </div>
            </div>
          </div>

          {/* Fixed Action Button */}
          <div className="p-4 border-t border-white/5 bg-card">
            {isOwned ? (
              <Button
                onClick={handleAction}
                className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Download (Owned)
              </Button>
            ) : product.isFree && !product.unlockByAds ? (
              <Button
                onClick={handleAction}
                className="w-full h-11 text-sm font-semibold gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download Free
              </Button>
            ) : product.unlockByAds ? (
              <Button
                onClick={handleAction}
                className="w-full h-11 text-sm font-semibold gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Play className="w-4 h-4" />
                Watch {product.adCreditsRequired} Ad{(product.adCreditsRequired || 1) > 1 ? 's' : ''} to Download
              </Button>
            ) : (
              <Button
                onClick={handleAction}
                disabled={purchasing}
                className="w-full h-11 text-sm font-semibold gap-2"
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                {purchasing ? "Processing..." : `Buy for ${product.coinPrice} Coins`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
