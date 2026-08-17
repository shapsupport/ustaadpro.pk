import type { MetadataRoute } from "next";
import { getCatalog, getMergedCatalogCategory, getServices } from "@/lib/server-api";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ustaadpro.pk").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, services] = await Promise.all([getCatalog(), getServices()]);
  const mergedCategories = await Promise.all(catalog.map((category) => getMergedCatalogCategory(category.id)));
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = catalog.map((category) => ({
    url: `${SITE_URL}/services/${encodeURIComponent(category.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const subcategoryPages: MetadataRoute.Sitemap = mergedCategories.flatMap((category, index) =>
    (category?.subcategories ?? [])
      .map((subcategory) => ({
        url: `${SITE_URL}/services/${encodeURIComponent(catalog[index].id)}/${encodeURIComponent(subcategory.id)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  );

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${SITE_URL}/services/${encodeURIComponent(service.id)}`,
    lastModified: service.updatedAt || service.updated_at || service.createdAt || service.created_at || now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...subcategoryPages, ...servicePages];
}
