import type { Metadata } from "next";
import { ServicesPageContent } from "./ServicesPageContent";
import { getCategories, getCatalog, getServices } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Services | Ustaad Pro",
  description:
    "Browse professional home services including electrical, plumbing, AC repair, painting, cleaning, carpentry, CCTV installation, and more. Book verified professionals in Pakistan.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  const [services, categories, catalog] = await Promise.all([
    getServices(),
    getCategories(),
    getCatalog(),
  ]);
  return (
    <ServicesPageContent
      initialServices={services}
      initialCategories={categories}
      initialCatalog={catalog}
      initialSearch={search}
    />
  );
}
