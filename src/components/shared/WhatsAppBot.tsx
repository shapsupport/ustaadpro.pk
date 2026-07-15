"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppBot() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WA_NUM;
  const message = encodeURIComponent(
    "Hi Ustaad Pro, I want to book a service."
  );
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book a service on WhatsApp"
      className="group fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_16px_45px_rgba(18,140,126,0.4)] active:scale-95 sm:h-16 sm:w-16"
    >
      {/* Animated pulse */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-25 animate-ping" />

      {/* Chat Icon */}
      <MessageCircle className="relative h-7 w-7 sm:h-8 sm:w-8" />

      {/* Tooltip */}
      <span className="pointer-events-none absolute right-20 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white opacity-0 translate-x-2 shadow-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        Book a service on WhatsApp
      </span>
    </a>
  );
}