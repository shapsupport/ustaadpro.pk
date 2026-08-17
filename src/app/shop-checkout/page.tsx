"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, Plus, ShoppingBag } from "lucide-react";
import CartCheckoutModal from "@/components/store/CartCheckoutModal";
import { useCart } from "@/context/CartContext";
import type { ApiProduct } from "@/lib/api-types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const RECOMMENDATIONS_KEY = "ustaadpro:checkout-recommendations:v1";
const RECOMMENDATIONS_TTL = 5 * 60 * 1000;

function readRecommendations(): ApiProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = JSON.parse(sessionStorage.getItem(RECOMMENDATIONS_KEY) || "null") as { expiresAt?: number; products?: ApiProduct[] } | null;
    if (!cached?.expiresAt || cached.expiresAt <= Date.now() || !Array.isArray(cached.products)) return [];
    return cached.products;
  } catch {
    return [];
  }
}

function productImage(url?: string) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { items, hydrated, addItem } = useCart();
  const [products, setProducts] = useState<ApiProduct[]>(readRecommendations);
  const [orderComplete, setOrderComplete] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [checkoutCycle, setCheckoutCycle] = useState(0);

  useEffect(() => {
    if (!hydrated || (items.length === 0 && !orderComplete) || products.length > 0) return;
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/shop/products?limit=12&offset=0`, {
      signal: controller.signal,
      cache: "default",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Recommendations unavailable");
        const data = await response.json() as { products?: ApiProduct[]; data?: ApiProduct[] };
        return Array.isArray(data.products) ? data.products : Array.isArray(data.data) ? data.data : [];
      })
      .then((results) => {
        const unique = [...new Map(results.filter((product) => product?.id && product.isActive !== false).map((product) => [product.id, product])).values()];
        setProducts(unique);
        try {
          sessionStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify({ expiresAt: Date.now() + RECOMMENDATIONS_TTL, products: unique }));
        } catch { /* Recommendations remain available without storage. */ }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [hydrated, items.length, orderComplete, products.length]);

  const cartIds = useMemo(() => new Set(items.map((item) => item.product.id)), [items]);
  const recommendations = useMemo(
    () => products.filter((product) => !cartIds.has(product.id) && !purchasedIds.includes(product.id) && Number(product.stock || 0) > 0).slice(0, 8),
    [cartIds, products, purchasedIds],
  );

  const addRecommendedProduct = (product: ApiProduct) => {
    addItem(product);
    if (orderComplete) {
      setOrderComplete(false);
      setCheckoutCycle((cycle) => cycle + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-slate-50 pb-10">
      <CartCheckoutModal
        key={checkoutCycle}
        isOpen
        pageMode
        onClose={() => router.push("/store")}
        onOrderSuccess={(ids) => {
          setPurchasedIds(ids);
          setOrderComplete(true);
        }}
      />

      {hydrated && (items.length > 0 || orderComplete) && recommendations.length > 0 && (
        <section className="mx-auto mt-4 max-w-7xl px-3 sm:mt-6 sm:px-5" aria-labelledby="more-products-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{orderComplete ? "Keep shopping" : "Complete your order"}</p>
              <h2 id="more-products-title" className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{orderComplete ? "Buy something else" : "You may also like"}</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{orderComplete ? "Add another product to start a new checkout." : "Useful products you can add before checkout."}</p>
            </div>
            <Link href="/store" className="hidden shrink-0 items-center gap-1 text-sm font-bold text-emerald-700 hover:underline sm:flex">
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {recommendations.map((product) => {
              const imageUrl = productImage(product.imageUrl);
              return (
                <article key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md">
                  <Link href={`/store/${encodeURIComponent(product.id)}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100" aria-label={`View ${product.title}`}>
                    {imageUrl ? (
                      <Image src={imageUrl} alt={product.title} fill className="object-cover transition duration-300 hover:scale-[1.03]" sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center"><Package className="h-10 w-10 text-slate-300" /></span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <Link href={`/store/${encodeURIComponent(product.id)}`} className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 hover:text-emerald-700 sm:text-base">
                      {product.title}
                    </Link>
                    <p className="mt-2 text-base font-black text-slate-950 sm:text-lg">Rs {Number(product.price || 0).toLocaleString("en-PK")}</p>
                    <button type="button" onClick={() => addRecommendedProduct(product)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] sm:text-sm">
                      <Plus className="h-4 w-4" /> {orderComplete ? "Buy next" : "Add to cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <Link href="/store" className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white text-sm font-bold text-emerald-700 sm:hidden">
            <ShoppingBag className="h-4 w-4" /> Browse all products <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
