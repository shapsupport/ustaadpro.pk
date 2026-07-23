"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartCheckoutModal from "./CartCheckoutModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click (only when dropdown is open)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    onClose();
    window.setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
    <>
      {/* ── Cart Dropdown (rendered when isOpen) ── */}
      {isOpen && (
        <>
          {/* Invisible backdrop */}
          {/* <div
            className="fixed inset-0 z-30"
            aria-hidden="true"
            onClick={onClose}
          /> */}

          {/* Dropdown Panel */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full z-40 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-lime-600" />
                <span className="font-bold text-slate-900">Cart</span>
                {items.length > 0 && (
                  <span className="rounded-full bg-lime-500 px-2 py-0.5 text-xs font-bold text-white">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <ShoppingBag className="h-7 w-7 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">Your cart is empty</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add products from the store to get started.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 booking-modal-scrollbar">
                  {items.map((item) => {
                    const imgSrc = buildImageUrl(item.product.imageUrl);
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* Image */}
                        <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.product.title}
                              width={48}
                              height={48}
                              unoptimized
                              className="h-12 w-12 object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-slate-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(item.product.price)} each
                          </p>

                          {/* Quantity Controls */}
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.product.stock}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Price + Remove */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <p className="text-sm font-black text-slate-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">
                      Subtotal
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Checkout — {formatPrice(subtotal)}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Checkout Modal ── */}
      <CartCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
