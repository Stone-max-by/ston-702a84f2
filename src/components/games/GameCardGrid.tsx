import { Download, Calendar, Folder } from "lucide-react";
import type { Game } from "@/data/mockGames";
import type { Product } from "@/types/product";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";

// Support both old Game type and new Product type
type CardItem = Game | Product;

interface GameCardGridProps {
  game: CardItem;
  onClick?: () => void;
}

export function GameCardGrid({ game, onClick }: GameCardGridProps) {
  const { requireAuth } = useRequireAuth();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('download this item')) return;
    
    toast.success(`Starting download: ${game.title}`);
  };

  // Handle both Game (year) and Product (releaseYear) formats
  const year = 'year' in game ? game.year : game.releaseYear;
  const size = 'sizeFormatted' in game ? game.sizeFormatted : '';
  const downloads = 'downloads' in game ? game.downloads : 0;
  const uploadDate = 'uploadDate' in game ? game.uploadDate : '';
  const filesCount = 'filesCount' in game ? game.filesCount : 0;
  const uploader = 'uploader' in game ? game.uploader : 'Admin';

  return (
    <div
      onClick={onClick}
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
        {game.tags?.includes("4GB") && (
          <div className="absolute top-2 right-2">
            <span className="tag-pill bg-primary/20 text-primary">4GB</span>
          </div>
        )}
        <button
          onClick={handleDownload}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
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

        <div className="flex flex-wrap gap-1.5">
          {game.tags?.filter(t => t !== "4GB").map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
