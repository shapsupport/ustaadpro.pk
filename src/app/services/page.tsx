import type { Metadata } from "next";
import { ServicesPageContent } from "./ServicesPageContent";
import type { ApiService, ApiCategory } from "@/lib/api-types";

export const metadata: Metadata = {
  title: "Services | Ustaad Pro",
  description:
    "Browse professional home services including electrical, plumbing, AC repair, painting, cleaning, carpentry, CCTV installation, and more. Book verified professionals in Pakistan.",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

async function getServices(): Promise<ApiService[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/services/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
}

async function getCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  return <ServicesPageContent initialServices={services} initialCategories={categories} />;
}
