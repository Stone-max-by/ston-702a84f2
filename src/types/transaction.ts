export interface Transaction {
  id: string;
  type: "deposit" | "purchase" | "coin_earning" | "ad_reward";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}
