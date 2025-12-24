import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowLeft,
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
  ShoppingCart,
} from "lucide-react";
import { productTypeLabels, productTypeIcons, formatFileSize } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { requireAuth } = useRequireAuth();

  const product = products.find((p) => p.slug === slug || p.id === slug);

  const handleAction = () => {
    if (!requireAuth("access this product")) return;
    
    if (product?.isFree && !product?.unlockByAds) {
      toast({
        title: "Download Started",
        description: `Downloading ${product?.title}...`,
      });
    } else if (product?.unlockByAds) {
      toast({
        title: "Watch Ads Required",
        description: `Watch ${product?.adCreditsRequired} ad(s) to unlock this product`,
      });
    } else {
      toast({
        title: "Purchase Required",
        description: `This product costs ${product?.coinPrice} coins`,
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout title="Not Found">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const screenshots = product.screenshots?.length
    ? product.screenshots
    : [product.thumbnail];

  return (
    <AppLayout title={product.title}>
      <div className="space-y-6 pb-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Screenshots Carousel */}
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {screenshots.map((screenshot, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-video rounded-xl overflow-hidden bg-card">
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
          
          {/* Screenshot Count Badge */}
          {screenshots.length > 1 && (
            <Badge className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm">
              {screenshots.length} images
            </Badge>
          )}
        </div>

        {/* Title & Tags */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-tight">{product.title}</h1>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {productTypeIcons[product.type]} {productTypeLabels[product.type]}
            </Badge>
            <Badge variant="outline">{product.category}</Badge>
            {product.isNew && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                NEW
              </Badge>
            )}
            {product.trending && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                🔥 Trending
              </Badge>
            )}
          </div>

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.slice(0, 6).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs bg-muted/50"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>{product.downloads}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{product.views}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            <span>{product.likes}</span>
          </div>
          {product.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="glass-card p-4 space-y-2">
          <h3 className="font-semibold">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* File Info */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold">File Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>Size: {product.sizeFormatted}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileArchive className="w-4 h-4" />
              <span>Files: {product.filesCount}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>v{product.version}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{product.releaseYear}</span>
            </div>
          </div>

          {/* Individual Files */}
          {product.files.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-medium">Files:</p>
              {product.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform & Language */}
        {(product.platform?.length || product.language?.length) && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold">Compatibility</h3>
            <div className="space-y-2 text-sm">
              {product.platform?.length && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="w-4 h-4" />
                  <span>Platform: {product.platform.join(", ")}</span>
                </div>
              )}
              {product.language?.length && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Language: {product.language.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requirements (for games) */}
        {product.requirements && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold">System Requirements</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {product.requirements.os && (
                <p>OS: {product.requirements.os}</p>
              )}
              {product.requirements.processor && (
                <p>Processor: {product.requirements.processor}</p>
              )}
              {product.requirements.ram && (
                <p>RAM: {product.requirements.ram}</p>
              )}
              {product.requirements.storage && (
                <p>Storage: {product.requirements.storage}</p>
              )}
              {product.requirements.graphics && (
                <p>Graphics: {product.requirements.graphics}</p>
              )}
            </div>
          </div>
        )}

        {/* Uploader Info */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Uploaded by</p>
            <p className="font-medium">{product.uploader}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Upload Date</p>
            <p className="text-sm">{product.uploadDate}</p>
          </div>
        </div>

        {/* Fixed Action Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          {product.isFree && !product.unlockByAds ? (
            <Button
              onClick={handleAction}
              className="w-full h-12 text-base font-semibold gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Download className="w-5 h-5" />
              Download Free
            </Button>
          ) : product.unlockByAds ? (
            <Button
              onClick={handleAction}
              className="w-full h-12 text-base font-semibold gap-2 bg-amber-600 hover:bg-amber-700"
              size="lg"
            >
              <Play className="w-5 h-5" />
              Watch {product.adCreditsRequired} Ad{product.adCreditsRequired > 1 ? 's' : ''} to Download
            </Button>
          ) : (
            <Button
              onClick={handleAction}
              className="w-full h-12 text-base font-semibold gap-2"
              size="lg"
            >
              <Coins className="w-5 h-5" />
              Buy for {product.coinPrice} Coins
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;
