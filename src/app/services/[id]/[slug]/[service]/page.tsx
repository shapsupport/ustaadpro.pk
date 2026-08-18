import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServiceDetailClient } from "../../ServiceDetailClient";
import { getMergedCatalogCategory, getReviewsForService, getServices } from "@/lib/server-api";
import { serviceHref, serviceSlug, slugify } from "@/lib/service-url";

export const dynamic = "force-dynamic";

async function resolveService(category: string, subcategorySlug: string, requestedServiceSlug: string) {
  const [catalogCategory, services] = await Promise.all([
    getMergedCatalogCategory(category),
    getServices(),
  ]);
  if (!catalogCategory) return null;
  const matchingSubcategories = (catalogCategory.subcategories ?? []).filter(
    (item) => slugify(item.title) === subcategorySlug
  );
  if (!matchingSubcategories.length) return null;
  const matchingIds = new Set(matchingSubcategories.map((item) => item.id));
  const candidates = new Map<string, (typeof services)[number]>();
  matchingSubcategories.forEach((subcategory) =>
    (subcategory.services ?? []).forEach((item) => candidates.set(item.id, item))
  );
  services
    .filter((item) => matchingIds.has(item.subcategoryId || item.subcategory_id || ""))
    .forEach((item) => candidates.set(item.id, item));
  const service = [...candidates.values()].find((item) => serviceSlug(item) === requestedServiceSlug);
  const serviceSubcategoryId = service?.subcategoryId || service?.subcategory_id;
  const subcategory = matchingSubcategories.find((item) => item.id === serviceSubcategoryId) ?? matchingSubcategories[0];
  return service ? { service, subcategory } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string; service: string }> }): Promise<Metadata> {
  const { id, slug, service } = await params;
  const match = await resolveService(id, slug, service);
  return {
    title: match ? `${match.service.title} | Ustaad Pro` : "Service Details | Ustaad Pro",
    description: match?.service.description ?? match?.service.detailDescription ?? "Book verified professional services.",
    alternates: match ? { canonical: serviceHref(match.service, match.subcategory.title) } : undefined,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ id: string; slug: string; service: string }> }) {
  const { id, slug, service: requestedService } = await params;
  const match = await resolveService(id, slug, requestedService);
  if (!match) notFound();
  const canonical = serviceHref(match.service, match.subcategory.title);
  if (canonical !== `/services/${id}/${slug}/${requestedService}`) redirect(canonical);
  const reviews = await getReviewsForService(match.service.id);
  return <ServiceDetailClient service={match.service} initialReviews={reviews} />;
}
