export interface ApiPricingPlan {
  id: string;
  name: string;
  price: number; // in Rs
  requests: number;
  validity: string; // e.g., "30 days"
  popular?: boolean;
  bestValue?: boolean;
  tagline?: string;
  highlight?: string;
  features: string[];
}

export interface UserApiPurchase {
  id: string;
  planId: string;
  userId: string;
  purchaseDate: string;
  expiryDate: string;
  totalRequests: number;
  usedRequests: number;
  status: "active" | "expired" | "exhausted";
}

export interface OwnerProfit {
  totalRevenue: number;
  platformFee: number; // percentage
  ownerEarnings: number;
  transactions: {
    id: string;
    userId: string;
    planId: string;
    amount: number;
    ownerShare: number;
    platformShare: number;
    date: string;
  }[];
}
