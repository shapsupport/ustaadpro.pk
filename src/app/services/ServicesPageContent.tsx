"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  Clock,
  Flame,
  Hammer,
  Layers,
  Paintbrush,
  Snowflake,
  Sparkles,
  Star,
  Shirt,
  Wrench,
  Zap,
  MapPin,
  ChevronDown,
  ShieldCheck,
  Headphones,
  CircleCheck,
} from "lucide-react";
import type { ApiCategory, ApiService } from "@/lib/api-types";
import { useRef } from "react";
import { orderCategories, orderServices } from "@/lib/service-order";
import { searchServicesFromApi } from "@/lib/search";
import { useLocation } from "@/context/LocationContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function imgSrc(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const CAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "ac-services": Snowflake,
  electrician: Zap,
  plumbers: Wrench,
  "home-cleaning": Sparkles,
  "dry-cleaning": Shirt,
  painters: Paintbrush,
  carpenter: Hammer,
  cctv: Camera,
  "welder-fabricator": Flame,
  subscriptions: Calendar,
};

interface ServicesPageContentProps {
  initialServices: ApiService[];
  initialCategories: ApiCategory[];
  initialSearch?: string;
}

export function ServicesPageContent({ initialServices, initialCategories, initialSearch = "" }: ServicesPageContentProps) {
  const { location, setShowPicker } = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchedServices, setSearchedServices] = useState<ApiService[]>([]);
  const [completedSearch, setCompletedSearch] = useState("");

  const servicesRef = useRef<HTMLDivElement>(null);

  const allCategories = useMemo(() => {
    const catIds = [...new Set(initialServices.map((s) => s.category_id))];
    return orderCategories(catIds.map((id) => {
      const found = initialCategories.find((c) => c.id === id);
      return found ?? { id, title: id.replace(/-/g, " "), subtitle: "", icon: "", tint: "#059669" };
    }));
  }, [initialServices, initialCategories]);

  const selectCategory = (categoryId: string, updateUrl = false) => {
    setActiveCategory(categoryId);
    if (updateUrl) {
      window.history.replaceState(null, "", categoryId === "all" ? "/services" : `/services#${categoryId}`);
    }
    window.requestAnimationFrame(() => {
      servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    const selectFromHash = () => {
      const categoryId = window.location.hash.slice(1);
      if (categoryId && allCategories.some((category) => category.id === categoryId)) {
        selectCategory(categoryId);
      }
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [allCategories]);

  useEffect(() => {
    const query = initialSearch.trim();
    if (!query) return;
    const controller = new AbortController();
    searchServicesFromApi(query, "all", controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) {
          setSearchedServices(results as ApiService[]);
          setCompletedSearch(query);
          window.requestAnimationFrame(() => {
            servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSearchedServices([]);
          setCompletedSearch(query);
        }
      });
    return () => controller.abort();
  }, [initialSearch]);

  const filtered = useMemo(() => {
    if (initialSearch.trim()) return searchedServices;
    return orderServices(initialServices).filter((s) => {
      const matchCat = activeCategory === "all" || s.category_id === activeCategory;
      return matchCat;
    });
  }, [initialServices, activeCategory, initialSearch, searchedServices]);

  const startingPrice = initialServices.length ? Math.min(...initialServices.map((service) => service.price).filter((price) => price > 0)) : 0;
  const reviewedServices = initialServices.filter((service) => service.reviews > 0).length;
  const searching = Boolean(initialSearch.trim() && completedSearch !== initialSearch.trim());

  return (
    <div className="min-h-screen bg-slate-50 pt-0">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_68%_20%,#d1fae5_0,transparent_28%),linear-gradient(108deg,#fff_0%,#f7fffb_58%,#059669_58%,#047857_100%)]">
        <div className="absolute right-0 top-0 hidden h-full w-[42%] opacity-20 lg:block" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative mx-auto grid min-h-[570px] max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8">
          <div className="relative z-10">
            <button type="button" onClick={() => setShowPicker(true)} className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100">
              <MapPin className="h-4 w-4" /><span className="max-w-56 truncate">{location.shortLabel || location.label || "Rawalpindi & Islamabad"}</span><ChevronDown className="h-3.5 w-3.5" />
            </button>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600"><Sparkles className="h-4 w-4" /> Services built around your day</span>
            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">Find the right expert.<span className="mt-2 block text-emerald-600">Get the job done right.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Explore repairs, maintenance, installations, cleaning, and specialist work with clear service details and straightforward booking.</p>

          </div>

          <div className="relative z-10 lg:pl-8">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between gap-3"><div><span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Live service catalogue</span><h2 className="mt-1 text-2xl font-black text-slate-950">Everything your space needs</h2></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Wrench className="h-6 w-6" /></span></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-slate-950">{initialServices.length}</strong><span className="text-xs text-slate-500">Bookable services</span></div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-slate-950">{allCategories.length}</strong><span className="text-xs text-slate-500">Service categories</span></div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-slate-950">{startingPrice ? `Rs ${startingPrice.toLocaleString()}` : "—"}</strong><span className="text-xs text-slate-500">Lowest starting price</span></div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black text-slate-950">{reviewedServices}</strong><span className="text-xs text-slate-500">Services with reviews</span></div>
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">{[{ icon: ShieldCheck, text: "Clear scope and pricing before booking" }, { icon: CircleCheck, text: "Real customer ratings from completed orders" }, { icon: Headphones, text: "Support for bookings and service concerns" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 text-sm font-medium text-slate-600"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="h-4 w-4" /></span>{text}</div>)}</div>
              <button type="button" onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700">Browse all services <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Browse by category</h2>
            <button type="button" onClick={() => selectCategory("all", true)} className="flex items-center gap-1 text-sm font-bold text-emerald-700">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {allCategories.slice(0, 9).map((category) => {
              const IconComponent = CAT_ICONS[category.id] || Wrench;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.id, true)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-md ${activeCategory === category.id ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  <IconComponent className="h-6 w-6 text-emerald-600" />
                  <span className="text-[11px] font-bold leading-tight capitalize">{category.title}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => selectCategory("all", true)}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 transition hover:shadow-md ${activeCategory === "all" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <Layers className="h-6 w-6 text-emerald-600" />
              <span className="text-[11px] font-bold">All services</span>
            </button>
          </div>
        </div>
      </section>

      <div ref={servicesRef} className="mx-auto max-w-7xl scroll-mt-36 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {initialSearch.trim() ? `Results for “${initialSearch.trim()}”` : "Service shortlist"}
            </h2>
            <p className="text-sm text-slate-500">
              {searching ? "Loading matching services…" : `${filtered.length} option${filtered.length !== 1 ? "s" : ""} ready for your next booking.`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <BadgeCheck className="h-4 w-4 text-primary" />
            Transparent pricing & verified teams
          </div>
        </div>

        {searching ? (
          <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-emerald-700">Searching the service catalogue…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-400">No services match your search</p>
            <p className="mt-2 text-slate-500">Try a different keyword or reset the filter.</p>
            <button
              onClick={() => {
                setActiveCategory("all");
                window.history.replaceState(null, "", "/services");
              }}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service, index) => (
              <ServiceCardLarge key={`${service.id}-${service.title}-${index}`} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCardLarge({ service }: { service: ApiService }) {
  const src = imgSrc(service.image_url || service.imageUrl);
  const originalPrice = Number(service.original_price || service.originalPrice || 0);
  const discount = originalPrice > service.price ? Math.round(((originalPrice - service.price) / originalPrice) * 100) : 0;

  return (
    <Link href={`/services/${service.id}`} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-60 shrink-0 bg-slate-100 sm:h-64">
          {src ? (
            <Image
              src={src}
              alt={service.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Layers className="h-14 w-14 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute left-4 top-4 flex gap-2">
            {service.badge ? (
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow">{service.badge}</span>
            ) : null}
            {discount > 0 ? (
              <span className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow">{discount}% OFF</span>
            ) : null}
          </div>
          {service.duration ? (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5" />
              {service.duration}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary sm:text-2xl">{service.title}</h3>
          <p className="mt-2 flex-1 text-base leading-7 text-slate-500">
            {service.detail_description || service.description}
          </p>

          <div className="mt-5 flex items-center gap-2">
            <Star className={`h-5 w-5 ${service.reviews > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
            <span className="text-base font-bold text-slate-700">{service.reviews > 0 ? service.rating.toFixed(1) : "0.0"}</span>
            <span className="text-sm text-slate-400">{service.reviews > 0 ? `(${service.reviews} review${service.reviews === 1 ? "" : "s"})` : "(No reviews)"}</span>
            {service.workPrices && service.workPrices.length > 0 ? (
              <span className="ml-auto flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-primary">
                <BadgeCheck className="h-3.5 w-3.5" />
                {service.workPrices.length} types
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Starting from</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">Rs {service.price.toLocaleString()}</span>
                {discount > 0 ? <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span> : null}
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-white shadow-md shadow-primary/20 transition hover:bg-emerald-700">
              Book <ArrowRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
