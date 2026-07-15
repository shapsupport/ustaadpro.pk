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
  ArrowRight,
  Bell,
  Filter,
  Package,
  Search,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
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
  const [categories, setCategories] = useState<ApiShopResponse["categories"]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("featured");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/products?limit=100`, {
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
    } catch (error) {
      console.error("Failed to load store products:", error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const runLoad = async () => {
      if (mounted && products.length === 0) {
        setLoading(true);
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/shop/products?limit=100`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Unable to load products");

        const data = await res.json();
        const allProducts = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
            ? data.data
            : [];

        if (mounted) {
          setProducts(allProducts.filter((product: ApiProduct) => product?.id));
          setCategories(Array.isArray(data?.categories) ? data.categories : []);
        }
      } catch (error) {
        console.error("Failed to load store products:", error);
        if (mounted) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void runLoad();

    const handleFocus = () => {
      void runLoad();
    };

    const intervalId = window.setInterval(() => {
      void runLoad();
    }, 60000);

    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(intervalId);
    };
  }, [products.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const categoryItems = useMemo(() => {
    const baseItems = [{ name: "all", total: products.length }];
    return [...baseItems, ...categories.map((item) => ({ name: item.name, total: item.total }))];
  }, [categories, products.length]);

  const filteredProducts = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    const matches = products.filter((product) => {
      const haystack = [product.title, product.category, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !keyword || haystack.includes(keyword);
      const matchesCategory =
        selectedCategory === "all" ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesKeyword && matchesCategory;
    });

    const sorted = [...matches];
    sorted.sort((left, right) => {
      if (sortOrder === "price-asc") return Number(left.price) - Number(right.price);
      if (sortOrder === "price-desc") return Number(right.price) - Number(left.price);
      if (sortOrder === "newest") {
        return (right.createdAt || "").localeCompare(left.createdAt || "");
      }
      return 0;
    });

    return sorted;
  }, [products, debouncedSearch, selectedCategory, sortOrder]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSortOrder("featured");
    setShowMobileFilters(false);
  }, []);

  const activeFilters = Boolean(debouncedSearch || selectedCategory !== "all" || sortOrder !== "featured");

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
                {products.length} products available
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
                <label className="mb-2 block text-sm font-semibold text-slate-700">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products"
                    className="h-10 rounded-2xl border-slate-200 pl-9"
                  />
                </div>
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
                        onClick={() => setSelectedCategory(item.name)}
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

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Sort by</label>
                <div className="rounded-2xl border border-slate-200 bg-white p-2">
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to high</option>
                    <option value="price-desc">Price: High to low</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{filteredProducts.length} products</p>
                <p className="mt-1 text-sm text-slate-600">
                  {debouncedSearch ? `Matching “${debouncedSearch}”` : "Ready to explore"}
                </p>
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
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                  className="h-11 rounded-2xl border-slate-200 pl-9"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">{filteredProducts.length} products</p>
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
                  Sorted by {sortOrder === "featured" ? "featured" : sortOrder === "newest" ? "newest" : sortOrder === "price-asc" ? "price low to high" : "price high to low"}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <Package className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No products match your search</h3>
                <p className="mt-2 text-sm text-slate-600">Try another keyword or adjust your filters to see more results.</p>
              </div>
            )}
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
                          setSelectedCategory(item.name);
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

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Sort by</label>
                <div className="rounded-2xl border border-slate-200 bg-white p-2">
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to high</option>
                    <option value="price-desc">Price: High to low</option>
                  </select>
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

function ProductCard({ product }: { product: ApiProduct }) {
  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));

  return (
    <Link href={`/store/${product.id}`}>
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
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700">4.8</span>
            <span>• In stock</span>
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
