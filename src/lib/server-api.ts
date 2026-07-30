import { cache } from "react";
import type { ApiCategory, ApiCatalogCategory, ApiReview, ApiService, ApiSubcategory } from "@/lib/api-types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_ATTEMPTS = 2;

const lastSuccessfulResponse = new Map<string, unknown>();

function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchCollection<T>(path: string, label: string): Promise<T[]> {
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
    } catch (error) {
      if (attempt < MAX_ATTEMPTS) {
        await wait(250);
        continue;
      }

      const stale = lastSuccessfulResponse.get(path) as T[] | undefined;
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown network error";
      console.warn(`[API] ${label} unavailable after ${MAX_ATTEMPTS} attempts (${reason}).${stale ? " Serving the last successful response." : ""}`);
      return stale ?? [];
    }
  }

  return [];
}

export const getServices = cache((categoryId?: string, subcategoryId?: string) => {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  if (subcategoryId) params.append("subcategoryId", subcategoryId);
  const queryStr = params.toString();
  const path = `/api/services${queryStr ? `?${queryStr}` : ""}`;
  return fetchCollection<ApiService>(path, "services");
});

export const getCategories = cache(() =>
  fetchCollection<ApiCategory>("/api/categories", "categories"),
);

export const getSubcategories = cache((categoryId: string) =>
  fetchCollection<ApiSubcategory>(`/api/categories/${encodeURIComponent(categoryId)}/subcategories`, `subcategories-${categoryId}`),
);

export const getCatalog = cache(() =>
  fetchCollection<ApiCatalogCategory>("/api/catalog", "catalog"),
);

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
  const catalog = await getCatalog();

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
  const mergedSubcategories = new Map<string, ApiSubcategory>();
  const mergedDirectServices = new Map<string, ApiService>();

  for (const entry of allEntries) {
    // Skip purely-main or placeholder subcategories (id ends with "-main")
    const subs = (entry.subcategories || []).filter((sc) => !sc.id.endsWith("-main"));
    subs.forEach((sc) => { if (!mergedSubcategories.has(sc.id)) mergedSubcategories.set(sc.id, sc); });
    (entry.directServices || entry.services || []).forEach((svc) => { if (!mergedDirectServices.has(svc.id)) mergedDirectServices.set(svc.id, svc); });
  }

  return {
    ...base,
    subcategories: Array.from(mergedSubcategories.values()),
    directServices: Array.from(mergedDirectServices.values()),
    services: Array.from(mergedDirectServices.values()),
  };
});

export const getServiceById = cache(async (id: string): Promise<ApiService | null> => {
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
});

export const getReviewsForService = cache(async (serviceId: string) => {
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
});

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
