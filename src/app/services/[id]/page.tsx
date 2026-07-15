import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ApiService } from "@/lib/api-types";
import { ServiceDetailClient } from "./ServiceDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function getAllServices(): Promise<ApiService[]> {
  try {
    const res = await fetch(`${API_BASE}/api/services/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const services = await getAllServices();
  const service = services.find((s) => s.id === id);
  return {
    title: service?.title ?? "Service Details",
    description: service?.description ?? "Book professional home services in Rawalpindi & Islamabad.",
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const services = await getAllServices();
  const service = services.find((s) => s.id === id);
  if (!service) notFound();
  return <ServiceDetailClient service={service} />;
}
