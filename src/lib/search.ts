import type { ApiProduct, ApiService } from "@/lib/api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

export type SearchResult = Partial<ApiService & ApiProduct> & {
  resultType: "service" | "shop_product";
  suggestionId?: string;
  category_id?: string;
  categoryId?: string;
};

function searchTerms(query: string) {
  const value = query.trim();
  const terms = [value];
  if (/\bac\b/i.test(value)) terms.push(value.replace(/\bac\b/gi, "HVAC"));
  if (/\bhvac\b/i.test(value)) terms.push(value.replace(/\bhvac\b/gi, "AC"));
  return [...new Set(terms)];
}

function uniqueResults(results: SearchResult[]) {
  return [...new Map(results.map((result) => [`${result.resultType}-${result.id}`, result])).values()];
}

export async function searchSuggestions(
  query: string,
  scope: "all" | SearchResult["resultType"] = "all",
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const resultGroups = await Promise.all(searchTerms(query).map(async (term) => {
    const params = new URLSearchParams({ q: term, limit: "30", offset: "0" });
    const response = await fetch(`${API_BASE_URL}/api/search?${params}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error(`Search returned HTTP ${response.status}`);
    const data = await response.json();
    return (Array.isArray(data?.results) ? data.results : []) as SearchResult[];
  }));
  const results = uniqueResults(resultGroups.flat());
  if (scope === "all") {
    return [
      ...results.filter((result) => result.resultType === "service").slice(0, 4),
      ...results.filter((result) => result.resultType === "shop_product").slice(0, 4),
    ];
  }

  return results.filter((result) => result.resultType === scope).slice(0, 8);
}

export async function searchApi(query: string, resultType: "service", signal?: AbortSignal): Promise<ApiService[]>;
export async function searchApi(query: string, resultType: "shop_product", signal?: AbortSignal): Promise<ApiProduct[]>;
export async function searchApi(query: string, resultType: SearchResult["resultType"], signal?: AbortSignal): Promise<ApiService[] | ApiProduct[]> {
  const matches: SearchResult[] = [];
  for (const term of searchTerms(query)) {
    let offset = 0;
    let hasMore = true;
    while (hasMore && offset < 5_000) {
      const params = new URLSearchParams({ q: term, limit: "50", offset: String(offset) });
      const response = await fetch(`${API_BASE_URL}/api/search?${params}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error(`Search returned HTTP ${response.status}`);
      const data = await response.json();
      const results: SearchResult[] = Array.isArray(data?.results) ? data.results : [];
      matches.push(...results.filter((result) => result.resultType === resultType));
      hasMore = Boolean(data?.hasMore);
      offset += Number(data?.limit || 50);
    }
  }

  const deduplicatedMatches = uniqueResults(matches);

  if (resultType === "shop_product") {
    return deduplicatedMatches.map((result) => ({
      id: String(result.id || ""),
      title: result.title || "Untitled product",
      category: result.category || "Other",
      description: result.description || "",
      price: Number(result.price || 0),
      originalPrice: Number(result.originalPrice || result.price || 0),
      imageUrl: result.imageUrl || "",
      stock: Number(result.stock || 0),
      isActive: result.isActive ?? true,
      createdAt: result.createdAt || "",
    } satisfies ApiProduct));
  }

  return deduplicatedMatches.map((result) => ({
    ...result,
    id: String(result.id || ""),
    category_id: result.category_id || result.categoryId || "",
    subcategory_id: result.subcategory_id || "",
    title: result.title || "Untitled service",
    description: result.description || "",
    price: Number(result.price || 0),
    original_price: result.original_price || result.originalPrice || 0,
    duration: result.duration || "",
    rating: Number(result.rating || 0),
    reviews: Number(result.reviews || 0),
    service_type: result.service_type || result.serviceType || "",
    image_url: result.image_url || result.imageUrl || "",
    detail_description: result.detail_description || result.detailDescription || result.description || "",
    details: result.details || [],
    includes: result.includes || [],
    excludes: result.excludes || [],
    created_at: result.created_at || "",
    updated_at: result.updated_at || "",
  } satisfies ApiService));
}
