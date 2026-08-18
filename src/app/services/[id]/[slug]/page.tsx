import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryPageClient } from "@/components/services/CategoryPageClient";
import { ServiceDetailClient } from "../ServiceDetailClient";
import { getMergedCatalogCategory, getReviewsForService, getServices } from "@/lib/server-api";
import { serviceHref, serviceSlug, slugify, subcategoryHref } from "@/lib/service-url";

export const dynamic = "force-dynamic";

async function resolveRoute(category: string, slug: string) {
  const [catalogCategory, services] = await Promise.all([
    getMergedCatalogCategory(category),
    getServices(),
  ]);

  if (catalogCategory) {
    const matchingSubcategories = (catalogCategory.subcategories ?? []).filter((item) => slugify(item.title) === slug);
    if (matchingSubcategories.length) {
      const matchingIds = new Set(matchingSubcategories.map((item) => item.id));
      const attachedServices = services.filter((service) =>
        matchingIds.has(service.subcategoryId || service.subcategory_id || "")
      );
      const subcategory = [...matchingSubcategories].sort((left, right) => {
        const rightCount = attachedServices.filter((service) => (service.subcategoryId || service.subcategory_id) === right.id).length;
        const leftCount = attachedServices.filter((service) => (service.subcategoryId || service.subcategory_id) === left.id).length;
        return rightCount - leftCount;
      })[0];
      const merged = new Map<string, (typeof services)[number]>();
      matchingSubcategories.forEach((item) =>
        (item.services ?? []).forEach((service) => merged.set(service.id, service))
      );
      attachedServices.forEach((service) => merged.set(service.id, service));
      const enrichedSubcategory = { ...subcategory, services: [...merged.values()] };
      return {
        type: "subcategory" as const,
        catalogCategory: {
          ...catalogCategory,
          subcategories: [
            ...(catalogCategory.subcategories ?? []).filter((item) => slugify(item.title) !== slug),
            enrichedSubcategory,
          ],
        },
        subcategory: enrichedSubcategory,
      };
    }
  }

  const service = services.find((item) => serviceSlug(item) === slug);
  return service ? { type: "service" as const, service } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id, slug } = await params;
  const match = await resolveRoute(id, slug);
  if (match?.type === "subcategory") {
    return {
      title: `${match.subcategory.title} | ${match.catalogCategory.title} | Ustaad Pro`,
      description: match.subcategory.description ?? "Browse verified professional services.",
      alternates: { canonical: subcategoryHref(id, match.subcategory.title) },
    };
  }
  return {
    title: match?.type === "service" ? `${match.service.title} | Ustaad Pro` : "Services | Ustaad Pro",
    description: match?.type === "service" ? match.service.description : "Browse verified professional services.",
  };
}

export default async function SubcategoryOrLegacyServicePage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const match = await resolveRoute(id, slug);
  if (!match) notFound();
  if (match.type === "subcategory") {
    return <CategoryPageClient catalogCategory={match.catalogCategory} initialSubcategory={match.subcategory} />;
  }
  const canonical = serviceHref(match.service);
  if (canonical !== `/services/${id}/${slug}`) redirect(canonical);
  const reviews = await getReviewsForService(match.service.id);
  return <ServiceDetailClient service={match.service} initialReviews={reviews} />;
}
