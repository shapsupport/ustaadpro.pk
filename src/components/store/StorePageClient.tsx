"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { ApiProduct, ApiShopResponse } from "@/lib/api-types";
import { searchApi } from "@/lib/search";
import {
  Check,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(price?: number | string) {
  const amount = Number(price || 0);
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

function normalizedProductName(value?: string) {
  return (value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function uniqueProducts(items: ApiProduct[]) {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  return items.filter((product) => {
    const id = String(product.id || "");
    const name = normalizedProductName(product.title);
    if (!id || !name || seenIds.has(id) || seenNames.has(name)) return false;
    seenIds.add(id);
    seenNames.add(name);
    return true;
  });
}

const PREFERRED_CATEGORY_ORDER = ["Paints", "Tools", "Hardware"];
const CATEGORY_BATCH_SIZE = 3;

function mixedSlots(categories: ApiShopResponse["categories"], start: number, size: number) {
  const ordered = [...categories].sort((a, b) => {
    const aIndex = PREFERRED_CATEGORY_ORDER.indexOf(a.name);
    const bIndex = PREFERRED_CATEGORY_ORDER.indexOf(b.name);
    return (aIndex === -1 ? PREFERRED_CATEGORY_ORDER.length : aIndex) - (bIndex === -1 ? PREFERRED_CATEGORY_ORDER.length : bIndex);
  });
  const used = new Map(ordered.map((category) => [category.name, 0]));
  const slots: Array<{ category: string; ordinal: number }> = [];
  let globalIndex = 0;

  while (slots.length < size && ordered.some((category) => (used.get(category.name) || 0) < category.total)) {
    for (const category of ordered) {
      for (let entry = 0; entry < CATEGORY_BATCH_SIZE; entry += 1) {
        const ordinal = used.get(category.name) || 0;
        if (ordinal >= category.total) break;
        if (globalIndex >= start && slots.length < size) slots.push({ category: category.name, ordinal });
        used.set(category.name, ordinal + 1);
        globalIndex += 1;
      }
      if (slots.length >= size) break;
    }
  }
  return slots;
}

export default function StorePageClient() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<ApiShopResponse["categories"]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedCatalogKey, setLoadedCatalogKey] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 40;
  const resultsRef = useRef<HTMLDivElement>(null);
  const catalogRequestRef = useRef(0);

  const loadProducts = useCallback(async () => {
    const requestId = ++catalogRequestRef.current;
    const requestKey = `${selectedCategory}:${page}`;
    setLoading(true);
    try {
      if (selectedCategory === "all") {
        const metadataResponse = await fetch(`${API_BASE_URL}/api/shop/products?limit=1&offset=0`, { cache: "no-store" });
        if (!metadataResponse.ok) throw new Error("Unable to load product categories");
        const metadata = await metadataResponse.json();
        const catalogCategories: ApiShopResponse["categories"] = Array.isArray(metadata?.categories) ? metadata.categories : [];
        const slots = mixedSlots(catalogCategories, (page - 1) * pageSize, pageSize);
        const requests = [...new Set(slots.map((slot) => slot.category))].map(async (category) => {
          const categorySlots = slots.filter((slot) => slot.category === category);
          const offset = categorySlots[0]?.ordinal || 0;
          const response = await fetch(`${API_BASE_URL}/api/shop/products?limit=${categorySlots.length}&offset=${offset}&category=${encodeURIComponent(category)}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Unable to load ${category}`);
          const data = await response.json();
          return [category, Array.isArray(data?.products) ? data.products : []] as const;
        });
        const batches = new Map(await Promise.all(requests));
        const cursors = new Map<string, number>();
        const mixedProducts = slots.flatMap((slot) => {
          const cursor = cursors.get(slot.category) || 0;
          const product = batches.get(slot.category)?.[cursor];
          cursors.set(slot.category, cursor + 1);
          return product ? [product as ApiProduct] : [];
        });
        if (requestId !== catalogRequestRef.current) return;
        setProducts(uniqueProducts(mixedProducts));
        setCategories(catalogCategories);
        setTotal(catalogCategories.reduce((sum, category) => sum + Number(category.total || 0), 0));
        return;
      }

      const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      params.set("category", selectedCategory);
      const res = await fetch(`${API_BASE_URL}/api/shop/products?${params}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Unable to load products");

      const data = await res.json();
      const allProducts = Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const normalizedProducts = uniqueProducts(allProducts.filter((product: ApiProduct) => product?.id));
      if (requestId !== catalogRequestRef.current) return;
      setProducts(normalizedProducts);
      setCategories(Array.isArray(data?.categories) ? data.categories : []);
      setTotal(Number(data?.total || normalizedProducts.length));
    } catch (error) {
      console.error("Failed to load store products:", error);
      if (requestId === catalogRequestRef.current) {
        setProducts([]);
        setCategories([]);
      }
    } finally {
      if (requestId === catalogRequestRef.current) {
        setLoadedCatalogKey(requestKey);
        setLoading(false);
      }
    }
  }, [selectedCategory, page]);

  useEffect(() => {
    if (debouncedSearch) return;
    const timer = window.setTimeout(() => void loadProducts(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts, debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) {
      return;
    }
    let active = true;
    const controller = new AbortController();
    async function searchAllProducts() {
      setSearching(true);
      try {
        const matches = await searchApi(debouncedSearch, "shop_product", controller.signal);
        if (active) setSearchResults(uniqueProducts(matches));
      } catch { if (active) setSearchResults([]); }
      finally { if (active) setSearching(false); }
    }
    void searchAllProducts();
    return () => { active = false; controller.abort(); };
  }, [debouncedSearch]);

  const categoryItems = useMemo(() => {
    const allTotal = categories.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const baseItems = [{ name: "all", total: selectedCategory === "all" ? total : allTotal }];
    return [...baseItems, ...categories.map((item) => ({ name: item.name, total: item.total }))];
  }, [categories, selectedCategory, total]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    window.dispatchEvent(new Event("ustaadpro:shop-search-reset"));
  }, []);

  const activeFilters = selectedCategory !== "all" || Boolean(debouncedSearch);
  const visibleTotal = debouncedSearch ? searchResults.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));
  const visibleProducts = debouncedSearch ? searchResults.slice((page - 1) * pageSize, page * pageSize) : products;
  const catalogLoading = loading || (!debouncedSearch && loadedCatalogKey !== `${selectedCategory}:${page}`);
  const skeletonCount = Math.max(12, products.length, visibleProducts.length);
  const handleSearchChange = useCallback((value: string) => {
    const isStartingSearch = !search.trim() && Boolean(value.trim());
    setSearch(value);
    setPage(1);
    if (value.trim()) {
      setSearching(true);
      if (isStartingSearch) {
        const target = resultsRef.current;
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 112;
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
      }
    }
    else {
      setSearching(false);
      setDebouncedSearch("");
    }
  }, [search]);
  useEffect(() => {
    const syncNavbarSearch = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; category?: string }>).detail;
      handleSearchChange(String(detail?.query || ""));
      setSelectedCategory(String(detail?.category || "all"));
    };
    window.addEventListener("ustaadpro:shop-search", syncNavbarSearch);
    return () => window.removeEventListener("ustaadpro:shop-search", syncNavbarSearch);
  }, [handleSearchChange]);
  const chooseCategory = useCallback((category: string) => {
    if (!search.trim()) setLoading(true);
    setSelectedCategory(category);
    setPage(1);
    const target = resultsRef.current;
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [search]);
  const choosePage = useCallback((nextPage: number) => {
    const target = resultsRef.current;
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    setPage(nextPage);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 border-lime-400/20 bg-lime-500/10 text-sm text-lime-700">
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Live inventory
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Shop the best essentials for every project.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Browse the latest products from the live API, filter instantly, and place your order with a few simple steps.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-700">
                {total} products available
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                Fast delivery • Verified stock
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1536px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="sticky top-24 z-30 w-full min-w-0 self-start rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-lime-600" />
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-2 hidden text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 lg:block">Product categories</p>
                <div className="shop-category-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                  {categoryItems.map((item) => {
                    const isActive = selectedCategory === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => chooseCategory(item.name)}
                        className={`flex shrink-0 items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                          isActive
                            ? "border-lime-500 bg-lime-50 text-lime-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-lime-200 hover:text-lime-700"
                        }`}
                      >
                        <span>{item.name === "all" ? "All Products" : item.name}</span>
                        <span className="text-xs text-slate-500">{item.total}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs font-medium text-slate-500">Results available</p>
                <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-slate-900">{visibleTotal.toLocaleString("en-PK")} products</p>
              </div>

              {activeFilters ? (
                <Button type="button" variant="outline" className="w-full shrink-0" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </aside>

          <div ref={resultsRef} className="min-h-screen scroll-mt-28 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-600">Catalog</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Find the right product faster</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                  Page {page} of {pageCount}
                </div>
              </div>
            </div>

            {catalogLoading || searching ? (
              <ProductGridSkeleton count={skeletonCount} />
            ) : visibleProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <Package className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
                <p className="mt-2 text-sm text-slate-600">Try a different product name or choose another category.</p>
              </div>
            )}
            {!catalogLoading && !searching && pageCount > 1 ? <Pagination page={page} pageCount={pageCount} onPage={choosePage} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === pageCount || Math.abs(item - page) <= 2,
  );
  return <nav aria-label="Shop pages" className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <Button type="button" variant="outline" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</Button>
    {pages.map((item, index) => <span key={item} className="contents">
      {index > 0 && item - pages[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}
      <Button type="button" variant={item === page ? "default" : "outline"} aria-current={item === page ? "page" : undefined} onClick={() => onPage(item)} className="min-w-10">{item}</Button>
    </span>)}
    <Button type="button" variant="outline" disabled={page === pageCount} onClick={() => onPage(page + 1)}>Next</Button>
  </nav>;
}

function ProductCard({ product }: { product: ApiProduct }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const setSafeQuantity = (value: number) => {
    setQuantity(Math.min(Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1), Math.max(1, product.stock)));
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-slate-200 transition-all hover:-translate-y-1 hover:border-lime-200 hover:shadow-xl">
      {/* Clickable image + info area */}
      <Link
        href={`/store/${product.id}`}
        onClick={() => { try { sessionStorage.setItem(`ustaadpro_product_${product.id}`, JSON.stringify(product)); } catch {} }}
        className="block flex-1"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {hasDiscount ? (
            <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
              Save {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
            </div>
          ) : null}
        </div>

        <div className="p-3 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-600">{product.category}</p>
          <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-lime-700">
            {product.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>{product.stock > 0 ? "Available to order" : "Currently unavailable"}</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-black text-slate-900">{formatPrice(product.price)}</span>
            {hasDiscount ? (
              <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="p-3 pt-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-600">Quantity</span>
          <div className="flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <button type="button" onClick={() => setSafeQuantity(quantity - 1)} disabled={quantity <= 1 || isOutOfStock} className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-35" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
            <input
              type="number"
              min={1}
              max={Math.max(1, product.stock)}
              value={quantity}
              disabled={isOutOfStock}
              onChange={(event) => setSafeQuantity(Number(event.target.value))}
              className="h-full w-12 border-x border-slate-200 bg-white text-center text-sm font-black text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label={`Quantity for ${product.title}`}
            />
            <button type="button" onClick={() => setSafeQuantity(quantity + 1)} disabled={quantity >= product.stock || isOutOfStock} className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-35" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Link
          href={`/store/${product.id}`}
          onClick={() => { try { sessionStorage.setItem(`ustaadpro_product_${product.id}`, JSON.stringify(product)); } catch {} }}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-lime-500 text-xs font-bold text-white transition hover:bg-lime-600"
        >
          View details
        </Link>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={added ? "Added to cart" : "Add to cart"}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition cursor-pointer ${
            isOutOfStock
              ? "cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50"
              : added
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-emerald-500 bg-white text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{added ? "Added" : "Add"}</span>
        </button>
        </div>
      </div>
    </Card>
  );
}
