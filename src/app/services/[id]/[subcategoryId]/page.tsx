import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPageClient } from "@/components/services/CategoryPageClient";
import { getCatalog, getMergedCatalogCategory } from "@/lib/server-api";

export const revalidate = 300;

export async function generateStaticParams() {
  const catalog = await getCatalog();
  const categories = await Promise.all(catalog.map((category) => getMergedCatalogCategory(category.id)));
  const paths = categories.flatMap((category, index) =>
    (category?.subcategories ?? []).map((subcategory) => ({ id: catalog[index].id, subcategoryId: subcategory.id }))
  );
  return [...new Map(paths.map((path) => [`${path.id}:${path.subcategoryId}`, path])).values()];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; subcategoryId: string }>;
}): Promise<Metadata> {
  const { id, subcategoryId } = await params;
  const category = await getMergedCatalogCategory(id);
  const subcategory = category?.subcategories?.find((item) => item.id === subcategoryId);

  if (!category || !subcategory) return { title: "Service Not Found | Ustaad Pro" };

  const title = `${subcategory.title} in Rawalpindi & Islamabad | Ustaad Pro`;
  const description = subcategory.description ||
    `Browse ${subcategory.title} services, compare prices, and book verified ${category.title.toLowerCase()} professionals.`;

  return {
    title,
    description,
    alternates: { canonical: `/services/${encodeURIComponent(id)}/${encodeURIComponent(subcategoryId)}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ id: string; subcategoryId: string }>;
}) {
  const { id, subcategoryId } = await params;
  const category = await getMergedCatalogCategory(id);
  const subcategory = category?.subcategories?.find((item) => item.id === subcategoryId);

  if (!category || !subcategory) notFound();

  return <CategoryPageClient catalogCategory={category} initialSubcategoryId={subcategoryId} />;
}
