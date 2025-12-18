import { ApiPricingPlan } from "@/types/apiPricing";

export const apiPricingPlans: ApiPricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 10,
    requests: 100,
    validity: "15 days",
    tagline: "Try karo, explore karo",
    features: [
      "100 API requests",
      "All endpoints access",
      "Basic support",
    ],
  },
  {
    id: "popular",
    name: "Popular",
    price: 35,
    requests: 500,
    validity: "30 days",
    popular: true,
    tagline: "Sabse zyada pasand kiya gaya",
    features: [
      "500 API requests",
      "All endpoints access",
      "Priority support",
      "Faster response",
    ],
  },
  {
    id: "unlimited",
    name: "Pro Max",
    price: 75,
    requests: 1500,
    validity: "60 days",
    bestValue: true,
    tagline: "Full power, maximum savings",
    features: [
      "1500 API requests",
      "All endpoints access",
      "24/7 Premium support",
      "Highest priority",
      "60 din validity",
    ],
  },
];

// Owner profit configuration
export const profitConfig = {
  platformFeePercent: 20,
  ownerSharePercent: 80,
};

