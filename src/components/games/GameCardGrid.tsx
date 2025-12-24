import { Download, HardDrive, Star, TrendingUp } from "lucide-react";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";

type CardItem = Game | Product;

interface GameCardGridProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardGrid({ game, onClick }: GameCardGridProps) {
  const year = 'year' in game ? game.year : game.releaseYear;
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
      className="group relative bg-card rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {trending && (
            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-orange-500/90 text-white font-medium backdrop-blur-sm">
              <TrendingUp className="w-2.5 h-2.5" />
              Hot
            </span>
          )}
          {isNew && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white font-medium backdrop-blur-sm">
              NEW
            </span>
          )}
        </div>
        
        {/* Price Badge - Top Right */}
        <div className="absolute top-2 right-2">
          {isFree && !unlockByAds ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-semibold shadow-sm">
              FREE
            </span>
          ) : unlockByAds ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-sm">
              AD
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-sm">
              {coinPrice} 🪙
            </span>
          )}
        </div>

        {/* Bottom Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-white/90">
            <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <HardDrive className="w-2.5 h-2.5" />
              {size}
            </span>
            <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <Download className="w-2.5 h-2.5" />
              {formatDownloads(downloads)}
            </span>
          </div>
          {rating && (
            <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white/90">
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {game.title}
          <span className="text-muted-foreground font-normal ml-1">({year})</span>
        </h3>

        <div className="flex flex-wrap gap-1">
          {game.tags?.slice(0, 2).map((tag) => (
            <span 
              key={tag} 
              className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Hover Download Button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
