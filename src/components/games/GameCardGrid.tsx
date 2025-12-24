import { Download, Calendar, Folder, ShoppingCart, Play, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Support both old Game type and new Product type
type CardItem = Game | Product;

interface GameCardGridProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardGrid({ game, onClick }: GameCardGridProps) {
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();

  // Get product pricing info
  const isFree = 'isFree' in game ? game.isFree : true;
  const unlockByAds = 'unlockByAds' in game ? game.unlockByAds : false;
  const adCreditsRequired = 'adCreditsRequired' in game ? game.adCreditsRequired : 0;
  const coinPrice = 'coinPrice' in game ? game.coinPrice : 0;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('access this item')) return;
    
    if (isFree && !unlockByAds) {
      toast.success(`Starting download: ${game.title}`);
    } else if (unlockByAds) {
      toast.info(`Watch ${adCreditsRequired} ad(s) to unlock: ${game.title}`);
    } else {
      toast.info(`Buy for ${coinPrice} coins: ${game.title}`);
    }
  };

  // Handle both Game (year) and Product (releaseYear) formats
  const year = 'year' in game ? game.year : game.releaseYear;
  const size = 'sizeFormatted' in game ? game.sizeFormatted : '';
  const downloads = 'downloads' in game ? game.downloads : 0;
  const uploadDate = 'uploadDate' in game ? game.uploadDate : '';
  const filesCount = 'filesCount' in game ? game.filesCount : 0;
  const uploader = 'uploader' in game ? game.uploader : 'Admin';

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      const slug = 'slug' in game ? game.slug : game.id;
      navigate(`/product/${slug}`);
    }
  };

  // Determine button variant and text
  const getButtonConfig = () => {
    if (isFree && !unlockByAds) {
      return {
        icon: <Download className="w-4 h-4" />,
        label: "Download",
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700 text-white"
      };
    } else if (unlockByAds) {
      return {
        icon: <Play className="w-4 h-4" />,
        label: `Watch ${adCreditsRequired} Ad${adCreditsRequired > 1 ? 's' : ''}`,
        variant: "secondary" as const,
        className: "bg-amber-600 hover:bg-amber-700 text-white"
      };
    } else {
      return {
        icon: <Coins className="w-4 h-4" />,
        label: `${coinPrice} Coins`,
        variant: "default" as const,
        className: "bg-primary hover:bg-primary/90"
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div
      onClick={handleCardClick}
      className="glass-card overflow-hidden cursor-pointer animate-fade-in hover:border-primary/30 transition-colors"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <span className="tag-pill">{uploader}</span>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          {isFree && !unlockByAds ? (
            <span className="tag-pill bg-green-600/90 text-white">Free</span>
          ) : unlockByAds ? (
            <span className="tag-pill bg-amber-600/90 text-white">Ads</span>
          ) : (
            <span className="tag-pill bg-primary/90 text-primary-foreground">
              {coinPrice} 🪙
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">
          {game.title}{" "}
          <span className="text-muted-foreground font-normal">({year})</span>
        </h3>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {size && (
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              {size}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {downloads}
          </span>
          {uploadDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {uploadDate}
            </span>
          )}
          {filesCount > 0 && (
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              {filesCount} files
            </span>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleAction}
          size="sm"
          className={`w-full gap-2 ${buttonConfig.className}`}
        >
          {buttonConfig.icon}
          {buttonConfig.label}
        </Button>
      </div>
    </div>
  );
}
