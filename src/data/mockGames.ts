export interface Game {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnail: string;
  tags: string[];
  categories?: string[];
  sizeBytes: number;
  sizeFormatted: string;
  downloads: number;
  uploadDate: string;
  year: number;
  filesCount: number;
  files?: string[];
  uploader: string;
  uploaderId?: string;
  priceUSD: number;
  isFree: boolean;
  unlockByAds: boolean;
  adCreditsRequired?: number;
  visible?: boolean;
}

export const mockGames: Game[] = [
  {
    id: "1",
    title: "Abra Cooking Dabra [FitGirl Repack]",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    tags: ["Simulator", "Strategy"],
    sizeBytes: 474574438,
    sizeFormatted: "452.59 MB",
    downloads: 12,
    uploadDate: "Dec 5, 25",
    year: 2025,
    filesCount: 1,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "2",
    title: "Yes Your Grace 2 Snowfall (v1.1.1)",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    tags: ["Role-playing (RPG)", "Simulator", "4GB"],
    sizeBytes: 2233382993,
    sizeFormatted: "2.08 GB",
    downloads: 11,
    uploadDate: "Dec 4, 25",
    year: 2025,
    filesCount: 2,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "3",
    title: "Crown and Adventure [Fitgirl Repack]",
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
    tags: ["Role-playing (RPG)", "Strategy", "4GB"],
    sizeBytes: 3253219737,
    sizeFormatted: "3.03 GB",
    downloads: 8,
    uploadDate: "Dec 3, 25",
    year: 2025,
    filesCount: 1,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "4",
    title: "Successor (v1.0.0.233) [Fitgirl Repack]",
    thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=400&h=300&fit=crop",
    tags: ["Role-playing (RPG)", "Strategy", "4GB"],
    sizeBytes: 6903921459,
    sizeFormatted: "6.43 GB",
    downloads: 7,
    uploadDate: "Dec 2, 25",
    year: 2025,
    filesCount: 3,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "5",
    title: "Tales of Xillia Remastered (Deluxe Edition)",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541f7f73f6?w=400&h=300&fit=crop",
    tags: ["Role-playing (RPG)", "4GB"],
    sizeBytes: 12566134579,
    sizeFormatted: "11.7 GB",
    downloads: 12,
    uploadDate: "Dec 1, 25",
    year: 2025,
    filesCount: 4,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "6",
    title: "Silly Polly Beast (v0.97) [Fitgirl Repack]",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
    tags: ["Shooter", "Adventure"],
    sizeBytes: 1310720000,
    sizeFormatted: "1.22 GB",
    downloads: 14,
    uploadDate: "Nov 30, 25",
    year: 2025,
    filesCount: 1,
    uploader: "fitgirl",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "7",
    title: "Super Serious Golf [Scene Release]",
    thumbnail: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=300&fit=crop",
    tags: ["Indie", "4GB"],
    sizeBytes: 3212836864,
    sizeFormatted: "2.99 GB",
    downloads: 7,
    uploadDate: "Nov 29, 25",
    year: 2025,
    filesCount: 1,
    uploader: "scene",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
  {
    id: "8",
    title: "Phantom Liberty Extended Cut",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop",
    tags: ["Action", "RPG", "Open World"],
    sizeBytes: 45097156608,
    sizeFormatted: "42.0 GB",
    downloads: 156,
    uploadDate: "Nov 28, 25",
    year: 2025,
    filesCount: 8,
    uploader: "dodi",
    priceUSD: 0,
    isFree: true,
    unlockByAds: false,
  },
];

export const platformStats = {
  users: 71078,
  games: 10032,
  files: 46943,
  storageTB: 86.29,
  downloads: 263222,
};

export const userActivityData = [
  { date: "23 Sep", value: 120 },
  { date: "02 Dec", value: 85 },
  { date: "10 Feb", value: 200 },
  { date: "19 Apr", value: 150 },
  { date: "26 Jun", value: 180 },
  { date: "04 Sep", value: 220 },
  { date: "07 Dec", value: 195 },
];

export const downloadActivityData = [
  { date: "08 Jul", value: 450 },
  { date: "30 Jul", value: 520 },
  { date: "23 Aug", value: 380 },
  { date: "17 Sep", value: 600 },
  { date: "11 Oct", value: 674 },
  { date: "04 Nov", value: 550 },
  { date: "07 Dec", value: 480 },
];

export const mockUser = {
  name: "Parul Rajput",
  id: "6664791622",
  joinedAt: "Jun 28, 25",
  lastDownload: "33,917 mins ago",
  referredBy: "Nobody",
  referrals: 0,
  downloads: 4,
  balance: 0,
  coins: 50,
  recentDownloads: [mockGames[6]],
};
