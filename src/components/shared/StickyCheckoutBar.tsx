"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";

interface StickyCheckoutBarProps {
  visible: boolean;
  href: string;
  label: string;
  title: string;
  price: string;
  tone?: "primary" | "lime";
  disabled?: boolean;
  quantity?: number;
  maxQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
}

export function StickyCheckoutBar({
  visible,
  href,
  label,
  title,
  price,
  tone = "primary",
  disabled = false,
  quantity,
  maxQuantity,
  onQuantityChange,
}: StickyCheckoutBarProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 sm:px-6 sm:py-4 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-nowrap">
        <div className="flex min-w-0 basis-full items-center gap-3 sm:flex-1 sm:basis-auto sm:gap-5">
          <div className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md sm:flex ${
            tone === "lime" ? "bg-lime-500" : "bg-primary"
          }`}>
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
              Your selection
            </p>
            <p className="truncate text-sm font-bold text-slate-800 sm:text-base">{title}</p>
            <p className="text-base font-black text-slate-950 sm:hidden">{price}</p>
          </div>
          <div className="ml-auto hidden shrink-0 border-l border-slate-200 pl-6 pr-4 sm:block lg:pr-8">
            <p className="text-xs font-medium text-slate-400">Total price</p>
            <p className="text-xl font-black text-slate-950">{price}</p>
          </div>
        </div>
        {quantity !== undefined && onQuantityChange && (
          <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <button type="button" onClick={() => onQuantityChange(quantity - 1)} disabled={quantity <= 1} className="grid h-11 w-10 place-items-center hover:bg-slate-200 disabled:opacity-30" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
            <span className="grid h-11 min-w-10 place-items-center border-x border-slate-200 bg-white font-black">{quantity}</span>
            <button type="button" onClick={() => onQuantityChange(quantity + 1)} disabled={Boolean(maxQuantity && quantity >= maxQuantity)} className="grid h-11 w-10 place-items-center hover:bg-slate-200 disabled:opacity-30" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-end">
          <Link
            href={href}
            tabIndex={visible && !disabled ? 0 : -1}
            aria-disabled={disabled}
            onClick={(event) => disabled && event.preventDefault()}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-lg transition-all sm:min-w-48 sm:px-7 sm:py-4 sm:text-base ${
              disabled
                ? "cursor-not-allowed bg-slate-300 shadow-none"
                : tone === "lime"
                ? "bg-gradient-to-r from-lime-500 to-emerald-600 shadow-lime-500/30 hover:from-lime-600 hover:to-emerald-700"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            {label}
            <ArrowRight className="hidden h-5 w-5 sm:block" />
          </Link>
        </div>
      </div>
    </div>
  );
}
