import type { Metadata } from "next";
import { ServicesLandingClient } from "./ServicesLandingClient";
import { getCategories, getCatalog } from "@/lib/server-api";

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
  const [categories, catalog] = await Promise.all([
    getCategories(),
    getCatalog(),
  ]);
  return (
    <ServicesLandingClient
      initialCategories={categories}
      initialCatalog={catalog}
      initialSearch={search}
    />
  );
}
