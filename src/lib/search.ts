import type { ApiProduct, ApiService } from "@/lib/api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

export type SearchResult = Partial<ApiService & ApiProduct> & {
  resultType: "service" | "shop_product";
  suggestionId?: string;
  category_id?: string;
  categoryId?: string;
};

function uniqueResults(results: SearchResult[]) {
  return [...new Map(results.map((result) => [`${result.resultType}-${result.id}`, result])).values()];
}

let serviceVocabularyPromise: Promise<string[]> | null = null;
let productVocabularyPromise: Promise<string[]> | null = null;
let detailedServicesPromise: Promise<DetailedService[]> | null = null;

type DetailedService = SearchResult & {
  workPrices?: Array<{
    id?: string | number;
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  }>;
};

function searchableTerms(values: string[]) {
  const terms = new Map<string, string>();
  for (const value of values) {
    const cleaned = String(value || "").replace(/[^a-zA-Z0-9&+\-\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    terms.set(cleaned.toLowerCase(), cleaned);
    const words = cleaned.split(" ").filter((word) => word.length >= 3 && !/^\d+$/.test(word));
    for (const word of words) terms.set(word.toLowerCase(), word);
    for (let index = 0; index < words.length - 1; index += 1) {
      const phrase = `${words[index]} ${words[index + 1]}`;
      terms.set(phrase.toLowerCase(), phrase);
    }
  }
  return [...terms.values()];
}

export function getSearchVocabulary(scope: SearchResult["resultType"], signal?: AbortSignal) {
  if (scope === "service") {
    serviceVocabularyPromise ??= Promise.all([
      fetch(`${API_BASE_URL}/api/categories/`, { cache: "no-store", signal }).then((response) => response.ok ? response.json() : []),
      getDetailedServices(signal),
    ]).then(([categories, services]) => searchableTerms([
      ...(Array.isArray(categories) ? categories.flatMap((item) => [item.title, item.subtitle]) : []),
      ...services.flatMap((item) => [
        item.title,
        item.description,
        ...(item.workPrices || []).flatMap((work) => [work.title, work.description]),
      ]),
    ])).catch((error) => {
      serviceVocabularyPromise = null;
      throw error;
    });
    return serviceVocabularyPromise;
  }

  productVocabularyPromise ??= fetch(`${API_BASE_URL}/api/shop/products?limit=1&offset=0`, {
    cache: "no-store",
    signal,
  }).then(async (response) => {
    if (!response.ok) return [];
    const metadata = await response.json();
    const categories = Array.isArray(metadata?.categories) ? metadata.categories.map((item: { name?: string }) => item.name || "") : [];
    const batches = await Promise.all(categories.map(async (category: string) => {
      const params = new URLSearchParams({ category, limit: "30", offset: "0" });
      const categoryResponse = await fetch(`${API_BASE_URL}/api/shop/products?${params}`, { cache: "no-store", signal });
      if (!categoryResponse.ok) return [];
      const data = await categoryResponse.json();
      return Array.isArray(data?.products)
        ? data.products.flatMap((item: ApiProduct) => [item.title, item.description])
        : [];
    }));
    return searchableTerms([...categories, ...batches.flat()]);
  }).catch((error) => {
    productVocabularyPromise = null;
    throw error;
  });
  return productVocabularyPromise;
}

async function getDetailedServices(signal?: AbortSignal) {
  detailedServicesPromise ??= fetch(`${API_BASE_URL}/api/services/`, {
    cache: "no-store",
    signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Services returned HTTP ${response.status}`);
    const services: DetailedService[] = await response.json();
    return Promise.all(services.map(async (service) => {
      const detailResponse = await fetch(
        `${API_BASE_URL}/api/services/${encodeURIComponent(String(service.id || ""))}`,
        { cache: "no-store", signal },
      );
      if (!detailResponse.ok) return { ...service, resultType: "service" as const };
      const detail = await detailResponse.json();
      return { ...service, ...detail, resultType: "service" as const } as DetailedService;
    }));
  }).catch((error) => {
    detailedServicesPromise = null;
    throw error;
  });
  return detailedServicesPromise;
}

export async function searchServicesFromApi(
  query: string,
  category = "all",
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const services = await getDetailedServices(signal);
  const normalizedQuery = query.trim().toLowerCase();
  return services.flatMap((service) => {
    const serviceCategory = String(service.category_id || service.categoryId || "").toLowerCase();
    if (category !== "all" && serviceCategory !== category.toLowerCase()) return [];
    if (!normalizedQuery || category !== "all") return [service];

    const matchingWork = (service.workPrices || []).filter((work) =>
      [work.title, work.description].join(" ").toLowerCase().includes(normalizedQuery),
    );
    if (matchingWork.length) {
      return matchingWork.map((work, index) => ({
        ...service,
        title: work.title || service.title,
        description: work.description || service.description,
        price: Number(work.price || service.price || 0),
        imageUrl: work.imageUrl || service.imageUrl,
        image_url: work.imageUrl || service.image_url,
        suggestionId: `service-work-${service.id}-${work.id || index}`,
        resultType: "service" as const,
      }));
    }

    const parentSearchableText = [
      service.title,
      service.description,
      service.detail_description,
      service.detailDescription,
      serviceCategory,
    ].join(" ").toLowerCase();
    return parentSearchableText.includes(normalizedQuery) ? [service] : [];
  });
}

export async function searchSuggestions(
  query: string,
  scope: "all" | SearchResult["resultType"] = "all",
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query.trim(), limit: "30", offset: "0" });
  const response = await fetch(`${API_BASE_URL}/api/search?${params}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Search returned HTTP ${response.status}`);
  const data = await response.json();
  const results = uniqueResults((Array.isArray(data?.results) ? data.results : []) as SearchResult[]);
  if (scope === "all") {
    return [
      ...results.filter((result) => result.resultType === "service").slice(0, 4),
      ...results.filter((result) => result.resultType === "shop_product").slice(0, 4),
    ];
  }

  return results.filter((result) => result.resultType === scope).slice(0, 30);
}

export async function searchProductsByCategory(
  category: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    category: category.trim(),
    limit: "30",
    offset: "0",
  });
  const response = await fetch(`${API_BASE_URL}/api/shop/products?${params}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`Category search returned HTTP ${response.status}`);
  const data = await response.json();
  const products = Array.isArray(data?.products) ? data.products : [];
  return uniqueResults(products.map((product: ApiProduct) => ({
    ...product,
    resultType: "shop_product" as const,
  })));
}

export async function searchApi(query: string, resultType: "service", signal?: AbortSignal): Promise<ApiService[]>;
export async function searchApi(query: string, resultType: "shop_product", signal?: AbortSignal): Promise<ApiProduct[]>;
export async function searchApi(query: string, resultType: SearchResult["resultType"], signal?: AbortSignal): Promise<ApiService[] | ApiProduct[]> {
  const matches: SearchResult[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore && offset < 5_000) {
    const params = new URLSearchParams({ q: query.trim(), limit: "50", offset: String(offset) });
    const response = await fetch(`${API_BASE_URL}/api/search?${params}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error(`Search returned HTTP ${response.status}`);
    const data = await response.json();
    const results: SearchResult[] = Array.isArray(data?.results) ? data.results : [];
    matches.push(...results.filter((result) => result.resultType === resultType));
    hasMore = Boolean(data?.hasMore);
    offset += Number(data?.limit || 50);
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
