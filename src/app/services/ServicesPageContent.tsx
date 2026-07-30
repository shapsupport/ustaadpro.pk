"use client";

import { useEffect, useMemo, useState, type ComponentType, useRef } from "react";
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
  Tag,
} from "lucide-react";
import type { ApiCategory, ApiCatalogCategory, ApiService, ApiSubcategory } from "@/lib/api-types";
import { orderServices } from "@/lib/service-order";
import { searchServicesFromApi } from "@/lib/search";
import { useLocation } from "@/context/LocationContext";
import BookingModal from "@/components/booking/BookingModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";

function imgSrc(url: string | undefined | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  "ac-services": ["ac-services", "hvac"],
  hvac: ["ac-services", "hvac"],
  electrician: ["electrician"],
  plumber: ["plumber", "plumbers"],
  plumbers: ["plumber", "plumbers"],
  "home-services": ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  "home-cleaning": ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  cleaning: ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  "home_service": ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  "cleaning_service": ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  home: ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  painter: ["painter", "painters"],
  painters: ["painter", "painters"],
  carpenter: ["carpenter"],
  cctv: ["cctv"],
  welder: ["welder", "welder-fabricator"],
  "welder-fabricator": ["welder", "welder-fabricator"],
  subscriptions: ["subscriptions", "office-maintenance"],
  "office-maintenance": ["subscriptions", "office-maintenance"],
};

function getCategoryAliases(catId: string): string[] {
  return CATEGORY_ALIASES[catId] || [catId];
}

const CAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "ac-services": Snowflake,
  electrician: Zap,
  plumber: Wrench,
  plumbers: Wrench,
  "home-services": Sparkles,
  cleaning: Sparkles,
  "home-cleaning": Sparkles,
  "dry-cleaning": Shirt,
  painter: Paintbrush,
  painters: Paintbrush,
  carpenter: Hammer,
  cctv: Camera,
  welder: Flame,
  "welder-fabricator": Flame,
  subscriptions: Calendar,
  hvac: Snowflake,
};

const PRIMARY_CATEGORIES: ApiCategory[] = [
  { id: "ac-services", title: "AC Services", subtitle: "Maintenance, installation & gas refill", icon: "air-conditioner", tint: "#4F46E5" },
  { id: "electrician", title: "Electrician", subtitle: "Wiring, breakers, fans & repairs", icon: "lightning-bolt", tint: "#F59E0B" },
  { id: "plumber", title: "Plumber", subtitle: "Pipes, leaks, fixtures & drainage", icon: "wrench", tint: "#0284C7" },
  { id: "home-services", title: "Cleaning Services", subtitle: "Deep clean, sofa care & water tank", icon: "sparkles", tint: "#059669" },
  { id: "painter", title: "Painters", subtitle: "Wall painting, polish & staining", icon: "paintbrush", tint: "#EC4899" },
  { id: "carpenter", title: "Carpenter", subtitle: "Furniture, doors, locks & wood work", icon: "hammer", tint: "#D97706" },
  { id: "cctv", title: "CCTV", subtitle: "Camera installation & security setup", icon: "camera", tint: "#6366F1" },
  { id: "welder", title: "Welder & Fabricator", subtitle: "Gates, grills, shades & metal repair", icon: "flame", tint: "#EF4444" },
  { id: "subscriptions", title: "Subscriptions", subtitle: "Regular home & office maintenance", icon: "calendar", tint: "#8B5CF6" },
];

interface ServicesPageContentProps {
  initialServices: ApiService[];
  initialCategories?: ApiCategory[];
  initialCatalog?: ApiCatalogCategory[];
  initialSearch?: string;
}

