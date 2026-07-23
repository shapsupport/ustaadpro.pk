"use client";

import { PhoneCall } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/constants";

export function CallNowButton() {
  const pathname = usePathname();
  const telephone = siteConfig.phone.replace(/\s+/g, "");
  const isShop = pathname.startsWith("/store");
  const isService = pathname.startsWith("/services");
  const label = isShop ? "Call to buy product" : isService ? "Call to book now" : "Call Ustaad Pro";

  return (
    <a
      href={`tel:${telephone}`}
      aria-label={`${label} at ${siteConfig.phone}`}
      className="group fixed bottom-6 right-20 z-[80] flex h-12 items-center gap-2 rounded-full bg-slate-950 px-3 text-white shadow-[0_12px_35px_rgba(15,23,42,0.3)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 sm:right-24 sm:h-14 sm:px-4"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 sm:h-9 sm:w-9">
        <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <span className="pr-1">
        <strong className="block whitespace-nowrap text-[11px] font-black sm:text-sm">{label}</strong>
        <span className="hidden text-[10px] text-slate-300 sm:block">{siteConfig.phone}</span>
      </span>
    </a>
  );
}
