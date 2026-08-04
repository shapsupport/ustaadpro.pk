"use client";

import { useEffect, useMemo, useState, type ComponentType, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
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
  CheckCircle2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import type { ApiCategory, ApiCatalogCategory, ApiService, ApiSubcategory } from "@/lib/api-types";
import { orderServices } from "@/lib/service-order";
import { searchServicesFromApi } from "@/lib/search";
import { useLocation } from "@/context/LocationContext";
import BookingModal from "@/components/booking/BookingModal";
import { useServiceCart } from "@/context/ServiceCartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";

function imgSrc(url: string | undefined | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

function SafeImage({ src, alt, fallback, className }: { src: string; alt: string; fallback: React.ReactNode; className?: string }) {
  const [error, setError] = useState(false);
  if (error) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className ?? "object-cover"}
      onError={() => setError(true)}
      unoptimized
    />
  );
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

const CAT_GRADIENTS: Record<string, string> = {
  "ac-services": "from-blue-500 to-indigo-600",
  electrician: "from-amber-400 to-orange-500",
  plumber: "from-sky-500 to-blue-600",
  "home-services": "from-emerald-500 to-teal-600",
  painter: "from-pink-500 to-rose-600",
  carpenter: "from-yellow-500 to-amber-600",
  cctv: "from-violet-500 to-purple-600",
  welder: "from-red-500 to-rose-600",
  subscriptions: "from-purple-500 to-violet-600",
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

// Which step are we on?
type Step = "category" | "subcategory" | "services";

// Subcategory item — covers both ApiSubcategory and fallback plain objects
type SubcatItem = ApiSubcategory & { description?: string };

export function ServicesPageContent({
  initialServices,
  initialCategories = [],
  initialCatalog = [],
  initialSearch = "",
}: ServicesPageContentProps) {
  const { location, setShowPicker } = useLocation();
  const [step, setStep] = useState<Step>("category");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<SubcatItem | null>(null);
  const [searchedServices, setSearchedServices] = useState<ApiService[]>([]);
  const [completedSearch, setCompletedSearch] = useState("");
  const [bookingService, setBookingService] = useState<ApiService | null>(null);
  const [bookingQuantity, setBookingQuantity] = useState(1);

  const stepRef = useRef<HTMLDivElement>(null);
  const activeAliases = useMemo(() => getCategoryAliases(activeCategory), [activeCategory]);
  const displayCategories = useMemo(() => {
    if (!initialCategories?.length) return PRIMARY_CATEGORIES;
    return initialCategories
      .filter((category) => category.isActive !== false && category.is_active !== false)
      .map((category) => {
        const aliases = getCategoryAliases(category.id);
        const fallback = PRIMARY_CATEGORIES.find((item) => aliases.includes(item.id) || getCategoryAliases(item.id).includes(category.id));
        return { ...fallback, ...category, subtitle: category.subtitle || fallback?.subtitle };
      });
  }, [initialCategories]);

  const activeCategoryObj = displayCategories.find((c) => activeAliases.includes(c.id) || getCategoryAliases(c.id).some((id) => activeAliases.includes(id)));

  function openBooking(service: ApiService, quantity = 1) {
    setBookingQuantity(Math.max(1, quantity));
    setBookingService(service);
  }

  function scrollToStep() {
    window.requestAnimationFrame(() => {
      stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Step 1 → Step 2: select main category, show subcategories
  function selectCategory(catId: string) {
    setActiveCategory(catId);
    setActiveSubcategory(null);
    setStep("subcategory");
    scrollToStep();
  }

  // Step 2 → Step 3: select sub-category, show services
  function selectSubcategory(sub: SubcatItem) {
    setActiveSubcategory(sub);
    setStep("services");
    scrollToStep();
  }

  // Back from Step 2 → Step 1
  function backToCategories() {
    setActiveCategory("all");
    setActiveSubcategory(null);
    setStep("category");
    scrollToStep();
  }

  // Back from Step 3 → Step 2
  function backToSubcategories() {
    setActiveSubcategory(null);
    setStep("subcategory");
    scrollToStep();
  }

  // Build subcategories list for selected main category
  const currentSubcategories = useMemo(() => {
    if (activeCategory === "all") return [];
    const subcatsMap = new Map<string, ApiSubcategory>();

    // Normalize for flexible matching: lowercase + remove spaces/hyphens/underscores
    const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
    const activeAliasesNorm = activeAliases.map(normalize);

    // Also match by category title (e.g. catalog has title "Electrician" matching our category)
    const activeCategoryTitle = displayCategories.find((c) => activeAliases.includes(c.id) || getCategoryAliases(c.id).some((id) => activeAliases.includes(id)))?.title?.toLowerCase() ?? "";

    // Find all catalog entries that match this category (flexible matching)
    const matchingCatalogEntries = initialCatalog.filter((catalogCat) => {
      const catIdNorm = normalize(catalogCat.id);
      const catTitleNorm = (catalogCat.title ?? "").toLowerCase();
      return (
        activeAliasesNorm.includes(catIdNorm) ||
        activeAliases.includes(catalogCat.id) ||
        (activeCategoryTitle && (catTitleNorm === activeCategoryTitle || catTitleNorm.includes(activeCategoryTitle) || activeCategoryTitle.includes(catTitleNorm)))
      );
    });

    // Log what we found for debugging
    if (typeof window !== "undefined") {
      console.log("[Services] Category selected:", activeCategory, "| aliases:", activeAliases);
      console.log("[Services] Catalog IDs:", initialCatalog.map((c) => c.id));
      console.log("[Services] Matching catalog entries:", matchingCatalogEntries.map((c) => ({ id: c.id, title: c.title, subcats: c.subcategories?.length ?? 0 })));
    }

    matchingCatalogEntries.forEach((catalogCat) => {
      if (catalogCat.subcategories) {
        catalogCat.subcategories.forEach((subCat) => {
          if (!subCat.id.endsWith("-main")) {
            const matchingServices = initialServices.filter((s) => {
              const subCatId = s.subcategory_id || s.subcategoryId || "";
              return subCatId === subCat.id;
            });

            let finalServices = matchingServices;
            if (finalServices.length === 0 && subCat.services && subCat.services.length > 0) {
              finalServices = subCat.services.map((subS) => {
                const found = initialServices.find((s) => s.id === subS.id);
                return found || subS;
              });
            }

            // Even if no services yet, keep the subcategory — we'll try to match later
            const existing = subcatsMap.get(subCat.id);
            const mergedServices = existing
              ? [...existing.services!, ...finalServices.filter(fs => !existing.services!.some(es => es.id === fs.id))]
              : finalServices;

            subcatsMap.set(subCat.id, { ...subCat, services: mergedServices });
          }
        });
      }

      // Also try directServices / services at the catalog level (not nested in subcategory)
      const directSvcs = catalogCat.directServices || catalogCat.services || [];
      directSvcs.forEach((svc) => {
        // These are top-level services — group them under a virtual "General" subcategory
        const virtualId = `${catalogCat.id}-direct`;
        const existing = subcatsMap.get(virtualId);
        if (!existing) {
          subcatsMap.set(virtualId, {
            id: virtualId,
            title: "General Services",
            services: [initialServices.find((s) => s.id === svc.id) ?? svc],
          });
        } else {
          if (!existing.services!.some((es) => es.id === svc.id)) {
            existing.services!.push(initialServices.find((s) => s.id === svc.id) ?? svc);
          }
        }
      });
    });

    // The API can contain legacy and current IDs for the same subcategory title.
    // Merge those records so an older empty entry cannot hide the populated one.
    const subcategoriesByTitle = new Map<string, ApiSubcategory>();
    Array.from(subcatsMap.values()).forEach((sub) => {
      const key = sub.title.trim().toLowerCase().replace(/\s+/g, " ");
      const existing = subcategoriesByTitle.get(key);
      if (!existing) {
        subcategoriesByTitle.set(key, { ...sub, services: [...(sub.services || [])] });
        return;
      }
      const mergedServices = [...(existing.services || [])];
      (sub.services || []).forEach((service) => {
        if (!mergedServices.some((item) => item.id === service.id)) mergedServices.push(service);
      });
      const preferIncoming = (sub.services?.length || 0) > (existing.services?.length || 0);
      subcategoriesByTitle.set(key, {
        ...(preferIncoming ? existing : sub),
        ...(preferIncoming ? sub : existing),
        id: preferIncoming ? sub.id : existing.id,
        services: mergedServices,
      });
    });

    const uniqueList = Array.from(subcategoriesByTitle.values());

    // FALLBACK: If still empty, show all services for this category grouped by subcategory_id
    if (uniqueList.length === 0) {
      const normalize2 = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
      const activeAliasesNorm2 = activeAliases.map(normalize2);
      const categoryServices = initialServices.filter((s) => {
        const catId = normalize2(s.category_id || s.categoryId || "");
        return activeAliases.includes(s.category_id || s.categoryId || "") || activeAliasesNorm2.includes(catId);
      });
      if (categoryServices.length > 0) {
        // Group by subcategory
        const bySubcat = new Map<string, ApiService[]>();
        categoryServices.forEach((s) => {
          const key = s.subcategory_id || s.subcategoryId || "general";
          const arr = bySubcat.get(key) ?? [];
          arr.push(s);
          bySubcat.set(key, arr);
        });
        return Array.from(bySubcat.entries()).map(([subId, svcs]) => ({
          id: subId,
          title: subId === "general" ? "General Services" : svcs[0].title.split(" ").slice(0, 3).join(" "),
          services: svcs,
        }));
      }
    }

    return uniqueList;
  }, [activeCategory, activeAliases, displayCategories, initialCatalog, initialServices]);

  // Services for selected sub-category
  const subcategoryServices = useMemo(() => {
    if (!activeSubcategory) return [];
    if (activeSubcategory.services && activeSubcategory.services.length > 0) {
      const initialServicesMap = new Map(initialServices.map((s) => [s.id, s]));
      const merged = activeSubcategory.services.map((catalogSvc) => {
        const live = initialServicesMap.get(catalogSvc.id);
        return live ?? catalogSvc;
      });
      return orderServices(merged);
    }
    // Fallback: match by subcategory_id
    const byId = initialServices.filter((s) => {
      const subCatId = s.subcategory_id || s.subcategoryId || "";
      return subCatId === activeSubcategory.id;
    });
    return orderServices(byId);
  }, [activeSubcategory, initialServices]);

  // Search
  useEffect(() => {
    const query = initialSearch.trim();
    if (!query) return;
    const controller = new AbortController();
    searchServicesFromApi(query, "all", controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) {
          setSearchedServices(results as ApiService[]);
          setCompletedSearch(query);
          scrollToStep();
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSearchedServices([]);
          setCompletedSearch(query);
        }
      });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  const searching = Boolean(initialSearch.trim() && completedSearch !== initialSearch.trim());
  const isSearchMode = Boolean(initialSearch.trim());

  const startingPrice = initialServices.length
    ? Math.min(...initialServices.map((s) => s.price).filter((p) => p > 0))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_68%_20%,#d1fae5_0,transparent_28%),linear-gradient(108deg,#fff_0%,#f7fffb_58%,#059669_58%,#047857_100%)]">
        <div
          className="absolute right-0 top-0 hidden h-full w-[42%] opacity-20 lg:block"
          style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }}
        />
        <div className="relative mx-auto grid min-h-[500px] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8">
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
              <Sparkles className="h-4 w-4" /> Book a service in 3 easy steps
            </span>
            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Find the right expert.
              <span className="mt-2 block text-emerald-600">Get the job done right.</span>
            </h1>
            {/* Step indicator */}
            <div className="mt-8 flex w-fit max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-emerald-200 bg-white p-2.5 shadow-lg sm:gap-3">
              {[
                { n: 1, label: "Category" },
                { n: 2, label: "Sub-service" },
                { n: 3, label: "Book" },
              ].map(({ n, label }, i) => {
                const isActive = (step === "category" && n === 1) || (step === "subcategory" && n === 2) || (step === "services" && n === 3);
                const isDone = (step === "subcategory" && n === 1) || (step === "services" && n <= 2);
                return (
                  <div key={n} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-all ${
                        isDone ? "bg-emerald-600 text-white" : isActive ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 shadow-sm" : "bg-slate-100 text-slate-500"
                      }`}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : n}
                      </div>
                      <span className={`whitespace-nowrap text-xs font-bold ${isActive ? "text-emerald-800" : isDone ? "text-emerald-700" : "text-slate-500"}`}>{label}</span>
                    </div>
                    {i < 2 && <div className={`h-px w-5 sm:w-8 ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 lg:pl-8">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">How it works</span>
                  <h2 className="mt-1 text-xl font-black text-slate-950">3 steps to book</h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Wrench className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { icon: Layers, step: "1", text: "Choose a main service category" },
                  { icon: CheckCircle2, step: "2", text: "Select the specific sub-service" },
                  { icon: ArrowRight, step: "3", text: "Pick a rate & book instantly" },
                ].map(({ icon: Icon, step: s, text }) => (
                  <div key={s} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-sm">
                      {s}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{text}</span>
                    <Icon className="ml-auto h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5 space-y-2">
                {[
                  { icon: ShieldCheck, text: "Clear pricing before booking" },
                  { icon: CircleCheck, text: "Real customer ratings" },
                  { icon: Headphones, text: "Support for every booking" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Starting from</p>
                  <p className="text-lg font-black text-emerald-800">Rs {startingPrice ? startingPrice.toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Categories</p>
                  <p className="text-lg font-black text-emerald-800">{PRIMARY_CATEGORIES.length}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Services</p>
                  <p className="text-lg font-black text-emerald-800">{initialServices.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Step Area */}
      <div ref={stepRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 lg:px-8">

        {/* ── SEARCH MODE ── */}
        {isSearchMode && (
          <div>
            <h2 className="mb-6 text-2xl font-black text-slate-900">
              {searching ? "Searching…" : `Results for "${initialSearch.trim()}"`}
            </h2>
            {searching ? (
              <LoadingGrid />
            ) : searchedServices.length === 0 ? (
              <EmptyState onReset={backToCategories} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {searchedServices.map((service, i) => (
                  <ServiceCard key={`${service.id}-${i}`} service={service} onBook={(quantity) => openBooking(service, quantity)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: SELECT MAIN CATEGORY ── */}
        {!isSearchMode && step === "category" && (
          <div>
            <StepHeader step={1} title="Select a Service Category" subtitle="Choose the type of work you need done" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayCategories.map((category) => {
                const IconComponent = CAT_ICONS[category.id] || Wrench;
                const gradient = CAT_GRADIENTS[category.id] || "from-slate-500 to-slate-600";
                const catalogMatch = initialCatalog.find((item) =>
                  (CATEGORY_ALIASES[category.id] || [category.id]).includes(item.id)
                );
                const webImgPath = catalogMatch?.mainCategory?.webImageUrl || catalogMatch?.mainCategory?.mobileIconUrl || "";
                const imageUrl = imgSrc(webImgPath);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300"
                  >
                    {/* Image / Gradient banner */}
                    <div className={`relative h-28 w-full bg-gradient-to-br ${gradient} overflow-hidden`}>
                      {imageUrl ? (
                        <SafeImage
                          src={imageUrl}
                          alt={category.title}
                          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center">
                              <IconComponent className="h-10 w-10 text-white/80" />
                            </div>
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <IconComponent className="h-10 w-10 text-white/90" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    {/* Text */}
                    <div className="flex flex-1 flex-col p-3">
                      <span className="font-bold text-sm text-slate-900 leading-tight">{category.title}</span>
                      <span className="mt-1 text-[11px] text-slate-500 leading-snug line-clamp-2">{category.subtitle}</span>
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        View sub-services <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: SELECT SUB-SERVICE ── */}
        {!isSearchMode && step === "subcategory" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={backToCategories}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <nav className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-emerald-700">{activeCategoryObj?.title}</span>
                <span>›</span>
                <span>Select sub-service</span>
              </nav>
            </div>
            <StepHeader step={2} title={`Choose a Sub-Service`} subtitle={`Pick the specific ${activeCategoryObj?.title?.toLowerCase() || "service"} type you need`} />

            {currentSubcategories.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-lg font-bold text-slate-400">No sub-services available</p>
                <button onClick={backToCategories} className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
                  ← Choose another category
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currentSubcategories.map((subCat) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const subCatAny = subCat as any;
                  const subImgSrc = imgSrc(
                    subCatAny.webImageUrl ||
                    subCatAny.webimageurl ||
                    subCatAny.imageUrl ||
                    subCatAny.image_url ||
                    subCatAny.imageurl ||
                    subCatAny.mobileIconUrl ||
                    subCatAny.mobileiconurl
                  );
                  const IconComponent = CAT_ICONS[activeCategory] || Wrench;
                  const gradient = CAT_GRADIENTS[activeCategory] || "from-emerald-500 to-teal-600";
                  const serviceCount = subCat.services?.length ?? 0;

                  return (
                    <button
                      key={subCat.id}
                      type="button"
                      onClick={() => selectSubcategory(subCat)}
                      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300"
                    >
                      {/* Thumbnail */}
                      <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}>
                        {subImgSrc ? (
                          <SafeImage
                            src={subImgSrc}
                            alt={subCat.title}
                            className="object-cover"
                            fallback={
                              <div className="flex h-full w-full items-center justify-center">
                                <IconComponent className="h-8 w-8 text-white/80" />
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <IconComponent className="h-8 w-8 text-white/80" />
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 leading-tight">{subCat.title}</p>
                        {subCatAny.description && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-snug">{subCatAny.description}</p>
                        )}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            {serviceCount} service{serviceCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:gap-1.5 transition-all">
                            Select <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: VIEW & BOOK SERVICES ── */}
        {!isSearchMode && step === "services" && activeSubcategory && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={backToSubcategories}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <nav className="flex items-center gap-1.5 text-xs text-slate-500">
                <button onClick={backToCategories} className="font-medium text-emerald-700 hover:underline">{activeCategoryObj?.title}</button>
                <span>›</span>
                <span className="font-medium text-emerald-700">{activeSubcategory.title}</span>
                <span>›</span>
                <span>Services</span>
              </nav>
            </div>

            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <StepHeader step={3} title={activeSubcategory.title} subtitle={`${subcategoryServices.length} service rate${subcategoryServices.length !== 1 ? "s" : ""} available — select one to book`} />
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Clear rates & instant booking
              </div>
            </div>

            {subcategoryServices.length === 0 ? (
              <EmptyState onReset={backToSubcategories} />
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {subcategoryServices.map((service, i) => (
                  <ServiceCard key={`${service.id}-${i}`} service={service} onBook={(quantity) => openBooking(service, quantity)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {bookingService && (
        <BookingModal
          isOpen={Boolean(bookingService)}
          onClose={() => setBookingService(null)}
          service={{
            id: bookingService.id,
            title: bookingService.title,
            price: bookingService.price,
            quantity: bookingQuantity,
            unitDescription: bookingService.unitDescription || bookingService.serviceType || bookingService.service_type,
          }}
        />
      )}
    </div>
  );
}

/* ── Helper Components ── */

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-md shadow-emerald-600/20">
        {step}
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
      <p className="text-xl font-bold text-slate-400">No services found</p>
      <p className="mt-2 text-slate-500">Try selecting a different option.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
      >
        ← Go Back
      </button>
    </div>
  );
}

function ServiceCard({ service, onBook }: { service: ApiService; onBook: (quantity: number) => void }) {
  const { items, addService } = useServiceCart();
  const src = imgSrc(service.serviceImageUrl || service.imageUrl || service.image_url);
  const originalPrice = Number(service.original_price || service.originalPrice || 0);
  const discount = originalPrice > service.price ? Math.round(((originalPrice - service.price) / originalPrice) * 100) : 0;
  const unitText = service.unitDescription || service.serviceType || service.service_type || "";
  const allowsQuantity = /^per\b/i.test(unitText.trim()) || /^per\b/i.test((service.description || "").trim());
  const [quantity, setQuantity] = useState(1);
  const cartKey = `${service.id}:service`;
  const inCart = items.some((item) => item.key === cartKey);
  const addToCart = () => addService({
    id: service.id,
    title: service.title,
    price: Number(service.price),
    quantity,
    imageUrl: service.serviceImageUrl || service.imageUrl || service.image_url,
    unitDescription: unitText,
  });

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

        {allowsQuantity && <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-2.5"><div><p className="text-xs font-bold text-emerald-900">How many?</p><p className="text-[10px] text-emerald-700">{unitText || "Per item"}</p></div><div className="flex items-center overflow-hidden rounded-xl border border-emerald-200 bg-white"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center text-slate-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="grid h-9 min-w-9 place-items-center border-x border-emerald-100 text-sm font-black text-slate-900">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center text-slate-600 disabled:opacity-30"><Plus className="h-4 w-4" /></button></div></div>}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {unitText ? unitText : "Rate"}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">Rs {(service.price * quantity).toLocaleString()}</span>
              {discount > 0 ? <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span> : null}
            </div>
          </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={addToCart} className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${inCart ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"}`}><ShoppingCart className="h-4 w-4" />{inCart ? "Add another" : "Add to cart"}</button>
          <button
            type="button"
            onClick={() => onBook(quantity)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
