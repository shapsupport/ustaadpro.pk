"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Grid2X2, Search, Sparkles, Wrench, ShoppingBag, X } from "lucide-react";
import { getSearchVocabulary, searchProductsByCategory, searchServicesFromApi, searchSuggestions, type SearchResult } from "@/lib/search";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const RECENT_KEY = "ustaadpro_recent_searches";
const SERVICE_POPULAR = ["AC repair", "Electrician", "Plumber", "Home cleaning", "Painter"];
const SHOP_POPULAR = [
  { label: "Paint", category: "Paints" },
  { label: "Drill", query: "drill" },
  { label: "Tools", category: "Tools" },
  { label: "Hardware", category: "Hardware" },
  { label: "Brush", query: "brush" },
];
const SERVICE_CATEGORIES = [
  ["all", "All services"], ["ac-services", "AC services"], ["electrician", "Electrician"],
  ["plumbers", "Plumbing"], ["home-cleaning", "Cleaning"], ["painters", "Painting"],
];
const SHOP_CATEGORIES = [["all", "All products"], ["Paints", "Paints"], ["Tools", "Tools"], ["Hardware", "Hardware"]];

type Scope = "service" | "shop_product";
type Result = SearchResult;

function imageUrl(result: Result) {
  const source = result.image_url || result.imageUrl;
  if (!source) return "";
  return source.startsWith("http") ? source : `${API_BASE}${source.startsWith("/") ? source : `/${source}`}`;
}

