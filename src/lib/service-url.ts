import type { ApiService } from "@/lib/api-types";

export function slugify(value: string) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "service";
}

export function serviceCategorySlug(service: Pick<ApiService, "categoryId" | "category_id">) {
  return slugify(String(service.categoryId || service.category_id || "services"));
}

export function serviceSlug(service: Pick<ApiService, "title">) {
  return slugify(service.title);
}

export function categoryHref(categoryId: string) {
  return `/services/${slugify(categoryId)}`;
}

export function subcategoryHref(categoryId: string, subcategoryTitle: string) {
  return `${categoryHref(categoryId)}/${slugify(subcategoryTitle)}`;
}

export function serviceHref(
  service: Pick<ApiService, "title" | "categoryId" | "category_id">,
  subcategoryTitle?: string,
) {
  const category = serviceCategorySlug(service);
  return subcategoryTitle
    ? `/services/${category}/${slugify(subcategoryTitle)}/${serviceSlug(service)}`
    : `/services/${category}/${serviceSlug(service)}`;
}
