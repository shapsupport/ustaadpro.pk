import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { ApiCategory, ApiCatalogCategory, ApiReview, ApiService, ApiSubcategory } from "@/lib/api-types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;

const lastSuccessfulResponse = new Map<string, unknown>();

function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchCollection<T>(path: string): Promise<T[]> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(apiUrl(path), {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_ATTEMPTS) {
          await wait(250);
          continue;
        }
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("API returned an invalid collection");

      lastSuccessfulResponse.set(path, data);
      return data as T[];
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await wait(250);
        continue;
      }

      const stale = lastSuccessfulResponse.get(path) as T[] | undefined;
      return stale ?? [];
    }
  }

  return [];
}

const getServicesCached = unstable_cache(async (categoryId?: string, subcategoryId?: string) => {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  if (subcategoryId) params.append("subcategoryId", subcategoryId);
  const queryStr = params.toString();
  const path = `/api/services${queryStr ? `?${queryStr}` : ""}`;
  return fetchCollection<ApiService>(path);
}, ["ustaadpro-services"], { revalidate: REVALIDATE_SECONDS, tags: ["services"] });

export const getServices = cache(getServicesCached);

const getCategoriesCached = unstable_cache(
  () => fetchCollection<ApiCategory>("/api/categories"),
  ["ustaadpro-categories"],
  { revalidate: REVALIDATE_SECONDS, tags: ["categories"] },
);
export const getCategories = cache(getCategoriesCached);

