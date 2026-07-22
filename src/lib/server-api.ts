import { cache } from "react";
import type { ApiCategory, ApiService } from "@/lib/api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_ATTEMPTS = 2;

const lastSuccessfulResponse = new Map<string, unknown>();

function apiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE is not configured");
  }
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

// React cache de-duplicates calls made by metadata, layouts, and pages during one render.
// Next's fetch cache keeps successful data for five minutes and can serve stale data when
// background revalidation fails.
export const getServices = cache(() =>
  fetchCollection<ApiService>("/api/services/", "services"),
);

export const getCategories = cache(() =>
  fetchCollection<ApiCategory>("/api/categories/", "categories"),
);
