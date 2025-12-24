export interface RedeemCode {
  id: string;
  code: string;
  rewardType: 'coins' | 'balance';
  rewardAmount: number;
  maxUses: number;
  currentUses: number;
  usedBy: string[]; // Array of user IDs who used this code
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

export interface RedeemCodeFormData {
  code: string;
  rewardType: 'coins' | 'balance';
  rewardAmount: number;
  maxUses: number;
  expiresAt: Date | null;
}
