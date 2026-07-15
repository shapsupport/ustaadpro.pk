export interface SubCategory {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration?: string;
  rating?: number;
  reviews?: number;
  tag?: string;
  image?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
  subCategories?: SubCategory[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  slug: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  sku: string;
  availability: "in-stock" | "pre-order" | "coming-soon";
  rating: number;
  reviewCount: number;
  images: string[];
  relatedProducts?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export interface ProductCategory {
  name: string;
  slug: string;
  description: string;
  icon: string;
  subcategories: string[];
  productCount: number;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  completedJobs: number;
  experience: string;
  location: string;
  isVerified: boolean;
  avatar: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  service: string;
  avatar: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  slug: string;
  image: string;
  isFeatured?: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface PaymentMethod {
  name: string;
  icon: string;
  status: "coming-soon";
}
