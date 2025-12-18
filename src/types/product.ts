export type ProductType = 
  | "game" 
  | "code" 
  | "pixellab_plp" 
  | "capcut_template" 
  | "font" 
  | "preset" 
  | "other";

export interface ProductFile {
  id: string;
  name: string;
  telegramFileId: string;
  sizeBytes: number;
  mimeType?: string;
}

export interface Product {
  id: string;
  
  // Basic Info
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Type & Category
  type: ProductType;
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Media
  thumbnail: string;
  screenshots?: string[];
  previewVideo?: string;
  
  // File Info
  files: ProductFile[];
  filesCount: number;
  totalSizeBytes: number;
  sizeFormatted: string;
  
  // Telegram Integration
  telegramFileIds: string[];
  telegramChannelId?: string;
  telegramMessageId?: string;
  
  // Version & Updates
  version: string;
  changelog?: string;
  uploadDate: string;
  updateDate?: string;
  releaseYear: number;
  
  // Pricing
  priceUSD: number;
  originalPrice?: number;
  isFree: boolean;
  unlockByAds: boolean;
  adCreditsRequired: number;
  coinPrice?: number;
  
  // Stats
  downloads: number;
  views: number;
  likes: number;
  rating?: number;
  ratingCount?: number;
  
  // Source & Credit
  uploader: string;
  uploaderId?: string;
  source?: string;
  credits?: string;
  
  // Requirements (for games/software)
  requirements?: {
    os?: string;
    ram?: string;
    storage?: string;
    processor?: string;
    graphics?: string;
  };
  
  // Metadata
  platform?: string[];  // windows, mac, android, ios, etc.
  language?: string[];
  featured: boolean;
  trending: boolean;
  visible: boolean;
  isNew: boolean;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const productTypeLabels: Record<ProductType, string> = {
  game: "Game",
  code: "Code / Source File",
  pixellab_plp: "PixelLab PLP",
  capcut_template: "CapCut Template",
  font: "Font",
  preset: "Preset / LUT",
  other: "Other",
};

export const productTypeIcons: Record<ProductType, string> = {
  game: "🎮",
  code: "💻",
  pixellab_plp: "🎨",
  capcut_template: "🎬",
  font: "🔤",
  preset: "✨",
  other: "📦",
};

export const defaultCategories: Record<ProductType, string[]> = {
  game: ["Action", "Adventure", "RPG", "Strategy", "Simulation", "Sports", "Racing", "Puzzle", "Shooter", "Horror", "Indie"],
  code: ["Web Template", "App Source", "Script", "Plugin", "Bot", "API", "UI Kit"],
  pixellab_plp: ["Logo", "Thumbnail", "Banner", "Poster", "Social Media", "YouTube", "Instagram"],
  capcut_template: ["Intro", "Outro", "Transition", "Effect", "Text Animation", "Slideshow", "Trending"],
  font: ["Sans Serif", "Serif", "Script", "Display", "Handwritten", "Decorative"],
  preset: ["Lightroom", "Photoshop", "Video LUT", "Color Grade", "Filter"],
  other: ["Miscellaneous"],
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
