"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchSuggestions, type SearchResult } from "@/lib/search";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function imageSource(result: SearchResult) {
  const source = result.imageUrl || result.image_url;
  if (!source) return null;
  return source.startsWith("http") ? source : `${API_BASE}${source}`;
}

function SuggestionItem({ result }: { result: SearchResult }) {
  const isProduct = result.resultType === "shop_product";
  const href = isProduct ? `/store/${result.id}` : `/services/${result.id}`;
  const image = imageSource(result);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image src={image} alt="" fill unoptimized sizes="64px" className="object-cover" />
        ) : (
          <Search className="absolute inset-0 m-auto h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-slate-900">{result.title}</p>
        <p className="text-sm font-semibold text-slate-600">
          Rs {Number(result.price || 0).toLocaleString()}
        </p>
      </div>
      <span className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-white ${isProduct ? "bg-blue-600" : "bg-emerald-600"}`}>
        {isProduct ? "View product" : "Book service"}
      </span>
    </Link>
  );
}

export function SearchSuggestions({
  query,
  scope = "all",
}: {
  query: string;
  scope?: "all" | "service" | "shop_product";
  services?: unknown;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null);
  const [dismissedQuery, setDismissedQuery] = useState("");
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const remote = await searchSuggestions(value, scope, controller.signal);
        setResults(remote);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const updatePosition = () => {
      const parent = markerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const viewportPadding = 12;
      const desiredWidth = scope === "shop_product" ? Math.max(rect.width, 560) : rect.width;
      const width = Math.min(desiredWidth, window.innerWidth - viewportPadding * 2);
      const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
      setPosition({ left, top: rect.bottom + 8, width });
    };
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [query, scope]);

  useEffect(() => {
    const closeOnSubmit = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const parent = markerRef.current?.parentElement;
      if (parent?.contains(document.activeElement)) setDismissedQuery(query);
    };
    document.addEventListener("keydown", closeOnSubmit);
    return () => document.removeEventListener("keydown", closeOnSubmit);
  }, [query]);

  if (query.trim().length < 2 || dismissedQuery === query) return null;

  const services = results.filter((result) => result.resultType === "service");
  const products = results.filter((result) => result.resultType === "shop_product");

  const dropdown = position ? (
    <div
      className="fixed z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl ring-1 ring-slate-950/5"
      style={{ left: position.left, top: position.top, width: position.width }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Search suggestions</p>
        <button
          type="button"
          onClick={() => setDismissedQuery(query)}
          className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close search suggestions"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="search-results-scrollbar max-h-[32rem] overflow-y-auto p-1.5 pr-2">
      {loading ? (
        <div className="space-y-2 p-2" role="status" aria-label="Searching">
          <span className="sr-only">Searching…</span>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      ) : results.length ? (
        <div className="space-y-3">
          {services.length ? (
            <section>
              <h3 className="px-2.5 pb-1.5 pt-1 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Services
              </h3>
              <div className="space-y-1">
                {services.map((result) => <SuggestionItem key={result.suggestionId || `service-${result.id}-${result.title}`} result={result} />)}
              </div>
            </section>
          ) : null}

          {products.length ? (
            <section className={services.length ? "border-t border-slate-200 pt-2" : ""}>
              <h3 className="px-2.5 pb-1.5 pt-1 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Shop Products
              </h3>
              <div className="space-y-1">
                {products.map((result) => <SuggestionItem key={`product-${result.id}`} result={result} />)}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No matching results found.</p>
      )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <span ref={markerRef} className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
