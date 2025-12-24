export interface TelegramBot {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  features: string[];
  rating: number;
  totalSales: number;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface BotPurchase {
  id: string;
  botId: string;
  userId: string;
  purchaseDate: Date;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  webhookResponse?: string;
  amount: number;
}
