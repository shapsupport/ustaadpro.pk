import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "./ServiceDetailClient";
import { getReviewsForService, getServices } from "@/lib/server-api";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const services = await getServices();
  const service = services.find((s) => s.id === id);
  return {
    title: service?.title ?? "Service Details",
    description: service?.description ?? "Book professional home services in Rawalpindi & Islamabad.",
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const services = await getServices();
  const service = services.find((s) => s.id === id);
  if (!service) notFound();
  const reviews = await getReviewsForService(service.id);
  return <ServiceDetailClient service={service} initialReviews={reviews} />;
}
