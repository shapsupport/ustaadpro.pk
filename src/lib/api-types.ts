export interface ApiCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tint: string;
}

export interface WorkPrice {
  id: number;
  serviceId: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  sortOrder: number;
}

export interface ApiService {
  id: string;
  category_id: string;
  subcategory_id: string;
  title: string;
  description: string;
  price: number;
  original_price: string | number;
  originalPrice?: number;
  duration: string;
  rating: number;
  reviews: number;
  badge?: string;
  service_type: string;
  serviceType?: string;
  image_url: string;
  imageUrl?: string;
  detail_description: string;
  detailDescription?: string;
  details: string[];
  includes: string[];
  excludes: string[];
  created_at: string;
  updated_at: string;
  workPrices?: WorkPrice[];
}

export interface ApiProduct {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApiShopResponse {
  categories: { name: string; total: number }[];
  limit: number;
  offset: number;
  total: number;
  category: string;
  hasMore: boolean;
}

export interface ApiReview {
  id: string | number;
  rating: number;
  comment: string;
  createdAt?: string;
  created_at?: string;
  userName?: string;
  user_name?: string;
  customerName?: string;
  serviceTitle?: string;
  service_title?: string;
  user?: { name?: string };
}
