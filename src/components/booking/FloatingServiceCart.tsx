"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import BookingModal from "./BookingModal";
import { useServiceCart } from "@/context/ServiceCartContext";

export default function FloatingServiceCart() {
  const { items, total, updateQuantity, removeService, clearServices } = useServiceCart();
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const collapseCart = (event: PointerEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) setOpen(false);
    };
    const collapseOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", collapseCart);
    document.addEventListener("keydown", collapseOnEscape);
    return () => {
      document.removeEventListener("pointerdown", collapseCart);
      document.removeEventListener("keydown", collapseOnEscape);
    };
  }, [open]);
  if (!items.length) return null;

  return <>
    {!checkoutOpen && <div ref={cartRef} className="fixed bottom-20 right-3 z-40 flex flex-col items-end sm:bottom-24 sm:right-6">
      {open && <div className="mb-3 flex max-h-[66vh] w-[calc(100vw-1.5rem)] max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/5 sm:max-h-[70vh]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><ShoppingBag className="h-5 w-5" /></span>
            <div><p className="text-lg font-black text-slate-950">Your service cart</p><p className="mt-0.5 text-xs text-slate-500">{items.length} selected service{items.length === 1 ? "" : "s"} · Edit before checkout</p></div>
          </div>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-100" aria-label="Close service cart"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-slate-50/70 p-3 booking-modal-scrollbar sm:p-4">
          {items.map((item, index) => <article key={item.key} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">{index + 1}</span>
              <div className="min-w-0 flex-1"><p className="text-base font-black leading-5 text-slate-900">{item.selectedWorkTitle || item.title}</p><p className="mt-1 text-xs text-slate-500">Rs {item.price.toLocaleString("en-PK")} per service</p></div>
              <button onClick={() => removeService(item.key)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <button onClick={() => updateQuantity(item.key, item.quantity - 1)} disabled={item.quantity <= 1} className="grid h-10 w-10 place-items-center text-slate-600 hover:bg-white disabled:opacity-30" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <span className="grid h-10 w-10 place-items-center border-x border-slate-200 bg-white text-sm font-black">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= 10} className="grid h-10 w-10 place-items-center text-slate-600 hover:bg-white disabled:opacity-30" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Line total</p><p className="text-lg font-black text-slate-900">Rs {(item.price * item.quantity).toLocaleString("en-PK")}</p></div>
            </div>
          </article>)}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Combined service subtotal</p><p className="mt-1 text-[11px] text-slate-500">Final fees and tax appear before payment</p></div><strong className="shrink-0 text-xl font-black text-slate-950">Rs {total.toLocaleString("en-PK")}</strong></div>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button type="button" onClick={clearServices} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">Clear</button>
            <button onClick={() => { setOpen(false); setCheckoutOpen(true); }} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">Review & book all <ArrowRight className="h-4 w-4" /></button>
          </div>
        </footer>
      </div>}

      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3.5 text-white shadow-2xl ring-1 ring-white/10" aria-label="Open service cart">
        <span className="relative"><ShoppingBag className="h-5 w-5" /><span className="absolute -right-2.5 -top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-black">{items.length}</span></span>
        <span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Service cart</span><span className="block text-sm font-black">Rs {total.toLocaleString("en-PK")}</span></span>
      </button>
    </div>}
    <BookingModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} onBookingComplete={clearServices} service={items[0]} services={items} />
  </>;
}
