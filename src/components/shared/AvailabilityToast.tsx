"use client";

import { useEffect, useState } from "react";
import { Flame, MapPin, X } from "lucide-react";

export function AvailabilityToast({ kind, title, limited = false }: {
  kind: "service" | "product";
  title: string;
  limited?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 900);
    const hideTimer = window.setTimeout(() => setVisible(false), 8500);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside role="status" className="fixed bottom-24 left-1/2 z-[75] w-[min(380px,calc(100vw-24px))] -translate-x-1/2 animate-in slide-in-from-bottom-3 fade-in rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-2xl sm:bottom-24 sm:left-auto sm:right-6 sm:translate-x-0">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${limited ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
          {limited ? <Flame className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-black uppercase tracking-[0.14em] ${limited ? "text-amber-700" : "text-emerald-700"}`}>{limited ? "Selling fast" : "Available near you"}</p>
          <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{limited ? "Limited availability—order soon to avoid missing out." : `${kind === "service" ? "Book this service" : "Order for delivery"} in Rawalpindi or Islamabad.`}</p>
        </div>
        <button type="button" onClick={() => setVisible(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss notice"><X className="h-4 w-4" /></button>
      </div>
    </aside>
  );
}
