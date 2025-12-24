import { Download, Folder, Coins, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CardItem = Game | Product;

interface GameCardListProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardList({ game, onClick }: GameCardListProps) {
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

  const size = 'sizeFormatted' in game ? game.sizeFormatted : '';
  const downloads = 'downloads' in game ? game.downloads : 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      const slug = 'slug' in game ? game.slug : game.id;
      navigate(`/product/${slug}`);
    }
  };

  // Determine button config
  const getButtonConfig = () => {
    if (isFree && !unlockByAds) {
      return {
        icon: <Download className="w-4 h-4" />,
        className: "bg-green-600 hover:bg-green-700 text-white"
      };
    } else if (unlockByAds) {
      return {
        icon: <Play className="w-4 h-4" />,
        className: "bg-amber-600 hover:bg-amber-700 text-white"
      };
    } else {
      return {
        icon: <Coins className="w-4 h-4" />,
        className: "bg-primary hover:bg-primary/90"
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div
      onClick={handleCardClick}
      className="glass-card p-3 flex gap-3 cursor-pointer animate-fade-in hover:border-primary/30 transition-colors"
    >
      <div className="relative">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
        />
        {/* Price badge */}
        <div className="absolute -top-1 -right-1">
          {isFree && !unlockByAds ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-600 text-white font-medium">Free</span>
          ) : unlockByAds ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-600 text-white font-medium">Ads</span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
              {coinPrice}🪙
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
          {game.title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {game.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill text-[10px] px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {size && (
            <span className="flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {size}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {downloads}
          </span>
        </div>
      </div>

      <Button
        onClick={handleAction}
        size="icon"
        className={`w-10 h-10 rounded-lg self-center flex-shrink-0 ${buttonConfig.className}`}
      >
        {buttonConfig.icon}
      </Button>
    </div>
  );
}
