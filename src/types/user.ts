import { UserApiPurchase } from "./apiPricing";
import { Transaction } from "./transaction";

export interface AdRewardsData {
  adsWatchedToday: number;
  lastWatchDate: string;
  totalAdsWatched: number;
  bonusClaimed: boolean;
}

export interface ReferralData {
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
}

export interface UserApiKey {
  key: string;
  keyPrefix: string;
  keyHash: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface UserActivePlan {
  planId: string;
  planName: string;
  purchaseDate: string;
  expiryDate: string;
  totalCredits: number;
}

export interface UserData {
  // Identity
  id: string;
  telegramId: number;
  displayName: string;
  username?: string;
  photoURL?: string;
  
  // Wallet
  balance: number;
  coins: number;
  
  // API
  apiCredits: number;
  apiKey?: UserApiKey;
  activePlan?: UserActivePlan;
  
  // Purchases
  purchasedFiles: string[];
  
  // Ad Rewards
  adRewards: AdRewardsData;
  
  // Referral
  referral: ReferralData;
  
  // Status
  banned?: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UserPurchase extends UserApiPurchase {
  id: string;
  userId: string;
}

export interface UserTransaction extends Transaction {
  id: string;
  userId: string;
}
