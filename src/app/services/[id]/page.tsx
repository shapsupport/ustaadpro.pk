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

export const revalidate = 300;

export async function generateStaticParams() {
  const [services, catalog] = await Promise.all([getServices(), getCatalog()]);
  const serviceParams = services.map((s) => ({ id: s.id }));
  const categoryParams = catalog.map((c) => ({ id: c.id }));
  return [...serviceParams, ...categoryParams];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const cat = await getMergedCatalogCategory(id);
  if (cat) {
    const title = `${cat.title} Services in Rawalpindi & Islamabad | Ustaad Pro`;
    const description = cat.subtitle ?? `Browse ${cat.title} services and book verified professionals in Rawalpindi and Islamabad.`;
    return {
      title,
      description,
      alternates: { canonical: `/services/${encodeURIComponent(id)}` },
      openGraph: { title, description, type: "website" },
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

  // Catalog entries have dedicated, crawlable category pages.
  const catalogCategory = await getMergedCatalogCategory(id);
  if (catalogCategory) {
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