export function ServicesPageContent({
  initialServices,
  initialCatalog = [],
  initialSearch = "",
}: ServicesPageContentProps) {
  const { location, setShowPicker } = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [searchedServices, setSearchedServices] = useState<ApiService[]>([]);
  const [completedSearch, setCompletedSearch] = useState("");
  const [bookingService, setBookingService] = useState<ApiService | null>(null);

  const servicesRef = useRef<HTMLDivElement>(null);

  const activeAliases = useMemo(() => getCategoryAliases(activeCategory), [activeCategory]);

  const selectCategory = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubcategory("all");
    window.requestAnimationFrame(() => {
      servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Derive subcategories for the active main category
  const currentSubcategories = useMemo(() => {
    if (activeCategory === "all") return [];
    const map = new Map<string, ApiSubcategory>();

    initialCatalog.forEach((catalogCat) => {
      if (activeAliases.includes(catalogCat.id) && catalogCat.subcategories) {
        catalogCat.subcategories.forEach((subCat) => {
          if (!map.has(subCat.id) && !subCat.id.endsWith("-main")) {
            map.set(subCat.id, subCat);
          }
        });
      }
    });

    return Array.from(map.values());
  }, [activeCategory, activeAliases, initialCatalog]);

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
      const catId = s.category_id || s.categoryId || "";
      const subCatId = s.subcategory_id || s.subcategoryId || "";

      // Level 1 match: Category match
      const matchCat = activeCategory === "all" || activeAliases.includes(catId);
      if (!matchCat) return false;

      // Level 2 match: Subcategory match if a subcategory pill is active
      if (activeSubcategory !== "all") {
        if (subCatId === activeSubcategory) return true;

        // Check if catalog subcategory services match this service id
        const selectedSubcatObj = currentSubcategories.find((sc) => sc.id === activeSubcategory);
        if (selectedSubcatObj?.services?.some((subS) => subS.id === s.id)) {
          return true;
        }

        return false;
      }

      return true;
    });
  }, [initialServices, activeCategory, activeAliases, activeSubcategory, currentSubcategories, initialSearch, searchedServices]);

  const startingPrice = initialServices.length
    ? Math.min(...initialServices.map((service) => service.price).filter((price) => price > 0))
    : 0;
  const reviewedServices = initialServices.filter((service) => Number(service.reviews || 0) > 0).length;
  const searching = Boolean(initialSearch.trim() && completedSearch !== initialSearch.trim());

  const activeCategoryObj = PRIMARY_CATEGORIES.find((c) => activeAliases.includes(c.id));

  return (
    <div className="min-h-screen bg-slate-50 pt-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_68%_20%,#d1fae5_0,transparent_28%),linear-gradient(108deg,#fff_0%,#f7fffb_58%,#059669_58%,#047857_100%)]">
        <div
          className="absolute right-0 top-0 hidden h-full w-[42%] opacity-20 lg:block"
          style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }}
        />
        <div className="relative mx-auto grid min-h-[570px] max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8">
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <MapPin className="h-4 w-4" />
              <span className="max-w-56 truncate">{location.shortLabel || location.label || "Rawalpindi & Islamabad"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              <Sparkles className="h-4 w-4" /> Services built around your day
            </span>
            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Find the right expert.
              <span className="mt-2 block text-emerald-600">Get the job done right.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Explore repairs, maintenance, installations, cleaning, and specialist work with clear service details and straightforward booking.
            </p>
          </div>

          <div className="relative z-10 lg:pl-8">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Live service catalogue</span>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">Everything your space needs</h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Wrench className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <strong className="block text-2xl font-black text-slate-950">{initialServices.length}</strong>
                  <span className="text-xs text-slate-500">Bookable services</span>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <strong className="block text-2xl font-black text-slate-950">{PRIMARY_CATEGORIES.length}</strong>
                  <span className="text-xs text-slate-500">Service categories</span>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <strong className="block text-2xl font-black text-slate-950">
                    {startingPrice ? `Rs ${startingPrice.toLocaleString()}` : "—"}
                  </strong>
                  <span className="text-xs text-slate-500">Lowest starting price</span>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <strong className="block text-2xl font-black text-slate-950">{reviewedServices}</strong>
                  <span className="text-xs text-slate-500">Services with reviews</span>
                </div>
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                {[
                  { icon: ShieldCheck, text: "Clear scope and pricing before booking" },
                  { icon: CircleCheck, text: "Real customer ratings from completed orders" },
                  { icon: Headphones, text: "Support for bookings and service concerns" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Browse all services <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LEVEL 1: Main Service Categories Grid */}
      <section className="border-b border-slate-100 bg-white py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">1. Select Main Service Category</h2>
              <p className="text-xs text-slate-500">Choose a service category to view its sub-services and pricing</p>
            </div>
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className="flex items-center gap-1 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-10">
            {PRIMARY_CATEGORIES.map((category) => {
              const IconComponent = CAT_ICONS[category.id] || Wrench;
              const isSelected = activeAliases.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.id)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-60 text-emerald-900 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <IconComponent className={`h-6 w-6 ${isSelected ? "text-emerald-700" : "text-emerald-600"}`} />
                  <span className="text-[11px] font-bold leading-tight capitalize">{category.title}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 transition-all hover:shadow-md ${
                activeCategory === "all"
                  ? "border-emerald-600 bg-emerald-60 text-emerald-900 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
              }`}
            >
              <Layers className="h-6 w-6 text-emerald-600" />
              <span className="text-[11px] font-bold">All services</span>
            </button>
          </div>
        </div>
      </section>

      {/* LEVEL 2: Sub-services Filter Pills (Shows when a main category is selected) */}
      {activeCategory !== "all" && (
        <section className="border-b border-emerald-100 bg-emerald-50/70 py-5 transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-900">
                <Tag className="h-4 w-4 text-emerald-700" /> 2. Select Sub-Service:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubcategory("all")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    activeSubcategory === "all"
                      ? "bg-emerald-700 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-emerald-100/80"
                  }`}
                >
                  All {activeCategoryObj?.title || "Services"}
                </button>
                {currentSubcategories.map((subCat) => {
                  const isSubSelected = activeSubcategory === subCat.id;
                  const serviceCount = subCat.services?.length || 0;
                  return (
                    <button
                      key={subCat.id}
                      type="button"
                      onClick={() => setActiveSubcategory(subCat.id)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        isSubSelected
                          ? "bg-emerald-700 text-white shadow-md"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-emerald-100/80 hover:border-emerald-300"
                      }`}
                    >
                      <span>{subCat.title}</span>
                      {serviceCount > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            isSubSelected ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {serviceCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LEVEL 3: Relevant Services & Rates Listing */}
      <div ref={servicesRef} className="mx-auto max-w-7xl scroll-mt-36 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {initialSearch.trim()
                ? `Results for "${initialSearch.trim()}"`
                : activeCategory !== "all"
                ? activeSubcategory !== "all"
                  ? currentSubcategories.find((sc) => sc.id === activeSubcategory)?.title || "Sub-Service Services"
                  : `${activeCategoryObj?.title || "Services"} Options`
                : "All Bookable Services"}
            </h2>
            <p className="text-sm text-slate-500">
              {searching
                ? "Searching service catalogue…"
                : `${filtered.length} service rate${filtered.length !== 1 ? "s" : ""} available for booking.`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            Clear rates & instant booking
          </div>
        </div>

        {searching ? (
          <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-emerald-700">Searching services…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-400">No services match your selection</p>
            <p className="mt-2 text-slate-500">Try selecting a different sub-service filter above.</p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setActiveSubcategory("all");
              }}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service, index) => (
              <ServiceCardWithBooking
                key={`${service.id}-${service.title}-${index}`}
                service={service}
                onBook={() => setBookingService(service)}
              />
            ))}
          </div>
        )}
      </div>

      {bookingService && (
        <BookingModal
          isOpen={Boolean(bookingService)}
          onClose={() => setBookingService(null)}
          service={bookingService}
        />
      )}
    </div>
  );
}

function ServiceCardWithBooking({ service, onBook }: { service: ApiService; onBook: () => void }) {
  const src = imgSrc(service.serviceImageUrl || service.imageUrl || service.image_url);
  const originalPrice = Number(service.original_price || service.originalPrice || 0);
  const discount = originalPrice > service.price ? Math.round(((originalPrice - service.price) / originalPrice) * 100) : 0;
  const unitText = service.unitDescription || service.serviceType || service.service_type || "";

  return (
    <div className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 shrink-0 bg-slate-100 sm:h-56">
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
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          {service.badge ? (
            <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow">{service.badge}</span>
          ) : null}
          {discount > 0 ? (
            <span className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow">{discount}% OFF</span>
          ) : null}
        </div>
        {service.duration ? (
          <div className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:right-4">
            <Clock className="h-3.5 w-3.5" />
            {service.duration}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/services/${service.id}`} className="group-hover:text-emerald-600">
          <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors">{service.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">
          {service.detailDescription || service.detail_description || service.description}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Star className={`h-4 w-4 ${Number(service.reviews || 0) > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          <span className="text-sm font-bold text-slate-700">{Number(service.reviews || 0) > 0 ? Number(service.rating || 0).toFixed(1) : "0.0"}</span>
          <span className="text-xs text-slate-400">{Number(service.reviews || 0) > 0 ? `(${service.reviews} reviews)` : "(No reviews)"}</span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {unitText ? unitText : "Rate"}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">Rs {service.price.toLocaleString()}</span>
              {discount > 0 ? <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onBook}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
