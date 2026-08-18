import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import type { ApiProduct, ApiShopResponse } from "@/lib/api-types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const UPSTREAM_PAGE_SIZE = 200;

type UpstreamCatalog = ApiShopResponse & { products?: ApiProduct[]; data?: ApiProduct[] };

async function requestPage(offset: number): Promise<UpstreamCatalog> {
  const response = await fetch(`${API_BASE_URL}/api/shop/products?limit=${UPSTREAM_PAGE_SIZE}&offset=${offset}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Shop API returned HTTP ${response.status}`);
  return response.json() as Promise<UpstreamCatalog>;
}

const getCachedCatalog = unstable_cache(async () => {
  const first = await requestPage(0);
  const total = Number(first.total || 0);
  const offsets = Array.from(
    { length: Math.max(0, Math.ceil(total / UPSTREAM_PAGE_SIZE) - 1) },
    (_, index) => (index + 1) * UPSTREAM_PAGE_SIZE,
  );
  const remaining = await Promise.all(offsets.map(requestPage));
  const pages = [first, ...remaining];
  const products = [...new Map(pages.flatMap((page) => page.products || page.data || []).map((product) => [product.id, product])).values()];
  return { products, categories: first.categories || [] };
}, ["ustaadpro-complete-shop-catalog"], { revalidate: 600, tags: ["shop-catalog"] });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(15, Math.max(1, Number(searchParams.get("limit") || 15)));
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));
    const category = (searchParams.get("category") || "all").trim().toLowerCase();
    const sortBy = searchParams.get("sortBy") || "popular";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const catalog = await getCachedCatalog();

    const filtered = category === "all"
      ? [...catalog.products]
      : catalog.products.filter((product) => String(product.category || "").trim().toLowerCase() === category);

    if (sortBy === "price") {
      filtered.sort((a, b) => (Number(a.price) - Number(b.price)) * (sortOrder === "asc" ? 1 : -1));
    } else if (sortBy === "createdAt") {
      filtered.sort((a, b) => (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * (sortOrder === "asc" ? 1 : -1));
    }

    return NextResponse.json({
      products: filtered.slice(offset, offset + limit),
      categories: catalog.categories,
      total: filtered.length,
      limit,
      offset,
      category,
      hasMore: offset + limit < filtered.length,
    }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ message: "The product catalog is temporarily unavailable." }, { status: 503 });
  }
}
