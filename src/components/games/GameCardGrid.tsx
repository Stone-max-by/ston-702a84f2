import { Download, Calendar, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";

// Support both old Game type and new Product type
type CardItem = Game | Product;

interface GameCardGridProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardGrid({ game, onClick }: GameCardGridProps) {
  const navigate = useNavigate();

  // Handle both Game (year) and Product (releaseYear) formats
  const year = 'year' in game ? game.year : game.releaseYear;
  const size = 'sizeFormatted' in game ? game.sizeFormatted : '';
  const downloads = 'downloads' in game ? game.downloads : 0;
  const uploadDate = 'uploadDate' in game ? game.uploadDate : '';
  const filesCount = 'filesCount' in game ? game.filesCount : 0;
  const uploader = 'uploader' in game ? game.uploader : 'Admin';
  
  // Get pricing info for badge
  const isFree = 'isFree' in game ? game.isFree : true;
  const unlockByAds = 'unlockByAds' in game ? game.unlockByAds : false;
  const coinPrice = 'coinPrice' in game ? game.coinPrice : 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      const slug = 'slug' in game ? game.slug : game.id;
      navigate(`/product/${slug}`);
    }
  };

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
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground">{uploader}</span>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-1.5 right-1.5">
          {isFree && !unlockByAds ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-600/90 text-white">Free</span>
          ) : unlockByAds ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-600/90 text-white">Ads</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground">
              {coinPrice} 🪙
            </span>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        <h3 className="font-medium text-xs text-foreground line-clamp-1">
          {game.title}{" "}
          <span className="text-muted-foreground font-normal">({year})</span>
        </h3>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {size && (
            <span className="flex items-center gap-0.5">
              <Folder className="w-3 h-3" />
              {size}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Download className="w-3 h-3" />
            {downloads}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {game.tags?.filter(t => t !== "4GB").slice(0, 2).map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
