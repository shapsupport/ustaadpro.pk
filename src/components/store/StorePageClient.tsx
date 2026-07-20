"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper } from "@/components/motion/MotionWrapper";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import type { ApiProduct, ApiShopResponse } from "@/lib/api-types";
import {
  Bell,
  Filter,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";

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

export default function StorePageClient() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<ApiShopResponse["categories"]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadProducts = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      if (selectedCategory !== "all") params.set("category", selectedCategory);
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

      const normalizedProducts = allProducts.filter((product: ApiProduct) => product?.id);
      setProducts(normalizedProducts);
      setCategories(Array.isArray(data?.categories) ? data.categories : []);
      setTotal(Number(data?.total || normalizedProducts.length));
    } catch (error) {
      console.error("Failed to load store products:", error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page]);

  useEffect(() => {
    if (debouncedSearch) return;
    // Fetch the selected API category whenever the filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts, debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) {
      // Clear the derived result set when returning to normal API pagination.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    let active = true;
    async function searchAllProducts() {
      setSearching(true);
      try {
        const catalog: ApiProduct[] = [];
        let offset = 0;
        let hasMore = true;
        while (hasMore && active) {
          const params = new URLSearchParams({ limit: "30", offset: String(offset) });
          if (selectedCategory !== "all") params.set("category", selectedCategory);
          const response = await fetch(`${API_BASE_URL}/api/shop/products?${params}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Search could not load the catalog");
          const data = await response.json();
          const batch: ApiProduct[] = Array.isArray(data?.products) ? data.products : [];
          catalog.push(...batch);
          hasMore = Boolean(data?.hasMore);
          offset += 30;
        }
        const keyword = debouncedSearch.toLocaleLowerCase();
        const matches = catalog.filter((product) => [product.title, product.category, product.description].filter(Boolean).join(" ").toLocaleLowerCase().includes(keyword));
        if (active) setSearchResults(matches);
      } catch { if (active) setSearchResults([]); }
      finally { if (active) setSearching(false); }
    }
    void searchAllProducts();
    return () => { active = false; };
  }, [debouncedSearch, selectedCategory]);

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
    setShowMobileFilters(false);
  }, []);

  const activeFilters = selectedCategory !== "all" || Boolean(debouncedSearch);
  const visibleTotal = debouncedSearch ? searchResults.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));
  const visibleProducts = debouncedSearch ? searchResults.slice((page - 1) * pageSize, page * pageSize) : products;
  const chooseCategory = useCallback((category: string) => { setSelectedCategory(category); setPage(1); }, []);

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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside className="sticky top-24 hidden h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-lime-600" />
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="store-search" className="mb-2 block text-sm font-semibold text-slate-700">Search all products</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="store-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, category, description…" className="h-11 rounded-2xl border-slate-200 pl-9" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Searches the complete {selectedCategory === "all" ? "shop catalog" : selectedCategory + " category"}.</p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Categories</p>
                  <span className="text-xs font-medium text-slate-500">{categoryItems.length - 1} options</span>
                </div>
                <div className="space-y-2">
                  {categoryItems.map((item) => {
                    const isActive = selectedCategory === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => chooseCategory(item.name)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition ${
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{visibleTotal.toLocaleString("en-PK")} products</p>
                <p className="mt-1 text-sm text-slate-600">{debouncedSearch ? `Matching “${debouncedSearch}”` : selectedCategory === "all" ? "All categories" : selectedCategory}</p>
              </div>

              {activeFilters ? (
                <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search all products" className="h-11 rounded-2xl border-slate-200 pl-9" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">{searching ? "Searching full catalog…" : `${visibleTotal} results · Page ${page} of ${pageCount}`}</p>
                <Button type="button" variant="outline" className="gap-2" onClick={() => setShowMobileFilters(true)}>
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

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

            {loading || searching ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                ))}
              </div>
            ) : visibleProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <Package className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
                  <p className="mt-2 text-sm text-slate-600">Try a different product name or choose another category.</p>
                </div>
            )}
            {!loading && pageCount > 1 ? <Pagination page={page} pageCount={pageCount} onPage={setPage} /> : null}
          </div>
        </div>
      </div>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">Filters</p>
                <p className="text-sm text-slate-500">Refine the catalog</p>
              </div>
              <button type="button" onClick={() => setShowMobileFilters(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-auto p-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Categories</p>
                <div className="space-y-2">
                  {categoryItems.map((item) => {
                    const isActive = selectedCategory === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          chooseCategory(item.name);
                          setShowMobileFilters(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                          isActive
                            ? "border-lime-500 bg-lime-50 text-lime-700"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span>{item.name === "all" ? "All Products" : item.name}</span>
                        <span className="text-xs text-slate-500">{item.total}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilters ? (
                <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="bg-slate-900 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">Why shop with us</p>
              <h2 className="mt-3 text-3xl font-bold text-white">A smarter way to buy home project essentials</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                From tools to finishing materials, our store helps customers find dependable products with clear pricing and fast support.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Live availability", description: "Products are pulled directly from the shop API." },
                { title: "Premium selection", description: "Curated categories for repairs, finishes, and maintenance." },
                { title: "Easy ordering", description: "Product details and order form built for a real shopping flow." },
                { title: "Customer-first support", description: "Helpful guidance before and after purchase." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper>
            <SectionHeader
              badge="FAQs"
              title="Frequently asked questions"
              description="Everything you need to know before placing an order from our online store."
            />
          </MotionWrapper>
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              {[
                {
                  question: "How do I place an order?",
                  answer: "Open any product, review the details, and submit the order form with your contact information.",
                },
                {
                  question: "Can I search by category?",
                  answer: "Yes. The filter drawer lets you quickly narrow the catalog by category and sort by price or newest items.",
                },
                {
                  question: "Do you ship nationwide?",
                  answer: "Yes. We support nationwide delivery and will confirm the delivery details once your order is placed.",
                },
              ].map((item) => (
                <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <Bell className="mx-auto mb-4 h-10 w-10 text-lime-400" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Stay updated with new arrivals</h2>
              <p className="mt-4 text-gray-400">Subscribe for stock updates, new products, and special offers.</p>
              <div className="mt-8">
                <NewsletterForm />
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>
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
  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));

  return (
    <Link href={`/store/${product.id}`} onClick={() => { try { sessionStorage.setItem(`ustaadpro_product_${product.id}`, JSON.stringify(product)); } catch {} }}>
      <Card className="group h-full overflow-hidden border border-slate-200 transition-all hover:-translate-y-1 hover:border-lime-200 hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.title}
              fill
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

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-600">{product.category}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-lime-700">
            {product.title}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <span>{product.stock > 0 ? `${product.stock.toLocaleString("en-PK")} in stock` : "Out of stock"}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
            {hasDiscount ? (
              <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>

          <div className="mt-5 flex gap-2">
            <Button size="sm" className="flex-1 bg-lime-500 text-xs font-semibold text-white hover:bg-lime-600">
              View details
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
