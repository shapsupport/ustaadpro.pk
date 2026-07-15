import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import type { ApiService, ApiCategory } from "@/lib/api-types";

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

export default async function HomePage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  return (
    <LocationGate>
      <AppLayout initialServices={services} categories={categories} />
    </LocationGate>
  );
}
