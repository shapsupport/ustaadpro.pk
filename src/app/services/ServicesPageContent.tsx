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
  Search,
  Snowflake,
  Sparkles,
  Star,
  Shirt,
  Wrench,
  Zap,
} from "lucide-react";
import type { ApiCategory, ApiService } from "@/lib/api-types";
import { useRef } from "react";
import { searchApi } from "@/lib/search";
import { orderCategories, orderServices } from "@/lib/service-order";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";

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
}

export function ServicesPageContent({ initialServices, initialCategories }: ServicesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [serviceSearchResults, setServiceSearchResults] = useState<ApiService[]>([]);
  const [searching, setSearching] = useState(false);

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
    const query = searchQuery.trim();
    if (!query) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try { setServiceSearchResults(await searchApi(query, "service", controller.signal)); }
      catch { if (!controller.signal.aborted) setServiceSearchResults([]); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    const source = orderServices(q ? serviceSearchResults : initialServices);
    const base = source.filter((s) => {
      const matchCat = activeCategory === "all" || s.category_id === activeCategory;
      return matchCat;
    });

    return base;
  }, [initialServices, serviceSearchResults, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pt-0">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_35%),linear-gradient(135deg,_#052e16_0%,_#0f766e_45%,_#059669_100%)] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] opacity-30" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              Curated service catalog
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Browse a better service experience for your home and office.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg">
              Find verified experts for repairs, maintenance, installations, and deep cleaning with clear pricing and faster booking.
            </p>

            <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center rounded-2xl bg-white px-4 shadow-sm">
                <Search className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services, e.g. AC or painter"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    setActiveCategory("all");
                    if (!value.trim()) { setServiceSearchResults([]); setSearching(false); }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="h-12 w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
                />
                <SearchSuggestions query={searchQuery} scope="service" services={initialServices} />
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Clear search
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4">
                <p className="text-3xl font-black">100+</p>
                <p className="mt-1 text-sm text-emerald-50/80">Verified service options</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4">
                <p className="text-3xl font-black">24/7</p>
                <p className="mt-1 text-sm text-emerald-50/80">Booking support</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4 sm:col-span-2">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200">Why customers choose us</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                  Transparent pricing, skilled professionals, and a smoother booking flow that keeps your plans moving.
                </p>
              </div>
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
            <h2 className="text-2xl font-bold text-slate-900">Service shortlist</h2>
            <p className="text-sm text-slate-500">
              {searching ? "Searching all services…" : `${filtered.length} option${filtered.length !== 1 ? "s" : ""} ready for your next booking.`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <BadgeCheck className="h-4 w-4 text-primary" />
            Transparent pricing & verified teams
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-400">No services match your search</p>
            <p className="mt-2 text-slate-500">Try a different keyword or reset the filter.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => (
              <ServiceCardLarge key={service.id} service={service} />
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