function levenshtein(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

function correctionFor(query: string, candidates: string[]) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3 || candidates.some((item) => item.toLowerCase() === normalized)) return "";
  const singleWords = candidates.filter((item) => !item.includes(" "));
  let changed = false;
  const corrected = normalized.split(/\s+/).map((word) => {
    if (word.length < 3 || singleWords.some((item) => item.toLowerCase() === word)) return word;
    const closest = singleWords
      .map((item) => ({ item, distance: levenshtein(word, item.toLowerCase()) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const threshold = word.length <= 3 ? 1 : 2;
    if (!closest || closest.distance > threshold) return word;
    changed = true;
    return closest.item.toLowerCase();
  });
  return changed ? corrected.join(" ") : "";
}

export function UniversalSearch({ mobile = false, onNavigate, defaultScope = "service" }: { mobile?: boolean; onNavigate?: () => void; defaultScope?: Scope }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<Result[]>([]);
  const [apiVocabulary, setApiVocabulary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  });
  const rootRef = useRef<HTMLDivElement>(null);

  const popular = scope === "service" ? SERVICE_POPULAR : SHOP_POPULAR.map((item) => item.label);
  const categories = scope === "service" ? SERVICE_CATEGORIES : SHOP_CATEGORIES;

  useEffect(() => {
    if (!open || mobile) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [mobile, open]);

  useEffect(() => {
    let active = true;
    getSearchVocabulary(scope)
      .then((terms) => { if (active) setApiVocabulary(terms); })
      .catch(() => { if (active) setApiVocabulary([]); });
    return () => { active = false; };
  }, [scope]);

  useEffect(() => {
    const value = query.trim();
    if (!value) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const found = scope === "service"
          ? await searchServicesFromApi(value, category, controller.signal)
          : category !== "all"
            ? await searchProductsByCategory(category, controller.signal)
            : await searchSuggestions(value, scope, controller.signal);
        if (!controller.signal.aborted) setResults(found);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [category, query, scope]);

  useEffect(() => {
    if (!pathname.startsWith("/store")) return;
    window.dispatchEvent(new CustomEvent("ustaadpro:shop-search", {
      detail: {
        query: scope === "shop_product" && category === "all" ? query : "",
        category: scope === "shop_product" ? category : "all",
      },
    }));
  }, [category, pathname, query, scope]);

  useEffect(() => {
    if (!pathname.startsWith("/store")) return;
    const reset = () => {
      setQuery("");
      setCategory("all");
      setResults([]);
    };
    window.addEventListener("ustaadpro:shop-search-reset", reset);
    return () => window.removeEventListener("ustaadpro:shop-search-reset", reset);
  }, [pathname]);

  const visibleResults = useMemo(() => {
    if (category === "all") return results.slice(0, 30);
    return [...results].sort((left, right) => {
      const leftCategory = left.resultType === "service" ? left.category_id : left.category;
      const rightCategory = right.resultType === "service" ? right.category_id : right.category;
      return Number(rightCategory === category) - Number(leftCategory === category);
    }).slice(0, 30);
  }, [category, results]);

  const correctionCandidates = useMemo(() => [
    ...apiVocabulary,
    ...popular,
    ...categories.slice(1).map((item) => item[1]),
    ...results.map((result) => result.title).filter((title): title is string => Boolean(title)),
  ], [apiVocabulary, categories, popular, results]);
  const correction = correctionFor(query, correctionCandidates);

  function remember(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    const next = [cleaned, ...recent.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  }

  function runSearch(value: string) {
    setQuery(value);
    setCategory("all");
    setOpen(true);
    remember(value);
  }

  function submitSearch() {
    const value = query.trim();
    if (!value) return;
    setQuery(value);
    setOpen(false);
    remember(value);
    if (scope === "service") {
      router.push(`/services?search=${encodeURIComponent(value)}`);
      onNavigate?.();
    }
  }

  function runPopularSearch(label: string) {
    if (scope !== "shop_product") {
      runSearch(label);
      return;
    }
    const item = SHOP_POPULAR.find((entry) => entry.label === label);
    setQuery(item?.query || label);
    setCategory(item?.category || "all");
    setOpen(true);
    remember(label);
  }

  function selectScope(next: Scope) {
    setScope(next);
    setCategory("all");
    setResults([]);
  }

  const panel = open ? (
    <div className={cn(
      "border border-slate-200 bg-white text-left shadow-2xl",
      mobile
        ? "mt-3 isolate overflow-hidden rounded-[24px] [clip-path:inset(0_round_24px)]"
        : "fixed left-1/2 top-24 z-[100] isolate w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[28px] [clip-path:inset(0_round_28px)]",
    )}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => selectScope("service")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition", scope === "service" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600")}><Wrench className="h-4 w-4" />Services</button>
          <button type="button" onClick={() => selectScope("shop_product")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition", scope === "shop_product" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600")}><ShoppingBag className="h-4 w-4" />Shop</button>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close search"><X className="h-4 w-4" /></button>
      </div>

      {correction ? (
        <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          Did you mean{" "}
          <button type="button" onClick={() => runSearch(correction)} className="font-black underline decoration-amber-400 underline-offset-2">{correction}</button>?
        </div>
      ) : null}

      <div className={cn(
        "search-results-scrollbar grid gap-0 overflow-y-auto overscroll-contain",
        mobile ? "max-h-[65vh] grid-cols-1" : "max-h-[calc(100vh-11rem)] grid-cols-[280px_1fr]",
      )}>
        <aside className="border-b border-slate-100 bg-slate-50/70 p-4 md:border-b-0 md:border-r">
          <SearchGroup icon={Sparkles} title="Popular searches">
            <div className="flex flex-wrap gap-2">{popular.map((item) => <button key={item} type="button" onClick={() => runPopularSearch(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">{item}</button>)}</div>
          </SearchGroup>

          <SearchGroup icon={Grid2X2} title="Categories">
            <div className="grid grid-cols-2 gap-2">{categories.map(([id, title]) => <button key={id} type="button" onClick={() => { setCategory(id); setQuery(id === "all" ? "" : title); setResults([]); if (id !== "all") remember(title); }} className={cn("rounded-xl border px-2 py-2 text-xs font-bold transition", category === id ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200")}>{title}</button>)}</div>
          </SearchGroup>

          {recent.length ? <SearchGroup icon={Clock3} title="Recent searches">
            <div className="space-y-1">{recent.map((item) => <button key={item} type="button" onClick={() => runSearch(item)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-white hover:text-emerald-700"><Clock3 className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{item}</span></button>)}</div>
          </SearchGroup> : null}
        </aside>

        <section className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">{scope === "service" ? "Services" : "Shop products"}</p><h3 className="mt-1 font-black text-slate-900">{query.trim() ? `Results for “${query.trim()}”` : "Start typing to search"}</h3></div>
            {query.trim() ? <span className="text-xs font-bold text-slate-400">{loading ? "Searching…" : `${visibleResults.length} shown`}</span> : null}
          </div>
          {loading ? <ResultSkeleton /> : visibleResults.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleResults.map((result) => {
                const isService = result.resultType === "service";
                const href = isService ? `/services/${result.id}` : `/store/${result.id}`;
                const image = imageUrl(result);
                return <Link key={result.suggestionId || `${scope}-${result.id}`} href={href} onClick={() => { remember(query); setOpen(false); onNavigate?.(); }} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
                  <div className="relative aspect-[4/3] bg-slate-100">{image ? <Image src={image} alt={result.title || "Search result"} fill unoptimized sizes="220px" className="object-cover transition group-hover:scale-105" /> : <Search className="absolute inset-0 m-auto h-7 w-7 text-slate-300" />}</div>
                  <div className="p-3"><p className="line-clamp-2 text-sm font-black text-slate-900">{result.title || "Untitled result"}</p><p className="mt-2 text-sm font-black text-emerald-700">Rs {Number(result.price || 0).toLocaleString("en-PK")}</p></div>
                </Link>;
              })}
            </div>
          ) : query.trim() ? <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"><div><Search className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No matching {scope === "service" ? "services" : "products"} found.</p></div></div> : <div className="flex min-h-48 items-center justify-center rounded-2xl bg-emerald-50/60 text-center"><div><Search className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-bold text-emerald-900">Search across Ustaad Pro</p><p className="mt-1 text-xs text-emerald-700">Choose Services or Shop, then type what you need.</p></div></div>}
        </section>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative", mobile ? "w-full" : "hidden min-w-0 flex-1 lg:block")}>
      <form onSubmit={(event) => { event.preventDefault(); submitSearch(); }} className="flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input value={query} onFocus={() => setOpen(true)} onChange={(event) => { const value = event.target.value; setQuery(value); setOpen(true); setCategory("all"); if (!value.trim()) { setResults([]); setLoading(false); } }} placeholder={`Search ${scope === "service" ? "services" : "shop"}…`} className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" aria-label="Search Ustaad Pro" />
        <button type="button" onClick={() => selectScope(scope === "service" ? "shop_product" : "service")} className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-600">{scope === "service" ? "Services" : "Shop"}</button>
      </form>
      {panel}
    </div>
  );
}

function SearchGroup({ icon: Icon, title, children }: { icon: typeof Search; title: string; children: React.ReactNode }) {
  return <div className="mb-5 last:mb-0"><h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500"><Icon className="h-3.5 w-3.5 text-emerald-600" />{title}</h3>{children}</div>;
}

function ResultSkeleton() {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Searching"><span className="sr-only">Searching…</span>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-5 w-24" /></div></div>)}</div>;
}
