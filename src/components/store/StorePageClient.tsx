"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { ApiProduct, ApiShopResponse } from "@/lib/api-types";
import { searchApi } from "@/lib/search";
import {
  Check,
  ArrowRight,
  Grid2X2,
  Headphones,
  List,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingBasket,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { UniversalSearch } from "@/components/search/UniversalSearch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";
const CATALOG_CACHE_MS = 5 * 60_000;
type ShopCatalogResponse = ApiShopResponse & { products?: ApiProduct[]; data?: ApiProduct[] };
const catalogCache = new Map<string, { expiresAt: number; data: ShopCatalogResponse }>();

async function fetchCatalog(url: string): Promise<ShopCatalogResponse> {
  const cached = catalogCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const storageKey = `ustaadpro:shop-catalog:${url}`;
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null") as { expiresAt?: number; data?: ShopCatalogResponse } | null;
    if (stored?.expiresAt && stored.expiresAt > Date.now() && stored.data) {
      catalogCache.set(url, { expiresAt: stored.expiresAt, data: stored.data });
      return stored.data;
    }
  } catch { /* Continue with the network when storage is unavailable. */ }
  const response = await fetch(url, { cache: "default", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Unable to load products");
  const data = await response.json() as ShopCatalogResponse;
  const expiresAt = Date.now() + CATALOG_CACHE_MS;
  catalogCache.set(url, { expiresAt, data });
  try { sessionStorage.setItem(storageKey, JSON.stringify({ expiresAt, data })); } catch { /* Memory cache still applies. */ }
  return data;
}

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

function getShopShuffleSeed() {
  const storageKey = "ustaadpro_shop_shuffle_seed";
  try {
    const savedSeed = sessionStorage.getItem(storageKey);
    if (savedSeed) return Number(savedSeed);
    const nextSeed = Math.floor(Math.random() * 2_147_483_647);
    sessionStorage.setItem(storageKey, String(nextSeed));
    return nextSeed;
  } catch {
    return 1;
  }
}

function seededShuffle<T>(items: T[], seed: number) {
  const shuffled = [...items];
  let state = seed || 1;
  const random = () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function diversifyProducts(items: ApiProduct[], seed: number) {
  const groups = new Map<string, ApiProduct[]>();
  items.forEach((product) => {
    const category = product.category || "Other";
    groups.set(category, [...(groups.get(category) || []), product]);
  });

  const queues = seededShuffle(
    [...groups.entries()].map(([category, products], index) => ({
      category,
      products: seededShuffle(products, seed + index + 1),
    })),
    seed,
  );
  const diversified: ApiProduct[] = [];
  while (queues.some((queue) => queue.products.length > 0)) {
    queues.forEach((queue) => {
      const product = queue.products.shift();
      if (product) diversified.push(product);
    });
  }
  return diversified;
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
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "newest">("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const pageSize = 15;
  const resultsRef = useRef<HTMLDivElement>(null);
  const catalogRequestRef = useRef(0);

  useEffect(() => {
    let shouldReturnToTop = false;
    try {
      shouldReturnToTop = sessionStorage.getItem("ustaadpro_store_return_to_top") === "true";
      if (shouldReturnToTop) sessionStorage.removeItem("ustaadpro_store_return_to_top");
    } catch { /* Browser storage may be unavailable. */ }
    if (!shouldReturnToTop) return;

    // Run after navigation and once more after the browser's restoration pass.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.history.scrollRestoration = "auto";
    }, 100);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.history.scrollRestoration = "auto";
    };
  }, []);

  const loadProducts = useCallback(async () => {
    const requestId = ++catalogRequestRef.current;
    const requestKey = `${selectedCategory}:${sortBy}:${page}`;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (sortBy === "price-low") { params.set("sortBy", "price"); params.set("sortOrder", "asc"); }
      if (sortBy === "price-high") { params.set("sortBy", "price"); params.set("sortOrder", "desc"); }
      if (sortBy === "newest") { params.set("sortBy", "createdAt"); params.set("sortOrder", "desc"); }
      if (sortBy === "popular") { params.set("sortBy", "popular"); params.set("sortOrder", "desc"); }
      const firstPage = await fetchCatalog(`/api/shop/catalog?${params}`);
      const catalogTotal = Number(firstPage?.total || 0);
      const allProducts = Array.isArray(firstPage?.products)
        ? firstPage.products
        : Array.isArray(firstPage?.data)
          ? firstPage.data
          : [];

      // Respect the page boundary even if an API version returns more than requested.
      const normalizedProducts = uniqueProducts(allProducts.filter((product: ApiProduct) => product?.id)).slice(0, pageSize);
      if (requestId !== catalogRequestRef.current) return;
      setProducts(sortBy === "popular" ? diversifyProducts(normalizedProducts, getShopShuffleSeed() + page) : normalizedProducts);
      setCategories(Array.isArray(firstPage?.categories) ? firstPage.categories : []);
      setTotal(catalogTotal || normalizedProducts.length);
    } catch {
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
  }, [page, selectedCategory, sortBy]);

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
    setSortBy("popular");
    setView("grid");
    window.dispatchEvent(new Event("ustaadpro:shop-search-reset"));
  }, []);

  const activeFilters = selectedCategory !== "all" || Boolean(debouncedSearch) || sortBy !== "popular";
  const visibleTotal = debouncedSearch ? searchResults.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));
  const visibleProducts = debouncedSearch ? searchResults.slice((page - 1) * pageSize, page * pageSize) : products;
  const displayedProducts = useMemo(() => {
    const sorted = [...visibleProducts];
    if (sortBy === "price-low") sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-high") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "newest") sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return sorted;
  }, [sortBy, visibleProducts]);
  const catalogLoading = loading || (!debouncedSearch && loadedCatalogKey !== `${selectedCategory}:${sortBy}:${page}`);
  const skeletonCount = 8;
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
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_80%_20%,#d1fae5_0,transparent_35%),linear-gradient(110deg,#fff_0%,#f0fdf4_100%)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-emerald-200/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="relative z-10 sm:max-w-[58%] lg:max-w-[55%]">
            <div className="max-w-2xl">
              <Badge className="mb-2 border-lime-400/20 bg-lime-500/10 text-xs text-lime-700 sm:mb-3 sm:text-sm">
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Live inventory
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Shop the best essentials for every project.
              </h1>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                Browse the latest products from the live API, filter instantly, and place your order with a few simple steps.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5">
              <div className="rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-center text-[10px] font-bold text-emerald-800 shadow-sm sm:text-xs"><ShoppingBag className="mx-auto mb-1 h-4 w-4" />{total} products</div>
              <div className="rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-center text-[10px] font-bold text-emerald-800 shadow-sm sm:text-xs"><Truck className="mx-auto mb-1 h-4 w-4" />Fast delivery</div>
              <div className="rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-center text-[10px] font-bold text-emerald-800 shadow-sm sm:text-xs"><ShieldCheck className="mx-auto mb-1 h-4 w-4" />Verified stock</div>
            </div>
            <div className="relative mt-3 h-36 w-full sm:hidden">
              <Image src="/store/tools-bucket-hero-v1.webp" alt="Home improvement tools arranged in a green tool bucket" fill priority className="object-contain object-bottom" sizes="100vw" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] sm:block lg:w-[46%]">
            <Image
              src="/store/tools-bucket-hero-v1.webp"
              alt="Home improvement tools arranged in a green tool bucket"
              fill
              priority
              className="object-contain object-bottom"
              sizes="(max-width: 1023px) 43vw, 46vw"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1536px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="sticky top-20 z-30 w-full min-w-0 self-start rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur sm:rounded-3xl sm:p-4 sm:shadow-xl lg:top-24">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-lime-600" />
              <h2 className="text-sm font-semibold text-slate-900 sm:text-lg">Browse products</h2>
              <span className="ml-auto text-xs font-bold text-slate-500 lg:hidden">{visibleTotal.toLocaleString("en-PK")} products</span>
            </div>

            <div className="mt-3 lg:hidden">
              <UniversalSearch mobile defaultScope="shop_product" />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-3">
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
                        className={`flex shrink-0 items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm lg:w-full ${isActive
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

              <div className="hidden shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 lg:block">
                <p className="text-xs font-medium text-slate-500">Results available</p>
                <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-slate-900">{visibleTotal.toLocaleString("en-PK")} products</p>
              </div>

              {activeFilters ? (
                <Button type="button" variant="outline" className="w-full shrink-0" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}

              <div className="flex items-center gap-2 lg:hidden">
                <label className="sr-only" htmlFor="store-sort-mobile">Sort products</label>
                <select id="store-sort-mobile" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setPage(1); }} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
                  <option value="popular">Sort: Popular</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "grid" ? "bg-emerald-600 text-white shadow" : "text-slate-500"}`}><Grid2X2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "list" ? "bg-emerald-600 text-white shadow" : "text-slate-500"}`}><List className="h-4 w-4" /></button>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-2 text-[10px] font-bold text-slate-600">{page}/{pageCount}</span>
              </div>

              <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center lg:block">
                <Headphones className="mx-auto h-6 w-6 text-emerald-700" />
                <p className="mt-2 text-xs font-black text-emerald-900">Need help finding a product?</p>
                <Link href="/contact" className="mt-3 flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100">Contact Us</Link>
              </div>
            </div>
          </aside>

          <div ref={resultsRef} className="min-h-screen scroll-mt-28 space-y-6">
            <div className="sticky top-24 z-20 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:block lg:rounded-3xl lg:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-600">Catalog</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Find the right product faster</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="store-sort">Sort products</label>
                  <select id="store-sort" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setPage(1); }} className="h-10 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
                    <option value="popular">Sort: Popular</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "grid" ? "bg-emerald-600 text-white shadow" : "text-slate-500"}`}><Grid2X2 className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "list" ? "bg-emerald-600 text-white shadow" : "text-slate-500"}`}><List className="h-4 w-4" /></button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">Page {page} of {pageCount}</div>
                </div>
              </div>
            </div>

            {catalogLoading || searching ? (
              <ProductGridSkeleton count={skeletonCount} />
            ) : displayedProducts.length > 0 ? (
              <div className={view === "grid" ? "grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-2 gap-2.5 sm:grid-cols-1 sm:gap-4"}>
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    list={view === "list"}
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

function ProductCard({ product, list = false }: { product: ApiProduct; list?: boolean }) {
  const router = useRouter();
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

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    router.push("/shop-checkout");
  };

  return (
    <Card className={`group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 transition-all hover:-translate-y-1 hover:border-lime-200 hover:shadow-xl sm:rounded-2xl ${list ? "sm:flex-row" : ""}`}>
      {/* Clickable image + info area */}
      <Link
        href={`/store/${product.id}`}
        onClick={() => { try { sessionStorage.setItem(`ustaadpro_product_${product.id}`, JSON.stringify(product)); } catch { } }}
        className={`block flex-1 ${list ? "sm:grid sm:grid-cols-[190px_minmax(0,1fr)]" : ""}`}
      >
        <div className={`relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white sm:rounded-t-2xl ${list ? "sm:aspect-auto sm:min-h-48 sm:rounded-l-2xl sm:rounded-tr-none" : ""}`}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.title}
              fill
              className="rounded-lg object-contain p-2 [image-rendering:auto] transition-transform duration-500 group-hover:scale-[1.02] sm:rounded-xl sm:p-3"
              sizes="(max-width:639px) 50vw, (max-width:1279px) 50vw, 25vw"
              quality={88}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {hasDiscount ? (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
              Save {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
            </div>
          ) : null}
        </div>

        <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-lime-600 sm:text-[11px] sm:tracking-[0.18em]">{product.category}</p>
          <h3 className="mt-1 line-clamp-2 min-h-9 text-xs font-bold leading-[1.125rem] text-slate-900 transition-colors group-hover:text-lime-700 sm:mt-1.5 sm:min-h-0 sm:text-base sm:leading-snug">
            {product.title}
          </h3>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 group-hover:underline sm:text-xs">
            <span className="sm:hidden">Details</span><span className="hidden sm:inline">View details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>

          <div className="mt-1 hidden items-center gap-2 text-xs text-slate-500 sm:mt-2 sm:flex">
            <span>{product.stock > 0 ? "Available to order" : "Currently unavailable"}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:mt-3 sm:gap-2">
            <span className="text-sm font-black text-slate-900 sm:text-xl">{formatPrice(product.price)}</span>
            {hasDiscount ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-sm">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className={`p-2 pt-1 sm:p-3 sm:pt-1 ${list ? "sm:w-72 sm:shrink-0 sm:self-center" : ""}`}>
        <div className="mb-1.5 flex items-center justify-end gap-2 sm:mb-2 sm:justify-between">
          <span className="hidden text-xs font-bold text-slate-600 sm:inline">Quantity</span>
          <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-9 sm:rounded-xl">
            <button type="button" onClick={() => setSafeQuantity(quantity - 1)} disabled={quantity <= 1 || isOutOfStock} className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-35" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
            <input
              type="number"
              min={1}
              max={Math.max(1, product.stock)}
              value={quantity}
              disabled={isOutOfStock}
              onChange={(event) => setSafeQuantity(Number(event.target.value))}
              className="h-full w-8 border-x border-slate-200 bg-white text-center text-xs font-black text-slate-900 outline-none [appearance:textfield] sm:w-12 sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label={`Quantity for ${product.title}`}
            />
            <button type="button" onClick={() => setSafeQuantity(quantity + 1)} disabled={quantity >= product.stock || isOutOfStock} className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-35" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={added ? "Added to cart" : "Add to cart"}
            className={`relative flex h-11 items-center justify-center rounded-xl border-2 text-xs font-bold shadow-sm transition active:scale-95 sm:h-12 ${isOutOfStock
              ? "cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50"
              : added
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100"
              }`}
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBasket className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
            )}
            {!isOutOfStock && <span className={`absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full text-[11px] font-black leading-none shadow ${added ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"}`}>{added ? "✓" : "+"}</span>}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex h-11 min-w-0 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:h-12 sm:gap-1.5 sm:text-sm"
          >
            {isOutOfStock ? "Unavailable" : "Buy Now"} {!isOutOfStock && <ArrowRight className="h-4 w-4 shrink-0" />}
          </button>
        </div>
      </div>
    </Card>
  );
}
