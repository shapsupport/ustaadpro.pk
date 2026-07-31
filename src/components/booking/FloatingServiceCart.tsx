"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import BookingModal from "./BookingModal";
import { useServiceCart } from "@/context/ServiceCartContext";

export default function FloatingServiceCart() {
  const { items, total, updateQuantity, removeService, clearServices } = useServiceCart();
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  if (!items.length) return null;

  return <>
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-24 sm:right-6">
      {open && <div className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div><p className="font-black text-slate-950">Service cart</p><p className="text-xs text-slate-500">{items.length} selected service{items.length === 1 ? "" : "s"}</p></div>
          <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close service cart"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
          {items.map((item) => <div key={item.key} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.selectedWorkTitle || item.title}</p><p className="text-xs text-slate-500">Rs {item.price.toLocaleString()} each</p></div>
            <div className="flex items-center rounded-lg border border-slate-200">
              <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="grid h-8 w-8 place-items-center" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
              <span className="w-7 text-center text-xs font-black">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="grid h-8 w-8 place-items-center" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
            </div>
            <button onClick={() => removeService(item.key)} className="p-1.5 text-slate-400 hover:text-red-500" aria-label="Remove service"><Trash2 className="h-4 w-4" /></button>
          </div>)}
        </div>
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex justify-between text-sm"><span className="text-slate-500">Listed total</span><strong>Rs {total.toLocaleString()}</strong></div>
          <button onClick={() => { setOpen(false); setCheckoutOpen(true); }} className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white">Book all services</button>
        </div>
      </div>}
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-full bg-slate-950 px-4 py-3 text-white shadow-2xl" aria-label="Open service cart">
        <span className="relative"><ShoppingBag className="h-5 w-5" /><span className="absolute -right-2.5 -top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-black">{items.length}</span></span>
        <span className="text-sm font-bold">Rs {total.toLocaleString()}</span>
      </button>
    </div>
    <BookingModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} onBookingComplete={clearServices} service={items[0]} services={items} />
  </>;
}
