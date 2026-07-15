import ProductDetailClient from "@/components/store/ProductDetailClient";
import { notFound } from "next/navigation";
import type { ApiProduct } from "@/lib/api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

async function getProductById(id: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.product || data?.data || null;
  } catch (error) {
    console.error("Failed to load product details:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