const getSubcategoriesCached = unstable_cache(
  (categoryId: string) => fetchCollection<ApiSubcategory>(`/api/categories/${encodeURIComponent(categoryId)}/subcategories`),
  ["ustaadpro-subcategories"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog"] },
);
export const getSubcategories = cache(getSubcategoriesCached);

const getCatalogCached = unstable_cache(
  () => fetchCollection<ApiCatalogCategory>("/api/catalog"),
  ["ustaadpro-catalog"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog"] },
);
export const getCatalog = cache(getCatalogCached);

// Find a single catalog entry by checking the category ID and common aliases
export const getCatalogCategory = cache(async (categoryId: string): Promise<ApiCatalogCategory | null> => {
  const catalog = await getCatalog();
  // Direct match
  let match = catalog.find((c) => c.id === categoryId);
  if (match) return match;

  // Alias groups — consolidate multi-ID categories into the first real one
  const ALIAS_GROUPS: string[][] = [
    ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
    ["plumber", "plumbers"],
    ["painter", "painters"],
    ["welder", "welder-fabricator"],
    ["ac-services", "hvac"],
    ["subscriptions", "office-maintenance"],
  ];

  const group = ALIAS_GROUPS.find((aliases) => aliases.includes(categoryId));
  if (group) {
    // Find first catalog entry in the group that has subcategories
    for (const alias of group) {
      const entry = catalog.find((c) => c.id === alias);
      if (entry && (entry.subcategories?.length || entry.directServices?.length || entry.services?.length)) {
        match = entry;
        break;
      }
    }
    // If none had content, just return first match in group
    if (!match) {
      for (const alias of group) {
        const entry = catalog.find((c) => c.id === alias);
        if (entry) { match = entry; break; }
      }
    }
  }

  return match ?? null;
});

// Get ALL catalog entries matching a category (including aliases), merged
export const getMergedCatalogCategory = cache(async (categoryId: string): Promise<ApiCatalogCategory | null> => {
  const [catalog, services] = await Promise.all([getCatalog(), getServices()]);

  const ALIAS_GROUPS: string[][] = [
    ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
    ["plumber", "plumbers"],
    ["painter", "painters"],
    ["welder", "welder-fabricator"],
    ["ac-services", "hvac"],
    ["subscriptions", "office-maintenance"],
  ];

  const group = ALIAS_GROUPS.find((aliases) => aliases.includes(categoryId)) ?? [categoryId];

  // Merge all alias entries
  const allEntries = catalog.filter((c) => group.includes(c.id));
  if (allEntries.length === 0) return null;

  const base = allEntries[0];
  const normalizeTitle = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const mergedSubcategories = new Map<string, {
    subcategory: ApiSubcategory;
    ids: Set<string>;
    services: Map<string, ApiService>;
  }>();
  const mergedDirectServices = new Map<string, ApiService>();

  for (const entry of allEntries) {
    // Skip purely-main or placeholder subcategories (id ends with "-main")
    const subs = (entry.subcategories || []).filter((sc) => !sc.id.endsWith("-main"));
    subs.forEach((subcategory) => {
      const key = normalizeTitle(subcategory.title) || subcategory.id;
      const bucket = mergedSubcategories.get(key) ?? {
        subcategory,
        ids: new Set<string>(),
        services: new Map<string, ApiService>(),
      };
      bucket.ids.add(subcategory.id);
      (subcategory.services ?? []).forEach((service) => bucket.services.set(service.id, service));
      mergedSubcategories.set(key, bucket);
    });
    (entry.directServices || entry.services || []).forEach((svc) => { if (!mergedDirectServices.has(svc.id)) mergedDirectServices.set(svc.id, svc); });
  }

  // Some API responses keep the relationship only on the service record.
  // Attach those services before deciding whether a subcategory is empty.
  for (const service of services) {
    const subcategoryId = service.subcategory_id || service.subcategoryId;
    if (subcategoryId) {
      for (const bucket of mergedSubcategories.values()) {
        if (bucket.ids.has(subcategoryId)) bucket.services.set(service.id, service);
      }
    } else if (group.includes(service.category_id || service.categoryId || "")) {
      mergedDirectServices.set(service.id, service);
    }
  }

  const availableSubcategories = Array.from(mergedSubcategories.values())
    .filter((bucket) => bucket.services.size > 0)
    .map((bucket) => ({ ...bucket.subcategory, services: Array.from(bucket.services.values()) }));
  const nestedServiceIds = new Set(availableSubcategories.flatMap((subcategory) =>
    (subcategory.services ?? []).map((service) => service.id)
  ));
  nestedServiceIds.forEach((serviceId) => mergedDirectServices.delete(serviceId));

  return {
    ...base,
    subcategories: availableSubcategories,
    directServices: Array.from(mergedDirectServices.values()),
    services: Array.from(mergedDirectServices.values()),
  };
});

const getServiceByIdCached = unstable_cache(async (id: string): Promise<ApiService | null> => {
  if (!id) return null;
  try {
    const response = await fetch(apiUrl(`/api/services/${encodeURIComponent(id)}`), {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return data as ApiService;
  } catch {
    return null;
  }
}, ["ustaadpro-service-detail"], { revalidate: REVALIDATE_SECONDS, tags: ["services"] });
export const getServiceById = cache(getServiceByIdCached);

const getReviewsForServiceCached = unstable_cache(async (serviceId: string) => {
  try {
    const response = await fetch(apiUrl(`/api/services/${encodeURIComponent(serviceId)}/reviews`), {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as ApiReview[]) : [];
  } catch {
    return [];
  }
}, ["ustaadpro-service-reviews"], { revalidate: REVALIDATE_SECONDS, tags: ["reviews"] });
export const getReviewsForService = cache(getReviewsForServiceCached);

export const getServicesWithReviewStats = cache(async (services: ApiService[]) => {
  const reviewsByService = await Promise.all(services.map((service) => getReviewsForService(service.id)));
  return services.map((service, index) => {
    const reviews = reviewsByService[index];
    const rating = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : Number(service.rating || 0);
    return { ...service, rating, reviews: reviews.length || Number(service.reviews || 0) };
  });
});

export const getLatestReviews = cache(async (services: ApiService[]) => {
  const results = await Promise.all(
    services.map(async (service) => {
      const reviews = await getReviewsForService(service.id);
      return reviews.map((review) => ({
        ...review,
        serviceTitle: review.serviceTitle || review.service_title || service.title,
      }));
    })
  );

  return results
    .flat()
    .filter((review) => Number(review.rating) >= 4 && String(review.comment || "").trim().length > 0)
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
    .slice(0, 4);
});
