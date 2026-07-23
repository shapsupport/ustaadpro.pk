"use client";

import { useState } from "react";
import { Bot, MessageCircle, PhoneCall } from "lucide-react";
import { siteConfig, whatsappBotUrl, whatsappCallUrl } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M16 3C8.82 3 3 8.65 3 15.62c0 2.44.72 4.72 1.96 6.65L3.6 29l6.94-1.32A13.27 13.27 0 0 0 16 28.86c7.18 0 13-5.65 13-12.62S23.18 3 16 3Z" />
      <path fill="#25D366" d="M23.52 19.42c-.4-.2-2.32-1.12-2.68-1.25-.36-.13-.62-.2-.88.2-.26.39-1.01 1.25-1.24 1.51-.23.26-.46.3-.85.1-2.3-1.11-3.8-1.98-5.32-4.49-.4-.68.4-.63 1.15-2.1.13-.26.07-.49-.03-.69-.1-.2-.88-2.06-1.21-2.82-.32-.76-.65-.66-.88-.67h-.75c-.26 0-.69.1-1.05.49-.36.39-1.37 1.3-1.37 3.17s1.4 3.68 1.6 3.94c.2.26 2.75 4.08 6.66 5.72.93.39 1.66.63 2.22.8.93.29 1.78.25 2.45.15.75-.11 2.32-.92 2.65-1.81.33-.89.33-1.64.23-1.81-.1-.17-.36-.26-.75-.46Z" />
    </svg>
  );
}

export function WhatsAppBot() {
  const [showDesktopNumber, setShowDesktopNumber] = useState(false);
  const telephone = siteConfig.phone.replace(/\s+/g, "");

  function handlePhoneCall() {
    const canCallDirectly =
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (canCallDirectly) {
      window.location.href = `tel:${telephone}`;
      return;
    }

    setShowDesktopNumber(true);
  }

  return (
    <Dialog onOpenChange={(open) => !open && setShowDesktopNumber(false)}>
      <DialogTrigger
        className="group fixed bottom-6 right-6 z-[80] flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-3 text-white shadow-[0_12px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(18,140,126,0.4)] active:translate-y-0 sm:h-16 sm:px-4"
        aria-label="Book now: choose phone, WhatsApp call, or booking bot"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-ping" />
        <WhatsAppIcon className="relative h-8 w-8 sm:h-9 sm:w-9" />
        <strong className="relative whitespace-nowrap pr-1 text-sm sm:text-base">Book Now</strong>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-3xl border-0 p-7 shadow-2xl sm:p-8">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-black text-slate-950">
            How would you like to book?
          </DialogTitle>
          <DialogDescription>
            Choose the fastest way to connect with Ustaad Pro.
          </DialogDescription>
        </DialogHeader>

        {showDesktopNumber ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center sm:p-9">
            <span className="text-sm font-semibold text-emerald-800">Call us at</span>
            <a
              href={`tel:${telephone}`}
              className="mt-3 block whitespace-nowrap text-2xl font-black tabular-nums tracking-[0.12em] text-slate-950 sm:text-4xl sm:tracking-[0.16em]"
            >
              {siteConfig.phone}
            </a>
            <p className="mt-3 text-xs text-slate-600">
              Dial this number from your mobile phone to book your service.
            </p>
            <button
              type="button"
              onClick={() => setShowDesktopNumber(false)}
              className="mt-5 text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              Back to booking options
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={handlePhoneCall}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                <PhoneCall className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm text-slate-950">Call on cell phone</strong>
                <span className="text-xs text-slate-500">{siteConfig.phone}</span>
              </span>
            </button>

            <a
              href={whatsappCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <span>
                <strong className="block text-sm text-slate-950">Call on WhatsApp</strong>
                <span className="text-xs text-slate-500">Request a WhatsApp call from our team</span>
              </span>
            </a>

            <a
              href={whatsappBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-400 hover:bg-emerald-100"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                <Bot className="h-6 w-6" />
                <MessageCircle className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5 text-emerald-700" />
              </span>
              <span>
                <strong className="block text-sm text-slate-950">Chat with booking bot</strong>
                <span className="text-xs text-slate-500">Recommended for faster booking</span>
              </span>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
