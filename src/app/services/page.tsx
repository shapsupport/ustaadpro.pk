import type { Metadata } from "next";
import { ServicesPageContent } from "./ServicesPageContent";
import { getCategories, getServices } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Services | Ustaad Pro",
  description:
    "Browse professional home services including electrical, plumbing, AC repair, painting, cleaning, carpentry, CCTV installation, and more. Book verified professionals in Pakistan.",
};

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  return <ServicesPageContent initialServices={services} initialCategories={categories} />;
}
