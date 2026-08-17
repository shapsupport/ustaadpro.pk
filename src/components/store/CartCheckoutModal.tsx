"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  MapPin,
  Map as MapIcon,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  ShoppingCart,
  Package,
  ShoppingBag,
} from "lucide-react";
import { checkoutShopOrder } from "@/services/shopService";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import MapAddressPickerModal from "../location/MapAddressPickerModal";
import { showSuccessToast } from "@/context/ToastContext";
import { PAKISTAN_CITIES } from "@/data/pakistanCities";
import { DEFAULT_SETTINGS } from "@/app/checkout/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

type AddressField = "city" | "house" | "street" | "area";

const addressMessages: Record<AddressField, string> = {
  city: "Please select your city.",
  house: "Please enter a house, flat or building number.",
  street: "Please enter your street or road.",
  area: "Please enter your area, sector or locality.",
};

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
}: CartCheckoutModalProps) {
  const { user, setAuthModalMode } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [house, setHouse] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mapAddress, setMapAddress] = useState("");
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(DEFAULT_SETTINGS.shippingCost);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    total: number;
  } | null>(null);

  // Portal mount guard (avoids SSR "document is not defined" issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the page behind the checkout fixed without causing a scrollbar-width
  // layout jump. The modal itself owns the only active vertical scrollbar.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  // Shipping is configured by the API and can be changed without a frontend deploy.
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setShippingLoading(true);
    fetch(`${API_BASE_URL}/api/settings`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load shipping fee");
        const settings = await response.json() as { shippingCost?: number | string };
        const apiShippingCost = Number(settings.shippingCost);
        if (!Number.isFinite(apiShippingCost) || apiShippingCost < 0) {
          throw new Error("Invalid shipping fee");
        }
        setShippingCost(apiShippingCost);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        // Match the checkout page's safe fallback if settings are temporarily unavailable.
        setShippingCost(DEFAULT_SETTINGS.shippingCost);
      })
      .finally(() => {
        if (!controller.signal.aborted) setShippingLoading(false);
      });
    return () => controller.abort();
  }, [isOpen]);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Auth check
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("ustaadpro_token")
        : null;
    if (!user || !token) {
      setError("Please sign in to complete your order.");
      setAuthModalMode("login");
      return;
    }

    // Cart check
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // Field validation
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    const addressValues: Record<AddressField, string> = { city, house, street, area };
    const missingField = (Object.keys(addressValues) as AddressField[]).find(
      (field) => !addressValues[field].trim()
    );
    if (missingField) {
      setTouched({ city: true, house: true, street: true, area: true });
      setError(addressMessages[missingField]);
      return;
    }

    const addressValue = [
      `House/Building: ${house.trim()}`,
      `Street/Road: ${street.trim()}`,
      `Area: ${area.trim()}`,
      `City: ${city}`,
      instructions.trim() ? `Instructions: ${instructions.trim()}` : "",
      mapAddress ? `Map location: ${mapAddress}` : "",
    ].filter(Boolean).join(" | ");

    setLoading(true);
    try {
      const response = await checkoutShopOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        address: `Name: ${name.trim()} | Phone: ${phone.trim()} | ${addressValue}`,
        paymentMethod: "Cash on Delivery",
        useRewardPoints: false,
      });

      if (response?.order) {
        const purchasedProducts =
          items.length === 1
            ? items[0].product.title
            : `${items[0].product.title} and ${items.length - 1} other product${items.length > 2 ? "s" : ""}`;
        setOrderSuccess({
          orderId: response.order.id,
          total: response.order.total,
        });
        showSuccessToast(`${purchasedProducts} ${items.length === 1 ? "has" : "have"} been bought successfully.`);
        clearCart();
      } else {
        throw new Error("Failed to receive order confirmation.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not place order. Please try again.";
      const isSessionError =
        msg.includes("session") ||
        msg.includes("sign in") ||
        msg.includes("401");
      if (isSessionError) {
        setAuthModalMode("login");
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setError("");
    setTouched({});
    onClose();
  };

  const fieldError = (field: AddressField, value: string) =>
    touched[field] && !value.trim() ? addressMessages[field] : "";
  const inputClass = (invalid: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${invalid ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`;
  const displayedTotal = subtotal + shippingCost;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all sm:rounded-3xl">
          <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain booking-modal-scrollbar sm:max-h-[94dvh]">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Checkout
              </h2>
              <p className="text-xs font-bold text-lime-600">
                {items.length} item{items.length !== 1 ? "s" : ""} •{" "}
                {shippingLoading ? "Calculating total…" : formatPrice(displayedTotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Screen */}
          {orderSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Order Placed!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your order has been received. Our team will contact you shortly to
                confirm delivery details.
              </p>

              <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Order Reference ID
                </p>
                <p className="break-all text-xl font-black text-emerald-700 sm:text-2xl">
                  {orderSuccess.orderId}
                </p>
                <p className="text-xs font-bold text-slate-700 pt-1">
                  Total Payable:{" "}
                  <span className="text-emerald-700">
                    {formatPrice(orderSuccess.total)}
                  </span>
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Payment: Cash on Delivery
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                Done & Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="on" className="p-4 sm:p-5 space-y-3">
              {/* Auth Notice */}
              {!user && (
                <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Sign in required to place your order.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex items-center gap-1 shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700 transition"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign In
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="min-w-0 break-words leading-5">{error}</span>
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ORDER SUMMARY
                </p>
                <div className="divide-y divide-slate-100 max-h-28 overflow-y-auto">
                  {items.map((item) => {
                    const imgSrc = buildImageUrl(item.product.imageUrl);
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.product.title}
                              width={40}
                              height={40}

                              className="h-10 w-10 rounded-lg object-contain p-1 [image-rendering:auto]"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 shrink-0">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5 border-t border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Product subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Shipping fee</span>
                    <span className="font-semibold">{shippingLoading ? "Loading…" : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-sm font-bold text-slate-700">Total</span>
                    <span className="text-lg font-black text-emerald-600">
                      {shippingLoading ? "—" : formatPrice(displayedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      autoComplete="shipping name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="shipping tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+923176379977"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address & Map Picker */}
              <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Delivery Address
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Pick from Map
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AddressInput label="City" error={fieldError("city", city)}>
                    <select name="city" autoComplete="shipping address-level2" value={city} onChange={(e) => { setCity(e.target.value); setTouched((old) => ({ ...old, city: true })); }} onBlur={() => setTouched((old) => ({ ...old, city: true }))} className={inputClass(Boolean(fieldError("city", city)))} aria-label="City" aria-invalid={Boolean(fieldError("city", city))}>
                      <option value="">Select city</option>
                      {PAKISTAN_CITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </AddressInput>
                  <AddressInput label="House / Flat #" error={fieldError("house", house)}>
                    <input name="address-line1" autoComplete="shipping address-line1" value={house} onChange={(e) => { setHouse(e.target.value); setTouched((old) => ({ ...old, house: true })); }} onBlur={() => setTouched((old) => ({ ...old, house: true }))} placeholder="House 12, Flat 3" className={inputClass(Boolean(fieldError("house", house)))} aria-invalid={Boolean(fieldError("house", house))} />
                  </AddressInput>
                  <AddressInput label="Street / Road" error={fieldError("street", street)}>
                    <input name="address-line2" autoComplete="shipping address-line2" value={street} onChange={(e) => { setStreet(e.target.value); setTouched((old) => ({ ...old, street: true })); }} onBlur={() => setTouched((old) => ({ ...old, street: true }))} placeholder="Street 8, Main Road" className={inputClass(Boolean(fieldError("street", street)))} aria-invalid={Boolean(fieldError("street", street))} />
                  </AddressInput>
                  <AddressInput label="Area / Sector" error={fieldError("area", area)}>
                    <input name="address-level3" autoComplete="shipping address-level3" value={area} onChange={(e) => { setArea(e.target.value); setTouched((old) => ({ ...old, area: true })); }} onBlur={() => setTouched((old) => ({ ...old, area: true }))} placeholder="Bahria Town, F-10" className={inputClass(Boolean(fieldError("area", area)))} aria-invalid={Boolean(fieldError("area", area))} />
                  </AddressInput>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-bold text-slate-600">Additional Instructions <span className="font-normal text-slate-400">(optional)</span></label>
                  <input name="delivery-instructions" autoComplete="off" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Landmark, gate code, floor or delivery directions" className={inputClass(false)} />
                </div>
                {mapAddress && <p className="mt-2 truncate text-[11px] font-medium text-emerald-700"><MapPin className="mr-1 inline h-3 w-3" />Map location added: {mapAddress}</p>}
              </div>

              {/* Payment Method */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-700" />
                  <span className="text-sm font-bold text-emerald-900">
                    Payment Method
                  </span>
                </div>
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  Cash on Delivery
                </span>
              </div>

              {/* Submit */}
              <div className="pt-1">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In to Complete Order
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || shippingLoading || items.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-50 text-sm sm:text-base cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        {shippingLoading ? "Loading shipping fee…" : `Place Order — ${formatPrice(displayedTotal)}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Leaflet Map Modal */}
      <MapAddressPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={mapAddress || [area, city].filter(Boolean).join(", ")}
        onSelectAddress={(newAddress) => {
          setMapAddress(newAddress);
          if (!area) setArea(newAddress.split(/[·,]/)[0]?.trim() || "Map-selected area");
          if (!city) {
            if (/islamabad/i.test(newAddress)) setCity("Islamabad");
            else if (/rawalpindi/i.test(newAddress)) setCity("Rawalpindi");
          }
          if (error) setError("");
        }}
      />
    </>,
    document.body
  );
}

function AddressInput({ label, error, children }: { label: string; error: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-600">{label} *</label>
      {children}
      <div className="min-h-4" aria-live="polite">
        {error && <p className="mt-1 text-[11px] font-medium leading-3 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
