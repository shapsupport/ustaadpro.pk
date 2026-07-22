"use client";

import { whatsappUrl } from "@/lib/constants";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M16 3C8.82 3 3 8.65 3 15.62c0 2.44.72 4.72 1.96 6.65L3.6 29l6.94-1.32A13.27 13.27 0 0 0 16 28.86c7.18 0 13-5.65 13-12.62S23.18 3 16 3Z" />
      <path fill="#25D366" d="M23.52 19.42c-.4-.2-2.32-1.12-2.68-1.25-.36-.13-.62-.2-.88.2-.26.39-1.01 1.25-1.24 1.51-.23.26-.46.3-.85.1-2.3-1.11-3.8-1.98-5.32-4.49-.4-.68.4-.63 1.15-2.1.13-.26.07-.49-.03-.69-.1-.2-.88-2.06-1.21-2.82-.32-.76-.65-.66-.88-.67h-.75c-.26 0-.69.1-1.05.49-.36.39-1.37 1.3-1.37 3.17s1.4 3.68 1.6 3.94c.2.26 2.75 4.08 6.66 5.72.93.39 1.66.63 2.22.8.93.29 1.78.25 2.45.15.75-.11 2.32-.92 2.65-1.81.33-.89.33-1.64.23-1.81-.1-.17-.36-.26-.75-.46Z" />
    </svg>
  );
}

export function WhatsAppBot() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book a service on WhatsApp"
      className="group fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_16px_45px_rgba(18,140,126,0.4)] active:scale-95 sm:h-16 sm:w-16"
    >
      {/* Animated pulse */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-25 animate-ping" />

      <WhatsAppIcon className="relative h-8 w-8 sm:h-9 sm:w-9" />

      <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-md after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900">
        Book Now
      </span>
    </a>
  );
}
