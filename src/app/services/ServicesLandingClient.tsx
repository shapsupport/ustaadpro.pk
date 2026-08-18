"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight, Calendar, Camera, CircleCheck, Flame, Hammer, Headphones,
  Loader2, MapPin, Paintbrush, Shirt, ShieldCheck, Snowflake, Sparkles,
  Wrench, Zap,
} from "lucide-react";
import type { ApiCatalogCategory, ApiCategory, ApiService } from "@/lib/api-types";
import { searchServicesFromApi } from "@/lib/search";
import { useLocation } from "@/context/LocationContext";
import { ResilientImage } from "@/components/shared/ResilientImage";
import { UniversalSearch } from "@/components/search/UniversalSearch";
import { categoryHref, serviceHref } from "@/lib/service-url";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const ALIASES: Record<string, string[]> = {
  "ac-services": ["ac-services", "hvac"], electrician: ["electrician"], plumber: ["plumber", "plumbers"],
  "home-services": ["home-services", "home-cleaning", "cleaning", "cleaning_service", "home_service", "home"],
  painter: ["painter", "painters"], carpenter: ["carpenter"], cctv: ["cctv"],
  welder: ["welder", "welder-fabricator"], subscriptions: ["subscriptions", "office-maintenance"],
};
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "ac-services": Snowflake, electrician: Zap, plumber: Wrench, "home-services": Sparkles,
  painter: Paintbrush, carpenter: Hammer, cctv: Camera, welder: Flame, subscriptions: Calendar,
  "dry-cleaning": Shirt,
};
const FALLBACK_CATEGORIES: ApiCategory[] = [
  { id: "ac-services", title: "AC Services", subtitle: "Maintenance, installation & gas refill" },
  { id: "electrician", title: "Electrician", subtitle: "Wiring, breakers, fans & repairs" },
  { id: "plumber", title: "Plumber", subtitle: "Pipes, leaks, fixtures & drainage" },
  { id: "home-services", title: "Cleaning Services", subtitle: "Deep clean, sofa care & water tank" },
  { id: "painter", title: "Painters", subtitle: "Wall painting, polish & staining" },
  { id: "carpenter", title: "Carpenter", subtitle: "Furniture, doors, locks & wood work" },
  { id: "cctv", title: "CCTV", subtitle: "Camera installation & security setup" },
  { id: "welder", title: "Welder & Fabricator", subtitle: "Gates, grills, shades & metal repair" },
  { id: "subscriptions", title: "Subscriptions", subtitle: "Regular home & office maintenance" },
];

function imageUrl(value?: string) {
  if (!value) return "";
  return value.startsWith("http") ? value : `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function ServicesLandingClient({ initialCategories, initialCatalog, initialSearch = "" }: {
  initialCategories?: ApiCategory[];
  initialCatalog?: ApiCatalogCategory[];
  initialSearch?: string;
}) {
  const { location, setShowPicker } = useLocation();
  const [results, setResults] = useState<ApiService[]>([]);
  const [searching, setSearching] = useState(Boolean(initialSearch.trim()));
  const categories = useMemo(() => {
    const live = (initialCategories || []).filter((item) => item.isActive !== false && item.is_active !== false);
    if (!live.length) return FALLBACK_CATEGORIES;
    return live.map((category) => {
      const fallback = FALLBACK_CATEGORIES.find((item) => (ALIASES[item.id] || [item.id]).includes(category.id));
      return { ...fallback, ...category, subtitle: category.subtitle || fallback?.subtitle };
    });
  }, [initialCategories]);
  const catalogByAlias = useMemo(() => {
    const map = new Map<string, ApiCatalogCategory>();
    (initialCatalog || []).forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [initialCatalog]);

  useEffect(() => {
    const query = initialSearch.trim();
    if (!query) return;
    const controller = new AbortController();
    searchServicesFromApi(query, "all", controller.signal)
      .then((items) => { if (!controller.signal.aborted) setResults((items as ApiService[]).slice(0, 24)); })
      .catch(() => { if (!controller.signal.aborted) setResults([]); })
      .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    return () => controller.abort();
  }, [initialSearch]);

  return <main className="min-h-screen bg-slate-50">
    <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_80%_10%,#d1fae5_0,transparent_38%),linear-gradient(180deg,#fff_0%,#f0fdf4_100%)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8">
        <div>
          <button type="button" onClick={() => setShowPicker(true)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800"><MapPin className="h-4 w-4" />{location.shortLabel || location.label || "Select location"}</button>
          <p className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600"><Sparkles className="h-4 w-4" /> Professional home services</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Find the right expert.<span className="block text-emerald-600">Get the job done right.</span></h1>
          <div data-hero-search className="mt-6 max-w-xl lg:hidden"><UniversalSearch mobile defaultScope="service" /></div>
        </div>
        <div className="hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl lg:block">
          <h2 className="text-xl font-black text-slate-950">Book with confidence</h2>
          <div className="mt-5 space-y-3">{[
            [ShieldCheck, "Clear pricing before booking"], [CircleCheck, "Choose the exact service you need"], [Headphones, "Support for every booking"],
          ].map(([Icon, text]) => { const ItemIcon = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-slate-700"><ItemIcon className="h-5 w-5 text-emerald-700" />{String(text)}</div>; })}</div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {initialSearch.trim() ? <>
        <h2 className="text-2xl font-black text-slate-950">Results for “{initialSearch.trim()}”</h2>
        {searching ? <div className="mt-8 flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Finding matching services…</div> : results.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((service) => <Link key={service.id} href={serviceHref(service)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"><strong className="line-clamp-2 text-sm text-slate-900 sm:text-base">{service.title}</strong>{Number(service.price) > 0 && <span className="mt-4 block text-sm font-black text-emerald-700">From Rs {Number(service.price).toLocaleString("en-PK")}</span>}<span className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700">View details <ArrowRight className="h-3.5 w-3.5" /></span></Link>)}</div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No matching services found.</div>}
      </> : <>
        <h2 className="text-2xl font-black text-slate-950">Select a service category</h2><p className="mt-1 text-sm text-slate-500">Only active categories are shown. Choose one to see its available sub-services.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{categories.map((category) => {
          const Icon = ICONS[category.id] || Wrench;
          const catalog = (ALIASES[category.id] || [category.id]).map((id) => catalogByAlias.get(id)).find(Boolean);
          const src = imageUrl(catalog?.mainCategory?.webImageUrl || catalog?.mainCategory?.mobileIconUrl);
          return <Link key={category.id} href={categoryHref(category.id)} prefetch={false} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-lg sm:rounded-3xl">
            <div className="relative m-2 h-32 overflow-hidden rounded-xl bg-emerald-100 sm:m-3 sm:h-48">{src ? <ResilientImage src={src} alt={category.title} sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" quality={85} className="object-cover" fallback={<span className="grid h-full place-items-center"><Icon className="h-10 w-10 text-emerald-700" /></span>} /> : <span className="grid h-full place-items-center"><Icon className="h-10 w-10 text-emerald-700" /></span>}</div>
            <div className="p-3 pt-2 sm:p-5 sm:pt-2"><strong className="block text-sm leading-tight text-slate-950 sm:text-lg">{category.title}</strong><span className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 sm:text-sm">{category.subtitle}</span><span className="mt-3 flex items-center gap-1 text-[11px] font-black text-emerald-700 sm:text-sm">View sub-services <ArrowRight className="h-3.5 w-3.5" /></span></div>
          </Link>;
        })}</div>
      </>}
    </section>
  </main>;
}
