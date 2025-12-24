import { Download, Folder } from "lucide-react";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";

type CardItem = Game | Product;

interface GameCardListProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardList({ game, onClick }: GameCardListProps) {
  const size = 'sizeFormatted' in game ? game.sizeFormatted : '';
  const downloads = 'downloads' in game ? game.downloads : 0;
  
  // Get pricing info for badge
  const isFree = 'isFree' in game ? game.isFree : true;
  const unlockByAds = 'unlockByAds' in game ? game.unlockByAds : false;
  const coinPrice = 'coinPrice' in game ? game.coinPrice : 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

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

      <button
        onClick={handleDownloadClick}
        className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors self-center flex-shrink-0"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
