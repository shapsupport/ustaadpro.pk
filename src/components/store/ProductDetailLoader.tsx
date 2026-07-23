"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import type { ApiProduct } from "@/lib/api-types";
import ProductDetailClient from "./ProductDetailClient";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (loading) return <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10" role="status" aria-label="Loading product"><span className="sr-only">Loading product…</span><Skeleton className="h-11 w-24" /><div className="mt-8 grid gap-8 lg:grid-cols-2"><Skeleton className="aspect-[4/3] rounded-3xl" /><div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6"><Skeleton className="h-5 w-28" /><Skeleton className="h-10 w-4/5" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-12 w-40" /><Skeleton className="mt-8 h-28 w-full" /><Skeleton className="h-12 w-full" /></div></div></div>;
  if (!product) return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 text-center"><div className="w-full rounded-3xl border bg-white p-8 shadow-sm"><PackageSearch className="mx-auto h-12 w-12 text-slate-400" /><h1 className="mt-4 text-2xl font-bold text-slate-900">Product unavailable</h1><p className="mt-2 text-sm text-slate-600">We could not load this product right now. It may have been removed or the shop API may be temporarily unavailable.</p><Link href="/store" className="mt-6 inline-flex rounded-xl bg-lime-500 px-5 py-3 font-semibold text-white">Return to shop</Link></div></div>;
  return <ProductDetailClient product={product} />;
}
