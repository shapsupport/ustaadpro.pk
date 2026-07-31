export interface ApiCategory {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tint?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  webImageUrl?: string | null;
  web_image_url?: string | null;
  mobileIconUrl?: string | null;
  mobile_icon_url?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
}

export interface ApiSubcategory {
  id: string;
  categoryId?: string;
  category_id?: string;
  categoryid?: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  imageurl?: string | null;
  webImageUrl?: string | null;
  webimageurl?: string | null;
  mobileIconUrl?: string | null;
  mobileiconurl?: string | null;
  services?: ApiService[];
}

export interface WorkPrice {
  id: number | string;
  serviceId?: string;
  service_id?: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  sortOrder?: number;
  sort_order?: number;
}

export interface ApiService {
  id: string;
  categoryId?: string;
  category_id?: string;
  subcategoryId?: string | null;
  subcategory_id?: string | null;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  original_price?: string | number;
  unitDescription?: string;
  serviceType?: string;
  service_type?: string;
  duration?: string;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  imageUrl?: string;
  image_url?: string;
  serviceImageUrl?: string;
  detailDescription?: string;
  detail_description?: string;
  details?: string[];
  includes?: string[];
  excludes?: string[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  workPrices?: WorkPrice[];
}

export interface ApiCatalogCategory {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tint?: string;
  mainCategory?: {
    id: string;
    title: string;
    mobileIconUrl?: string;
    webImageUrl?: string;
  };
  subcategories?: ApiSubcategory[];
  directServices?: ApiService[];
  services?: ApiService[];
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
