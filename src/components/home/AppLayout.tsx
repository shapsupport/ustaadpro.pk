"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, Camera, CheckCircle2, ChevronDown,
  Clock3, Flame, Hammer, Layers3, MapPin,
  Paintbrush, ShieldCheck, Shirt, Snowflake, Sparkles, Star,
  Timer, UserCheck, WalletCards, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import type { ApiCatalogCategory, ApiCategory, ApiReview, ApiService, ApiSubcategory } from "@/lib/api-types";
import { useLocation } from "@/context/LocationContext";
import { orderCategories, orderServices } from "@/lib/service-order";
import { AppStoreButtons } from "@/components/shared/AppStoreButtons";
import { categoryHref, subcategoryHref } from "@/lib/service-url";

// Always use the live public API origin for images so relative paths
// like /uploads/... resolve correctly in all environments.
const IMAGE_BASE = "https://api.ustaadpro.pk";

function imgSrc(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

const CAT_ICONS: Record<string, LucideIcon> = {
  "ac-services": Snowflake,
  electrician: Zap,
  plumbers: Wrench,
  "home-cleaning": Sparkles,
  "dry-cleaning": Shirt,
  painters: Paintbrush,
  carpenter: Hammer,
  cctv: Camera,
  "welder-fabricator": Flame,
};

const trustItems = [
  { icon: WalletCards, title: "Upfront pricing", text: "No hidden charges" },
  { icon: ShieldCheck, title: "Skilled professionals", text: "Carefully selected pros" },
  { icon: Timer, title: "On-time service", text: "Punctual & reliable" },
  { icon: CheckCircle2, title: "Customer support", text: "We’re here to help" },
];

/** Image chip for the "Browse by category" grid. */
function CatImage({ src, alt, priority, className }: { src: string; alt: string; priority: boolean; className?: string }) {
  const [error, setError] = useState(false);
  if (error) return (
    <div className={`flex items-center justify-center bg-emerald-50 ${className ?? "h-full w-full"}`}>
      <Wrench className="h-10 w-10 text-emerald-300" />
    </div>
  );
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width:640px) 50vw, 33vw"
      className="object-cover"
      priority={priority}
      onError={() => setError(true)}

    />
  );
}

// Service category_ids don't always match API category ids
// (e.g. services use "plumbers" but API returns "plumber").
const CAT_ALIASES: string[][] = [
  ["home-services", "home-cleaning", "cleaning", "home_service", "home"],
  ["plumber", "plumbers", "plumbing"],
  ["painter", "painters", "painting"],
  ["welder", "welder-fabricator", "welder_fabricator"],
  ["ac-services", "hvac", "ac_services"],
  ["subscriptions", "office-maintenance", "office_maintenance"],
  ["electrician", "electrical"],
  ["carpenter", "carpentry"],
  ["cctv", "cameras"],
];

function findCategory(categories: ApiCategory[], id: string) {
  const exact = categories.find((c) => c.id === id);
  if (exact) return exact;
  const group = CAT_ALIASES.find((g) => g.includes(id));
  if (group) {
    for (const alias of group) {
      const match = categories.find((c) => c.id === alias);
      if (match) return match;
    }
  }
  return null;
}

interface AppLayoutProps {
  initialServices: ApiService[];
  categories: ApiCategory[];
  catalog: ApiCatalogCategory[];
  reviews: ApiReview[];
}

