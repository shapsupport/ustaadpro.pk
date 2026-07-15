"use client";

import { useMemo, useState, type ComponentType } from "react";
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
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Shirt,
  Wrench,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ApiCategory, ApiService } from "@/lib/api-types";
import { useRef } from "react";

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

const PRIORITY_CATS = ["electrician", "plumbers", "carpenter", "home-cleaning", "ac-services"];

interface ServicesPageContentProps {
  initialServices: ApiService[];
  initialCategories: ApiCategory[];
}

export function ServicesPageContent({ initialServices, initialCategories }: ServicesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    tabsRef.current?.scrollBy({
      left: direction === "left" ? -250 : 250,
      behavior: "smooth",
    });
  };

  const allCategories = useMemo(() => {
    const catIds = [...new Set(initialServices.map((s) => s.category_id))];
    return catIds.map((id) => {
      const found = initialCategories.find((c) => c.id === id);
      return found ?? { id, title: id.replace(/-/g, " "), subtitle: "", icon: "", tint: "#059669" };
    });
  }, [initialServices, initialCategories]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = initialServices.filter((s) => {
      const matchCat = activeCategory === "all" || s.category_id === activeCategory;
      const matchQ = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    return base.sort((a, b) => {
      const ai = PRIORITY_CATS.indexOf(a.category_id);
      const bi = PRIORITY_CATS.indexOf(b.category_id);
      if (ai !== -1 && bi === -1) return -1;
      if (bi !== -1 && ai === -1) return 1;
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.title.localeCompare(b.title);
    });
  }, [initialServices, activeCategory, searchQuery]);

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
              <div className="flex flex-1 items-center rounded-2xl bg-white px-4 shadow-sm">
                <Search className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services, e.g. AC or painter"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveCategory("all");
                  }}
                  className="h-12 w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
                />
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

      <div className="sticky top-22 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>

            {/* Category Tabs */}
            <div
              ref={tabsRef}
              className="flex gap-2 overflow-x-auto px-14 py-3 hide-scrollbar scroll-smooth"
            >
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${activeCategory === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                All Services
              </button>

              {allCategories.map((cat) => {
                const IconComponent = CAT_ICONS[cat.id] || Wrench;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${activeCategory === cat.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {cat.title}
                  </button>
                );
              })}
            </div>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Service shortlist</h2>
            <p className="text-sm text-slate-500">
              {filtered.length} option{filtered.length !== 1 ? "s" : ""} ready for your next booking.
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
        <div className="relative h-52 shrink-0 bg-slate-100">
          {src ? (
            <Image
              src={src}
              alt={service.title}
              fill
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
          <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-primary">{service.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
            {service.detail_description || service.description}
          </p>

          <div className="mt-5 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-700">{service.rating}</span>
            <span className="text-xs text-slate-400">({service.reviews} reviews)</span>
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
                <span className="text-2xl font-black text-slate-900">Rs {service.price.toLocaleString()}</span>
                {discount > 0 ? <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span> : null}
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-emerald-700">
              Book <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
