export interface ApiCategory {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  icon: string;
  color: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: string; // legacy support
  requiresAuth: boolean;
  rateLimit: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  responseExample: string;
  creditsCost?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  icon: string;
  color: string;
  totalEndpoints: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  endpoints: ApiEndpoint[];
}