export function AppLayout({ initialServices, categories, catalog, reviews }: AppLayoutProps) {
  const router = useRouter();
  const { location, setShowPicker } = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState<ApiSubcategory | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const servicesRef = useRef<HTMLElement>(null);

  const orderedServices = useMemo(() => orderServices(initialServices), [initialServices]);
  const servicesById = useMemo(() => new Map(orderedServices.map((service) => [service.id, service])), [orderedServices]);
  const featuredServices = useMemo(() => orderedServices.slice(0, 3), [orderedServices]);
  const categoryList = useMemo(() => {
    const ids = [...new Set(orderedServices.map((service) => service.category_id || service.categoryId).filter(Boolean) as string[])];
    return orderCategories(ids.map((id) => findCategory(categories, id) ?? {
      id: id || "", title: id ? id.replace(/-/g, " ") : "", subtitle: "", icon: "", tint: "#059669",
    }));
  }, [categories, orderedServices]);

  useEffect(() => {
    if (featuredServices.length < 2) return;
    const timer = window.setInterval(() => setFeaturedIndex((index) => (index + 1) % featuredServices.length), 6000);
    return () => window.clearInterval(timer);
  }, [featuredServices.length]);

  const activeAliases = useMemo(
    () => CAT_ALIASES.find((aliases) => aliases.includes(activeCategory)) ?? [activeCategory],
    [activeCategory],
  );
  const activeCatalog = useMemo(
    () => catalog.find((item) => activeAliases.includes(item.id)),
    [activeAliases, catalog],
  );
  const activeSubcategories = useMemo(() => {
    const merged = new Map<string, ApiSubcategory>();
    (activeCatalog?.subcategories ?? [])
      .filter((subcategory) => !subcategory.id.endsWith("-main"))
      .forEach((subcategory) => {
        const key = subcategory.title.trim().toLowerCase().replace(/\s+/g, " ");
        const existing = merged.get(key);
        const services = [...(existing?.services ?? [])];
        (subcategory.services ?? []).forEach((service) => {
          if (!services.some((item) => item.id === service.id)) services.push(service);
        });
        const preferIncoming = (subcategory.services?.length ?? 0) > (existing?.services?.length ?? 0);
        merged.set(key, { ...(preferIncoming || !existing ? subcategory : existing), services });
      });
    return [...merged.values()].map((subcategory) => {
      const services = [...(subcategory.services ?? [])];
      orderedServices.forEach((service) => {
        const subcategoryId = service.subcategory_id || service.subcategoryId;
        if (subcategoryId === subcategory.id && !services.some((item) => item.id === service.id)) services.push(service);
      });
      return { ...subcategory, services };
    });
  }, [activeCatalog, orderedServices]);
  const activeCategoryServices = useMemo(() => {
    const matched = orderedServices.filter((service) =>
      activeAliases.includes(service.category_id || service.categoryId || "")
    );
    const byId = new Map(matched.map((service) => [service.id, service]));
    (activeCatalog?.directServices ?? activeCatalog?.services ?? []).forEach((service) => {
      if (!byId.has(service.id)) byId.set(service.id, servicesById.get(service.id) ?? service);
    });
    return orderServices([...byId.values()]);
  }, [activeAliases, activeCatalog, orderedServices, servicesById]);
  const selectedServices = useMemo(() => {
    if (!activeSubcategory) return [];
    const nested = (activeSubcategory.services ?? []).map((service) => servicesById.get(service.id) ?? service);
    if (nested.length) return orderServices(nested);
    return orderServices(orderedServices.filter((service) =>
      (service.subcategory_id || service.subcategoryId) === activeSubcategory.id
    ));
  }, [activeSubcategory, orderedServices, servicesById]);

  const featured = featuredServices[featuredIndex];
  const popular = useMemo(() => [...orderedServices]
    .sort((left, right) => {
      const reviewDifference = Number(right.reviews || 0) - Number(left.reviews || 0);
      if (reviewDifference !== 0) return reviewDifference;
      const ratingDifference = Number(right.rating || 0) - Number(left.rating || 0);
      if (ratingDifference !== 0) return ratingDifference;
      return left.title.localeCompare(right.title);
    })
    .slice(0, 8), [orderedServices]);

  function showCategory(id: string) {
    if (id !== "all") {
      router.push(categoryHref(id));
      return;
    }
    setActiveCategory(id);
    setActiveSubcategory(null);
    window.requestAnimationFrame(() => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function showSubcategory(subcategory: ApiSubcategory) {
    router.push(subcategoryHref(activeCategory, subcategory.title));
  }

  return (
    <div className="bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_70%_25%,#d1fae5_0,transparent_32%),linear-gradient(110deg,#fff_0%,#f8fffc_56%,#059669_56%,#047857_100%)]">
        <div className="absolute right-0 top-0 hidden h-full w-[44%] opacity-25 lg:block" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="container-wide relative grid min-h-[590px] px-4 pt-9 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pt-12">
          <div className="relative z-20 flex flex-col justify-center pb-12 lg:pb-20">
            <button type="button" onClick={() => setShowPicker(true)} className="mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100">
              <MapPin className="h-4 w-4" />
              <span className="max-w-52 truncate">{location.shortLabel || location.label || "Rawalpindi & Islamabad"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <h1 className="max-w-xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Expert home services,
              <span className="mt-2 block text-emerald-600">at your doorstep</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Book skilled electricians, plumbers, AC technicians and more services across Rawalpindi and Islamabad.
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["4.9", "Average rating"], ["Easy", "Online booking"], ["Local", "Service coverage"], ["Quick", "Response"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm">
                  <strong className="block text-sm text-emerald-700">{value}</strong>
                  <span className="text-[10px] font-medium text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 hidden min-h-[560px] lg:block">
            <Image src="/home/technician-hero-branded-v3.png" alt="Ustaad Pro home-service technician" fill priority sizes="50vw" className="z-10 -translate-x-36 object-contain object-bottom xl:-translate-x-44" />
            {featured && <FeaturedCard service={featured} />}
            <div className="absolute bottom-5 right-24 z-30 flex gap-1.5">
              {featuredServices.map((service, index) => (
                <button key={service.id} onClick={() => setFeaturedIndex(index)} aria-label={`Show ${service.title}`} className={`h-2 rounded-full transition-all ${index === featuredIndex ? "w-6 bg-white" : "w-2 bg-white/45"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={servicesRef} className="scroll-mt-28 border-b border-slate-100 bg-white py-12 sm:py-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              {activeCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => activeSubcategory ? setActiveSubcategory(null) : showCategory("all")}
                  className="mb-4 inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-base font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  {activeSubcategory ? "Back to sub-services" : "Back to categories"}
                </button>
              )}
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{activeSubcategory?.title || (activeCategory === "all" ? "Browse by category" : findCategory(categories, activeCategory)?.title || "Choose a sub-service")}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeCategory === "all" ? "Choose a service to get started" : activeSubcategory ? `${selectedServices.length} services available` : activeSubcategories.length > 0 ? "Choose the exact type of work you need" : `${activeCategoryServices.length} service${activeCategoryServices.length === 1 ? "" : "s"} available`}</p>
            </div>
            <button type="button" onClick={() => showCategory("all")} className={`${activeCategory === "all" ? "flex" : "hidden"} shrink-0 items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800`}>
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {activeCategory !== "all" && !activeSubcategory && activeSubcategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {activeSubcategories.map((subcategory) => {
                const subcategoryImage = imgSrc(subcategory.imageUrl || subcategory.image_url || subcategory.imageurl);
                const subcategoryServices = (subcategory.services ?? []).map((service) => servicesById.get(service.id) ?? service);
                const prices = subcategoryServices.map((service) => Number(service.price)).filter((price) => price > 0);
                const startingFrom = prices.length ? Math.min(...prices) : 0;
                return <button key={subcategory.id} type="button" onClick={() => showSubcategory(subcategory)} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl sm:rounded-3xl"><div className="relative h-36 overflow-hidden border-b border-slate-100 bg-white sm:h-52">{subcategoryImage ? <Image src={subcategoryImage} alt={subcategory.title} fill className="object-contain p-3 transition duration-500 group-hover:scale-[1.03] sm:p-4" sizes="(max-width:640px) 50vw, 25vw" /> : <div className="flex h-full items-center justify-center"><Wrench className="h-9 w-9 text-emerald-300 sm:h-12 sm:w-12" /></div>}{subcategoryServices.length > 0 ? <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[9px] font-black text-emerald-700 shadow sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">{subcategoryServices.length} service{subcategoryServices.length === 1 ? "" : "s"}</span> : null}</div><div className="p-3 sm:p-5"><h3 className="line-clamp-2 text-sm font-black leading-snug group-hover:text-emerald-700 sm:text-lg">{subcategory.title}</h3>{subcategory.description ? <p className="mt-2 hidden line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 sm:block">{subcategory.description}</p> : <p className="mt-2 hidden min-h-10 text-xs leading-5 text-slate-500 sm:block">View available options, pricing, and service details.</p>}<div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-4 sm:pt-4"><div className="min-w-0">{startingFrom ? <><span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">Starting from</span><strong className="mt-0.5 block truncate text-sm text-slate-950 sm:text-xl">Rs {startingFrom.toLocaleString()}</strong></> : <strong className="block text-xs text-emerald-700 sm:text-sm">View options</strong>}</div><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:h-11 sm:w-11"><ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" /></span></div></div></button>;
              })}
            </div>
          ) : activeCategory !== "all" && !activeSubcategory ? (
            activeCategoryServices.length ? <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{activeCategoryServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">No services are available in this category yet.</div>
          ) : activeSubcategory ? (
            selectedServices.length ? <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{selectedServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">No services are available in this sub-service yet.</div>
          ) : (
          /* Two columns on phones, scaling to four across larger screens. */
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {categoryList.slice(0, 9).map((category, index) => {
              const Icon = CAT_ICONS[category.id] || Wrench;
              const imageUrl = imgSrc(
                category.webImageUrl || category.web_image_url ||
                category.mobileIconUrl || category.mobile_icon_url ||
                category.imageUrl || category.image_url
              );
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => showCategory(category.id)}
                  className={`group min-w-0 overflow-hidden rounded-2xl border bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl ${
                    isActive ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {/* Image area */}
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100 sm:h-48 lg:h-52">
                    {imageUrl ? (
                      <CatImage src={imageUrl} alt={category.title} priority={index < 4} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    {/* Active badge */}
                    {isActive && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">
                        Selected
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
                  </div>

                  {/* Title area */}
                  <div className="flex items-center gap-3 p-4 sm:p-5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                    <h3 className={`text-base font-black leading-tight ${
                      isActive ? "text-emerald-700" : "text-slate-900 group-hover:text-emerald-700"
                    }`}>
                      {category.title}
                    </h3>
                    {category.subtitle && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{category.subtitle}</p>
                    )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}

            {/* View all card */}
            <button
              type="button"
              onClick={() => showCategory("all")}
              className="group flex min-h-[230px] min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg sm:min-h-[280px] sm:rounded-3xl sm:p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 transition group-hover:bg-emerald-100">
                <Layers3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">View all</p>
                <p className="text-xs text-slate-400">See everything</p>
              </div>
            </button>
          </div>
          )}

        </div>
      </section>

      <section id="popular-services" className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.28),transparent_28%),radial-gradient(circle_at_88%_82%,rgba(132,204,22,0.16),transparent_30%),linear-gradient(135deg,#071a18_0%,#0f2924_48%,#0b1720_100%)] py-14 text-white sm:py-16">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="container-wide relative px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div><span className="block text-xs font-black uppercase tracking-[0.2em] text-lime-300">Customer favourites</span><h2 className="mt-2 text-2xl font-black sm:text-3xl">Popular services</h2><p className="mt-1 text-sm text-emerald-50/65">Reviewed services appear first, based on live customer feedback.</p></div>
            <Link href="/services" className="hidden items-center gap-1 rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-500/10 sm:flex">View all services <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {popular.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{popular.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <h3 className="font-bold text-slate-900">No services found</h3><p className="mt-1 text-sm text-slate-500">Try another search or category.</p>
              <button onClick={() => setActiveCategory("all")} className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Show all services</button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 border-b border-emerald-100 p-5 last:border-0 sm:border-r lg:border-b-0"><Icon className="h-7 w-7 shrink-0 text-emerald-600" /><div><strong className="block text-sm">{title}</strong><span className="text-xs text-slate-500">{text}</span></div></div>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white py-12">
        <div className="container-wide px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">How it works</h2><p className="mt-1 text-sm text-slate-500">Book in three simple steps</p>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              [CalendarCheck, "1", "Choose a service", "Select what you need from our service list."],
              [UserCheck, "2", "Pick date & time", "Choose your preferred appointment details."],
              [CheckCircle2, "3", "We’ll handle it", "A professional arrives and completes the work."],
            ].map(([Icon, number, title, text]) => {
              const StepIcon = Icon as LucideIcon;
              return <div key={String(number)} className="relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">{String(number)}</span><div><h3 className="font-bold">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{String(text)}</p></div><StepIcon className="absolute right-4 top-4 h-4 w-4 text-emerald-200" /></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="text-center"><h2 className="text-2xl font-black">What our customers say</h2><p className="mt-1 text-sm text-slate-500">Experiences shared by Ustaad Pro customers</p></div>
          {reviews.length > 0 ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reviews.map((review) => {
              const name = review.userName || review.user_name || review.customerName || review.user?.name || "Ustaad Pro customer";
              return <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(Number(review.rating)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div><p className="mt-4 line-clamp-5 text-sm leading-6 text-slate-600">“{review.comment}”</p><div className="mt-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{name[0]}</span><div><strong className="block text-xs">{name}</strong><span className="text-[11px] text-slate-400">{review.serviceTitle || "Verified booking"}</span></div></div></article>;
            })}
          </div> : <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><Star className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 font-bold text-slate-800">Customer reviews will appear here</h3><p className="mt-1 text-sm text-slate-500">The latest highly rated, published reviews are loaded directly from completed bookings.</p></div>}
        </div>
      </section>

      <section className="overflow-hidden bg-white py-12 md:py-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 text-white">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative grid min-h-[410px] items-center md:grid-cols-[.9fr_1.1fr]">
              <div className="relative hidden h-full min-h-[410px] md:block">
                <Image src="/home/app-spokesperson-branded-v2.png" alt="Ustaad Pro app customer holding a smartphone displaying the Ustaad Pro logo" fill sizes="45vw" className="object-contain object-bottom" />
              </div>
              <div className="relative px-6 py-12 sm:px-10 md:px-8 lg:px-14">
                <span className="inline-flex rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Ustaad Pro mobile app</span>
                <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Your home services, right in your pocket.</h2>
                <p className="mt-4 max-w-lg leading-7 text-emerald-50/80">Discover services, make bookings, follow updates, and manage your Ustaad Pro experience from your phone.</p>
                <div className="mt-7"><AppStoreButtons /></div>
                <div className="relative mx-auto mt-8 h-64 w-full max-w-xs md:hidden">
                  <Image src="/home/app-spokesperson-branded-v2.png" alt="Ustaad Pro app customer holding a smartphone displaying the Ustaad Pro logo" fill sizes="320px" className="object-contain object-bottom" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 px-6 py-9 text-white md:flex md:items-center md:justify-between md:px-12">
            <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-lime-300/20 blur-2xl" />
            <div className="relative"><h2 className="text-2xl font-black md:text-3xl">Need a professional at your doorstep?</h2><p className="mt-2 text-sm text-emerald-50/80">Browse available services and book the help you need.</p></div>
            <Link href="/services" className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50 md:mt-0">Book now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedCard({ service }: { service: ApiService }) {
  return (
    <div className="absolute right-0 top-24 z-20 w-72 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur xl:w-80">
      {imgSrc(service.image_url || service.imageUrl) && <div className="relative h-28"><Image src={imgSrc(service.image_url || service.imageUrl)!} alt="" fill className="object-cover" sizes="320px" /></div>}
      <div className="p-5"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Featured service</span><h2 className="mt-3 line-clamp-1 text-lg font-black">{service.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{service.description}</p><div className="mt-4 flex items-end justify-between"><div><span className="block text-[10px] text-slate-400">Starting from</span><strong className="text-xl">Rs {service.price.toLocaleString()}</strong></div><Link href={`/services/${service.id}`} prefetch={false} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Book now <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Star className={`h-3.5 w-3.5 ${Number(service.reviews || 0) > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /> {Number(service.reviews || 0) > 0 ? `${Number(service.rating || 0).toFixed(1)} (${service.reviews})` : "0.0 · No reviews"}</span>{service.duration && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-emerald-600" /> {service.duration}</span>}</div></div>
    </div>
  );
}

function ServiceCard({ service }: { service: ApiService }) {
  const source = imgSrc(service.image_url || service.imageUrl);
  const original = Number(service.original_price || service.originalPrice || 0);
  const discount = original > service.price ? Math.round(((original - service.price) / original) * 100) : 0;
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:rounded-3xl">
      <Link href={`/services/${service.id}`} prefetch={false} className="relative block h-36 overflow-hidden border-b border-slate-100 bg-white sm:h-48">
        {source ? <Image src={source} alt={service.title} fill className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" /> : <div className="flex h-full items-center justify-center"><Wrench className="h-10 w-10 text-slate-300" /></div>}
        <div className="absolute left-2 top-2 flex gap-1 sm:left-3 sm:top-3 sm:gap-2">{service.badge && <span className="rounded-full bg-emerald-600 px-2 py-1 text-[8px] font-bold text-white sm:px-2.5 sm:text-[10px]">{service.badge}</span>}{discount > 0 && <span className="rounded-full bg-rose-500 px-2 py-1 text-[8px] font-bold text-white sm:px-2.5 sm:text-[10px]">{discount}% OFF</span>}</div>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[8px] font-bold sm:bottom-3 sm:right-3 sm:text-[10px]"><Star className={`h-3 w-3 ${Number(service.reviews || 0) > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /> {Number(service.reviews || 0) > 0 ? `${Number(service.rating || 0).toFixed(1)} (${service.reviews})` : "No reviews"}</span>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-5"><Link href={`/services/${service.id}`} prefetch={false}><h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 group-hover:text-emerald-700 sm:min-h-12 sm:text-base sm:leading-6">{service.title}</h3></Link><p className="mt-1 hidden line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 sm:block">{service.description}</p><div className="mt-2 flex flex-wrap items-center gap-1 text-[9px] font-medium text-slate-500 sm:mt-3 sm:gap-3 sm:text-[10px]"><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-1 font-bold text-emerald-700 sm:px-2"><BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Verified</span>{service.duration && <span className="hidden items-center gap-1 sm:flex"><Clock3 className="h-3.5 w-3.5 text-emerald-600" /> {service.duration}</span>}</div><div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-4"><div className="min-w-0"><span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[9px]">Starts from</span><strong className="block truncate text-sm text-slate-950 sm:text-lg">Rs {service.price.toLocaleString()}</strong>{discount > 0 && <span className="hidden text-[10px] text-slate-400 line-through sm:inline">Rs {original.toLocaleString()}</span>}</div><Link href={`/services/${service.id}`} prefetch={false} className="flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 text-[10px] font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 sm:h-10 sm:w-auto sm:rounded-xl sm:px-4 sm:text-xs">Book now <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></Link></div></div>
    </article>
  );
}
