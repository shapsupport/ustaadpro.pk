import { Apple, Play } from "lucide-react";
import { appLinks } from "@/lib/constants";

export function AppStoreButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row"} gap-3`}>
      <a
        href={appLinks.googlePlay}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find Ustaad Pro on Google Play"
        className="inline-flex min-w-40 items-center gap-3 rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900"
      >
        <Play className="h-7 w-7 fill-current" />
        <span><small className="block text-[9px] uppercase tracking-wider text-slate-400">Get it on</small><strong className="block text-sm leading-4">Google Play</strong></span>
      </a>
      <a
        href={appLinks.appStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find Ustaad Pro on the Apple App Store"
        className="inline-flex min-w-40 items-center gap-3 rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900"
      >
        <Apple className="h-7 w-7 fill-current" />
        <span><small className="block text-[9px] uppercase tracking-wider text-slate-400">Download on the</small><strong className="block text-sm leading-4">App Store</strong></span>
      </a>
    </div>
  );
}
