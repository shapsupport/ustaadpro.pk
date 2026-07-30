import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "./ServiceDetailClient";
import { CategoryPageClient } from "@/components/services/CategoryPageClient";
import {
  getReviewsForService,
  getServiceById,
  getServices,
  getMergedCatalogCategory,
  getCatalog,
} from "@/lib/server-api";

// All category IDs that should render the sub-category view
const CATALOG_CATEGORY_IDS = new Set([
  "ac-services", "hvac",
  "electrician",
  "plumber", "plumbers",
  "home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home",
  "painter", "painters",
  "carpenter",
  "cctv",
  "welder", "welder-fabricator",
  "subscriptions", "office-maintenance",
  "dry-cleaning",
]);

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const [services, catalog] = await Promise.all([getServices(), getCatalog()]);
  const serviceParams = services.map((s) => ({ id: s.id }));
  const categoryParams = catalog.map((c) => ({ id: c.id }));
  return [...serviceParams, ...categoryParams];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (CATALOG_CATEGORY_IDS.has(id)) {
    const cat = await getMergedCatalogCategory(id);
    return {
      title: cat ? `${cat.title} Services | Ustaad Pro` : "Services | Ustaad Pro",
      description: cat?.subtitle ?? `Browse ${cat?.title ?? ""} services and book verified professionals in Pakistan.`,
    };
  }

  let service = await getServiceById(id);
  if (!service) {
    const services = await getServices();
    service = services.find((s) => s.id === id) ?? null;
  }
  return {
    title: service?.title ?? "Service Details | Ustaad Pro",
    description: service?.description ?? service?.detailDescription ?? "Book professional home services in Rawalpindi & Islamabad.",
  };
}

export default async function ServiceOrCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if this is a known catalog category (Level 2 view)
  if (CATALOG_CATEGORY_IDS.has(id)) {
    const catalogCategory = await getMergedCatalogCategory(id);
    if (!catalogCategory) notFound();
    return <CategoryPageClient catalogCategory={catalogCategory} />;
  }

  // Otherwise treat it as an individual service detail
  let service = await getServiceById(id);
  if (!service) {
    const services = await getServices();
    service = services.find((s) => s.id === id) ?? null;
  }
  if (!service) notFound();
  const reviews = await getReviewsForService(service.id);
  return <ServiceDetailClient service={service} initialReviews={reviews} />;
}
