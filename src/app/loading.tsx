"use client";

import { useEffect, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  const [takingLonger, setTakingLonger] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLonger(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-slate-50" role="status" aria-live="polite" aria-label="Loading page">
      <span className="sr-only">{takingLonger ? "Thank you for your patience. This page is still loading." : "Loading page."}</span>

      <div className="border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-2xl">
            <Skeleton className="h-4 w-28 bg-emerald-200/70" />
            <Skeleton className="mt-5 h-10 w-full max-w-xl sm:h-12" />
            <Skeleton className="mt-3 h-5 w-full max-w-lg" />
            <Skeleton className="mt-2 h-5 w-4/5 max-w-md" />
            <div className="mt-6 flex gap-3"><Skeleton className="h-11 w-36" /><Skeleton className="h-11 w-28" /></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {takingLonger && (
          <div className="mb-7 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg shadow-emerald-900/5 sm:flex sm:items-center sm:gap-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Clock3 className="h-5 w-5 animate-pulse" />
            </div>
            <div className="mt-3 sm:mt-0">
              <p className="flex items-center gap-2 font-black text-slate-900">Thanks for your patience <Sparkles className="h-4 w-4 text-amber-500" /></p>
              <p className="mt-1 text-sm leading-5 text-slate-600">We’re preparing the latest information for you. It’s taking a little longer than usual, but this page should be ready shortly.</p>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="p-4 sm:p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-6 w-4/5" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-5 flex items-center justify-between"><Skeleton className="h-8 w-28" /><Skeleton className="h-10 w-24" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
