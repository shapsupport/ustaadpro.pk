"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, PackageSearch } from "lucide-react";
import type { ApiProduct } from "@/lib/api-types";
import ProductDetailClient from "./ProductDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";

export default function ProductDetailLoader({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const cached = sessionStorage.getItem(`ustaadpro_product_${productId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as ApiProduct;
          if (active) { setProduct(parsed); setLoading(false); }
          return;
        }

        const direct = await fetch(`${API_BASE}/api/shop/products/${encodeURIComponent(productId)}`, { cache: "no-store" });
        if (direct.ok) {
          const data = await direct.json();
          const found = data?.product || data?.data;
          if (found && active) { setProduct(found); setLoading(false); return; }
        }

        let offset = 0;
        let hasMore = true;
        while (hasMore && active) {
          const response = await fetch(`${API_BASE}/api/shop/products?limit=30&offset=${offset}`, { cache: "no-store" });
          if (!response.ok) break;
          const data = await response.json();
          const products: ApiProduct[] = Array.isArray(data?.products) ? data.products : [];
          const found = products.find((item) => item.id === productId);
          if (found) { setProduct(found); break; }
          hasMore = Boolean(data?.hasMore);
          offset += 30;
        }
      } catch {
        // The friendly unavailable state below handles network failures.
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [productId]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-lime-600" /></div>;
  if (!product) return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 text-center"><div className="w-full rounded-3xl border bg-white p-8 shadow-sm"><PackageSearch className="mx-auto h-12 w-12 text-slate-400" /><h1 className="mt-4 text-2xl font-bold text-slate-900">Product unavailable</h1><p className="mt-2 text-sm text-slate-600">We could not load this product right now. It may have been removed or the shop API may be temporarily unavailable.</p><Link href="/store" className="mt-6 inline-flex rounded-xl bg-lime-500 px-5 py-3 font-semibold text-white">Return to shop</Link></div></div>;
  return <ProductDetailClient product={product} />;
}
