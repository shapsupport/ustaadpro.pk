import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryPageClient } from "@/components/services/CategoryPageClient";
import {
  getServiceById,
  getServices,
  getMergedCatalogCategory,
} from "@/lib/server-api";
import { serviceHref } from "@/lib/service-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const cat = await getMergedCatalogCategory(id);
  if (cat) {
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
  const serviceCategory = await getMergedCatalogCategory(service.categoryId || service.category_id || "");
  const subcategory = (serviceCategory?.subcategories ?? []).find((item) =>
    item.id === (service.subcategoryId || service.subcategory_id)
  );
  redirect(serviceHref(service, subcategory?.title));
}
