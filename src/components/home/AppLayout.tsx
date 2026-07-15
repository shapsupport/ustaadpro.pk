"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import {
  Search, MapPin, ChevronDown, ChevronRight, ChevronLeft, Star,
  Clock, Layers, BadgeCheck, ArrowRight, Zap,
  Snowflake, Wrench, Sparkles, Shirt, Paintbrush,
  Hammer, Camera, Flame, Calendar, UserRound,
  type LucideIcon
} from "lucide-react";
import type { ApiService, ApiCategory } from "@/lib/api-types";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function imgSrc(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

interface AppLayoutProps {
  initialServices: ApiService[];
  categories: ApiCategory[];
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
  subscriptions: Calendar,
};

// Priority order — these appear first
const PRIORITY_CATS = ["electrician", "plumbers", "carpenter", "home-cleaning", "ac-services"];

const heroMaintenanceSlides = [
  {
    title: "Office maintenance",
    description: "Fast support for electrical fixes, AC upkeep, plumbing issues, and preventive care for offices and commercial spaces.",
    price: "4,500",
    badge: "Popular",
  },
  {
    title: "Corporate cleaning",
    description: "Scheduled cleaning, sanitization, and facility refreshes that keep workspaces presentable and productive.",
    price: "6,000",
    badge: "Flexible",
  },
  {
    title: "Facility support",
    description: "Reliable handyman and maintenance coverage for urgent repairs, installations, and small office upgrades.",
    price: "3,200",
    badge: "Same day",
  },
];

export function AppLayout({ initialServices, categories }: AppLayoutProps) {
  const { location, setShowPicker } = useLocation();
  const { user, setAuthModalMode } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsRef.current) return;

    tabsRef.current.scrollBy({
      left: direction === "left" ? -250 : 250,
      behavior: "smooth",
    });
  };

  // De-dup categories from services + API categories
  const allCategories = useMemo(() => {
    const catIds = [...new Set(initialServices.map((s) => s.category_id))];
    return catIds.map((id) => {
      const found = categories.find((c) => c.id === id);
      return found ?? { id, title: id.replace(/-/g, " "), subtitle: "", icon: "", tint: "#059669" };
    });
  }, [initialServices, categories]);

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", label: "All Services", icon: Layers }];
    const requested = [
      { id: "subscriptions", label: "Subscriptions", icon: Calendar },
      { id: "ac-services", label: "HVAC Services", icon: Snowflake },
      { id: "cctv", label: "CCTV Services", icon: Camera },
      { id: "welder-fabricator", label: "Welder & Fabricator", icon: Flame },
      { id: "carpenter", label: "Carpenter", icon: Hammer },
      { id: "painters", label: "Painters", icon: Paintbrush },
      { id: "plumbers", label: "Plumber", icon: Wrench },
      { id: "home-cleaning", label: "Home Cleaning", icon: Sparkles },
      { id: "electrician", label: "Electrician", icon: Zap },
    ];

    const seen = new Set<string>();
    requested.forEach((tab) => {
      const known = allCategories.find((cat) => cat.id === tab.id);
      if (!seen.has(tab.id) && (known || tab.id === "all")) {
        tabs.push({ id: tab.id, label: tab.label, icon: tab.icon });
        seen.add(tab.id);
      }
    });

    allCategories.forEach((cat) => {
      if (!seen.has(cat.id)) {
        tabs.push({ id: cat.id, label: cat.title, icon: CAT_ICONS[cat.id] || Wrench });
        seen.add(cat.id);
      }
    });

    return tabs;
  }, [allCategories]);

  const matchesCategory = (service: ApiService, category: string) => {
    if (category === "all") return true;
    const normalized = category.toLowerCase();
    const serviceCategory = service.category_id?.toLowerCase() || "";
    const title = service.title.toLowerCase();
    const aliases: Record<string, string[]> = {
      electrician: ["electrician"],
      plumbers: ["plumbers", "plumber"],
      "home-cleaning": ["home-cleaning", "cleaning"],
      "ac-services": ["ac-services", "hvac", "air-conditioner", "ac"],
      cctv: ["cctv", "security"],
      subscriptions: ["subscriptions", "subscription"],
      "welder-fabricator": ["welder", "fabricator", "welder-fabricator"],
      carpenter: ["carpenter"],
      painters: ["painters", "painting"],
    };

    return (aliases[normalized] ?? [normalized]).some((alias) => serviceCategory.includes(alias) || title.includes(alias));
  };

  // Filter + search, then sort by priority
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = initialServices.filter((s) => {
      const matchCat = matchesCategory(s, activeCategory);
      const matchQ = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    // Sort: priority cats first, then alphabetical by title
    return base.sort((a, b) => {
      const ai = PRIORITY_CATS.indexOf(a.category_id);
      const bi = PRIORITY_CATS.indexOf(b.category_id);
      if (ai !== -1 && bi === -1) return -1;
      if (bi !== -1 && ai === -1) return 1;
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.title.localeCompare(b.title);
    });
  }, [initialServices, activeCategory, searchQuery]);

  const featuredService = initialServices[0];
  const featuredImg = imgSrc(featuredService?.image_url || featuredService?.imageUrl);
  const activeHeroSlide = heroMaintenanceSlides[heroSlideIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlideIndex((current) => (current + 1) % heroMaintenanceSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ── Hero Header ── */}
      <section className="bg-gradient-to-br from-emerald-900 via-primary to-emerald-700 px-4 pt-24 pb-16 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 text-white/90 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm transition-colors border border-white/20"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium text-sm max-w-[200px] truncate">
                {location.label || "Set your location"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            <button
              onClick={() => {
                if (user) {
                  setProfileOpen(true);
                } else {
                  setAuthModalMode("login");
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label={user ? "Open account" : "Sign in"}
            >
              <UserRound className="h-5 w-5" />
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-end">
            {/* Left: headline + search */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                Rawalpindi &amp; Islamabad
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-3">
                Expert home services,<br />
                <span className="text-emerald-200">at your doorstep</span>
              </h1>
              <p className="text-white/70 text-lg mb-8 max-w-lg leading-relaxed">
                Book verified electricians, plumbers, AC technicians and 100+ more services — same day, transparent pricing.
              </p>

              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-white rounded-2xl px-4 shadow-xl focus-within:ring-2 focus-within:ring-emerald-300 transition-all">
                  <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory("all"); }}
                    placeholder="Search services (e.g. AC service, wiring…)"
                    className="w-full bg-transparent h-14 outline-none text-base text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Right: hero maintenance slider */}
            <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-950">
                  <Sparkles className="h-3.5 w-3.5" />
                  Maintenance plans
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeroSlideIndex((current) => (current - 1 + heroMaintenanceSlides.length) % heroMaintenanceSlides.length)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSlideIndex((current) => (current + 1) % heroMaintenanceSlides.length)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/5 p-5">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  {activeHeroSlide.badge}
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">{activeHeroSlide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{activeHeroSlide.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-2xl font-black text-white">Rs {activeHeroSlide.price}</span>
                  <Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary">
                    Explore now <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category tabs ── */}
      <div className="bg-white border-b border-slate-100 sticky top-22 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Tabs */}
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollTabs("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Tabs */}
              <div
                ref={tabsRef}
                className="flex gap-1 overflow-x-auto hide-scrollbar py-3 px-10 scroll-smooth"
              >
                {categoryTabs.map((tab) => {
                  const IconComponent = tab.icon || Wrench;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${activeCategory === tab.id
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollTabs("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Service slider ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Our Services</h2>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} service{filtered.length !== 1 ? "s" : ""} available in Rawalpindi &amp; Islamabad</p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-slate-400 mb-2">No services found</p>
            <p className="text-slate-400 mb-6">Try a different search term.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Show all services
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => (
              <ServiceCardLarge key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function ServiceCardLarge({ service }: { service: ApiService }) {
  const src = imgSrc(service.image_url || service.imageUrl);
  const originalPrice = Number(service.original_price || service.originalPrice || 0);
  const discount = originalPrice > service.price
    ? Math.round(((originalPrice - service.price) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/services/${service.id}`} className="group block">
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Bigger image container */}
        <div className="relative h-56 bg-slate-100 overflow-hidden shrink-0">
          {src ? (
            <Image
              src={src}
              alt={service.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Layers className="h-14 w-14 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {service.badge && (
              <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                {service.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Duration overlay */}
          {service.duration && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5" />
              {service.duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {service.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
            {service.detail_description || service.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-700">{service.rating}</span>
            <span className="text-xs text-slate-400">({service.reviews} reviews)</span>
            {service.workPrices && service.workPrices.length > 0 && (
              <span className="ml-auto flex items-center gap-1 text-xs text-primary font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" />
                {service.workPrices.length} types
              </span>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Starting from</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">Rs {service.price.toLocaleString()}</span>
                {discount > 0 && (
                  <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 bg-primary hover:bg-emerald-700 text-white text-sm font-bold px-4 py-3 rounded-2xl transition-all shadow-md shadow-primary/20">
              Book <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
