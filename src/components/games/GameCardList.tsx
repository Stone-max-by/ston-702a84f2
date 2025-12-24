import { Download, HardDrive, Star, TrendingUp, ChevronRight } from "lucide-react";
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
  const rating = 'rating' in game ? game.rating : null;
  const trending = 'trending' in game ? game.trending : false;
  const isNew = 'isNew' in game ? game.isNew : false;
  
  const isFree = 'isFree' in game ? game.isFree : true;
  const unlockByAds = 'unlockByAds' in game ? game.unlockByAds : false;
  const coinPrice = 'coinPrice' in game ? game.coinPrice : 0;

  const formatDownloads = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-md hover:shadow-primary/5"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative shrink-0">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-20 h-20 rounded-lg object-cover"
            loading="lazy"
          />
          {/* Price Badge */}
          <div className="absolute -top-1.5 -right-1.5">
            {isFree && !unlockByAds ? (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-emerald-500 text-white font-bold shadow-sm">
                FREE
              </span>
            ) : unlockByAds ? (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm">
                AD
              </span>
            ) : (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground font-bold shadow-sm">
                {coinPrice}🪙
              </span>
            )}
          </div>
          
          {/* Status badges */}
          {(trending || isNew) && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {trending && (
                <span className="flex items-center gap-0.5 text-[7px] px-1 py-0.5 rounded bg-orange-500/90 text-white font-medium">
                  <TrendingUp className="w-2 h-2" />
                </span>
              )}
              {isNew && (
                <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-500/90 text-white font-medium">
                  NEW
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-foreground line-clamp-1 text-sm group-hover:text-primary transition-colors">
            {game.title}
          </h3>

          <div className="flex flex-wrap gap-1 mt-1.5">
            {game.tags?.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            {size && (
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {size}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatDownloads(downloads)}
            </span>
            {rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
