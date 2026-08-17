"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
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
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { checkoutShopOrder } from "@/services/shopService";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import MapAddressPickerModal from "../location/MapAddressPickerModal";
import { showSuccessToast } from "@/context/ToastContext";
import { PAKISTAN_CITIES } from "@/data/pakistanCities";
import { DEFAULT_SETTINGS } from "@/app/checkout/types";
import { money, openWhatsAppOrder } from "@/lib/whatsapp-order";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
const SAVED_SHOP_ADDRESS_TTL = 30 * 24 * 60 * 60 * 1000;

interface SavedShopAddress {
  city: string;
  house: string;
  street: string;
  area: string;
  mapAddress: string;
  mapCoords: { lat: number; lng: number } | null;
  expiresAt: number;
}

function savedShopAddressKey(email: string) {
  return `ustaadpro_shop_checkout_address_v1:${email.trim().toLowerCase()}`;
}

function readSavedShopAddress(email: string): SavedShopAddress | null {
  try {
    const key = savedShopAddressKey(email);
    const saved = JSON.parse(localStorage.getItem(key) || "null") as SavedShopAddress | null;
    if (!saved || saved.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

/**
 * Accept common Pakistani mobile formats and return the E.164 value expected
 * at the API boundary. Spaces, dashes, and parentheses are ignored so users
 * can enter a familiar human-readable number.
 */
function normalizePakistaniPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s()-]/g, "");

  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  if (/^\+923\d{9}$/.test(compact)) return compact;
  if (/^923\d{9}$/.test(compact)) return `+${compact}`;
  if (/^3\d{9}$/.test(compact)) return `+92${compact}`;

  return null;
}

type AddressField = "name" | "phone" | "city" | "house" | "street" | "area";

const FIELD_LIMITS = {
  name: 60,
  phone: 17,
  house: 80,
  street: 120,
  area: 100,
  instructions: 300,
} as const;

const addressMessages: Record<AddressField, string> = {
  name: "Please enter your full name.",
  phone: "Please enter a valid Pakistani mobile number (e.g. 0300 1234567).",
  city: "Please select your city.",
  house: "Please enter a house, flat or building number.",
  street: "Please enter your street or road.",
  area: "Please enter your area, sector or locality.",
};

function getAddressFieldError(field: AddressField, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return addressMessages[field];

  if (field === "name") {
    if (trimmed.length < 3) return "Full name must contain at least 3 characters.";
    if (!/^[\p{L}\s.'-]+$/u.test(trimmed)) return "Full name can only contain letters.";
  }
  if (field === "phone" && !normalizePakistaniPhone(trimmed)) {
    return addressMessages.phone;
  }
  if (field === "city" && !PAKISTAN_CITIES.some((cityName) => cityName === trimmed)) {
    return "Please select a valid Pakistani city.";
  }
  if ((field === "house" || field === "street" || field === "area") && trimmed.length < 2) {
    return `${field === "house" ? "House or building" : field === "street" ? "Street or road" : "Area or locality"} must contain at least 2 characters.`;
  }

  return "";
}

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageMode?: boolean;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
  pageMode = false,
}: CartCheckoutModalProps) {
  const { user, setAuthModalMode } = useAuth();
  const { items, subtotal, clearCart, hydrated } = useCart();
  const { location, setManualLocation } = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [house, setHouse] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mapAddress, setMapAddress] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(DEFAULT_SETTINGS.shippingCost);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    total: number;
    itemCount: number;
  } | null>(null);
  const loadedSavedAddressFor = React.useRef("");
  const fieldRefs: Record<AddressField, React.RefObject<HTMLDivElement | null>> = {
    name: React.useRef<HTMLDivElement>(null),
    phone: React.useRef<HTMLDivElement>(null),
    city: React.useRef<HTMLDivElement>(null),
    house: React.useRef<HTMLDivElement>(null),
    street: React.useRef<HTMLDivElement>(null),
    area: React.useRef<HTMLDivElement>(null),
  };

  const focusInvalidField = (field: AddressField) => {
    window.requestAnimationFrame(() => {
      const target = fieldRefs[field].current;
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const control = target.querySelector<HTMLElement>("input, select, textarea, button");
      window.setTimeout(() => control?.focus({ preventScroll: true }), 350);
    });
  };

  // Portal mount guard (avoids SSR "document is not defined" issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the page behind the checkout fixed without causing a scrollbar-width
  // layout jump. The modal itself owns the only active vertical scrollbar.
  useEffect(() => {
    if (!isOpen || pageMode) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen, pageMode]);

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

  useEffect(() => {
    if (!isOpen || !user?.email || loadedSavedAddressFor.current === user.email) return;
    loadedSavedAddressFor.current = user.email;
    const saved = readSavedShopAddress(user.email);
    if (!saved) return;

    setHouse((current) => current || saved.house);
    setStreet((current) => current || saved.street);
    if (location.status !== "serviceable") {
      setCity((current) => current || saved.city);
      setArea((current) => current || saved.area);
      setMapAddress((current) => current || saved.mapAddress);
      setMapCoords((current) => current || saved.mapCoords);
    }
  }, [isOpen, location.status, user?.email]);

  useEffect(() => {
    if (!isOpen || location.status !== "serviceable") return;
    if (location.label) setMapAddress(location.label);
    if (location.coords) setMapCoords(location.coords);
    if (location.area || location.shortLabel) setArea(location.area || location.shortLabel || "");
    const locationCity = location.city || (/islamabad/i.test(location.label || "") ? "Islamabad" : /rawalpindi/i.test(location.label || "") ? "Rawalpindi" : "");
    if (locationCity && PAKISTAN_CITIES.some((knownCity) => knownCity === locationCity)) setCity(locationCity);
  }, [isOpen, location.area, location.city, location.coords, location.label, location.shortLabel, location.status]);

  if (!isOpen || (!pageMode && !mounted)) return null;

  if (pageMode && !hydrated) {
    return <div className="grid min-h-[100svh] place-items-center bg-slate-50 px-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Preparing your cart…</div></div>;
  }

  if (pageMode && items.length === 0 && !orderSuccess) {
    return <main className="grid min-h-[100svh] place-items-center bg-slate-50 px-4"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ShoppingBag className="mx-auto h-12 w-12 text-slate-300" /><h1 className="mt-4 text-2xl font-black text-slate-900">Your cart is empty</h1><p className="mt-2 text-sm text-slate-500">Add a product to your cart before continuing to checkout.</p><button type="button" onClick={onClose} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"><ArrowLeft className="h-4 w-4" /> Back to shop</button></div></main>;
  }

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

    // Apply the same validation at submission time as the live field checks.
    const normalizedPhone = normalizePakistaniPhone(phone);
    const addressValues: Record<AddressField, string> = { name, phone, city, house, street, area };
    const invalidField = (Object.keys(addressValues) as AddressField[]).find(
      (field) => Boolean(getAddressFieldError(field, addressValues[field]))
    );
    if (invalidField || !normalizedPhone) {
      const targetField = invalidField || "phone";
      setTouched({ name: true, phone: true, city: true, house: true, street: true, area: true });
      setError(getAddressFieldError(targetField, addressValues[targetField]) || addressMessages.phone);
      focusInvalidField(targetField);
      return;
    }

    const addressValue = [
      `House/Building: ${house.trim()}`,
      `Street/Road: ${street.trim()}`,
      `Area: ${area.trim()}`,
      `City: ${city}`,
      instructions.trim() ? `Instructions: ${instructions.trim()}` : null,
      mapAddress ? `Map location: ${mapAddress}` : "",
    ].filter(Boolean).join(" | ");

    setLoading(true);
    try {
      const response = await checkoutShopOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        address: `Name: ${name.trim()} | Phone: ${normalizedPhone} | ${addressValue}`,
        paymentMethod: "Cash on Delivery",
        useRewardPoints: false,
        addressLat: mapCoords?.lat,
        addressLng: mapCoords?.lng,
      });

      if (response?.order) {
        try {
          localStorage.setItem(savedShopAddressKey(user.email), JSON.stringify({
            city: city.trim(),
            house: house.trim(),
            street: street.trim(),
            area: area.trim(),
            mapAddress: mapAddress.trim(),
            mapCoords,
            expiresAt: Date.now() + SAVED_SHOP_ADDRESS_TTL,
          } satisfies SavedShopAddress));
        } catch { /* Checkout must still succeed when storage is unavailable. */ }
        const purchasedProducts =
          items.length === 1
            ? items[0].product.title
            : `${items[0].product.title} and ${items.length - 1} other product${items.length > 2 ? "s" : ""}`;
        setOrderSuccess({
          orderId: response.order.id,
          total: response.order.total,
          itemCount: items.reduce((count, item) => count + item.quantity, 0),
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

  const handleWhatsAppOrder = () => {
    setError("");
    const addressValues: Record<AddressField, string> = { name, phone, city, house, street, area };
    const invalidField = (Object.keys(addressValues) as AddressField[]).find(
      (field) => Boolean(getAddressFieldError(field, addressValues[field]))
    );
    if (invalidField) {
      setTouched({ name: true, phone: true, city: true, house: true, street: true, area: true });
      setError(getAddressFieldError(invalidField, addressValues[invalidField]));
      focusInvalidField(invalidField);
      return;
    }
    if (shippingLoading || items.length === 0) {
      setError(shippingLoading ? "Please wait while the final delivery total is calculated." : "Your cart is empty.");
      return;
    }

    const normalizedPhone = normalizePakistaniPhone(phone)!;
    const itemLines = items.map((item, index) =>
      `${index + 1}. ${item.product.title} × ${item.quantity} — ${money(item.product.price * item.quantity)}`
    );
    const completeAddress = [
      house.trim(), street.trim(), area.trim(), city.trim(), mapAddress.trim(),
    ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", ");
    const message = [
      "*Ustaad Pro — Shop Order Request*",
      "",
      `Customer: ${name.trim()}`,
      `Phone: ${normalizedPhone}`,
      `Delivery address: ${completeAddress}`,
      instructions.trim() ? `Instructions: ${instructions.trim()}` : "",
      "",
      "*Selected products*",
      ...itemLines,
      "",
      `Product subtotal: ${money(subtotal)}`,
      `Shipping fee: ${money(shippingCost)}`,
      `*Final total: ${money(displayedTotal)}*`,
      "Payment: Cash on Delivery",
      "",
      "Please confirm the payment instructions for this order.",
      "Payment screenshot: I will send the screenshot in this WhatsApp chat after transferring the required amount.",
    ].filter((line): line is string => line !== null).join("\n");

    if (user?.email) {
      try {
        localStorage.setItem(savedShopAddressKey(user.email), JSON.stringify({ city: city.trim(), house: house.trim(), street: street.trim(), area: area.trim(), mapAddress: mapAddress.trim(), mapCoords, expiresAt: Date.now() + SAVED_SHOP_ADDRESS_TTL } satisfies SavedShopAddress));
      } catch { /* WhatsApp checkout still works without storage. */ }
    }
    openWhatsAppOrder(message);
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setError("");
    setTouched({});
    onClose();
  };

  const fieldError = (field: AddressField, value: string) => {
    if (!touched[field]) return "";
    return getAddressFieldError(field, value);
  };
  const inputClass = (invalid: boolean) =>
    `w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${invalid ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`;
  const displayedTotal = subtotal + shippingCost;

  const checkoutContent = (
    <>
      <div className={pageMode ? "min-h-[100svh] bg-slate-50 p-2 sm:p-4" : "fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"}>
        <div className={pageMode ? "relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl" : "relative w-full max-w-5xl overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all sm:rounded-3xl"}>
          <div className={pageMode ? "min-w-0" : "max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain booking-modal-scrollbar sm:max-h-[94dvh]"}>
          {/* Header */}
          <div className={`sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4 ${pageMode ? "bg-white" : "bg-white/95 backdrop-blur-md"}`}>
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              {pageMode && <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:h-11 sm:px-4"
                aria-label="Back to shop"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>}
              <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                Complete your order
              </h2>
              <p className="truncate text-xs font-bold text-emerald-600">
                {orderSuccess?.itemCount ?? items.reduce((count, item) => count + item.quantity, 0)} item{(orderSuccess?.itemCount ?? items.reduce((count, item) => count + item.quantity, 0)) !== 1 ? "s" : ""} •{" "}
                {orderSuccess ? formatPrice(orderSuccess.total) : shippingLoading ? "Calculating total…" : formatPrice(displayedTotal)}
              </p>
              </div>
            </div>
            {pageMode && <div className="hidden shrink-0 text-right sm:block"><p className="flex items-center justify-end gap-2 text-sm font-black text-emerald-700"><ShieldCheck className="h-4 w-4" /> Secure Checkout</p><p className="mt-0.5 text-xs text-slate-500">Your details are protected</p></div>}
            {!pageMode && <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close checkout"
            >
              <X className="h-5 w-5" />
            </button>}
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

              <div className="mx-auto grid w-full max-w-lg gap-3 sm:grid-cols-2">
                <Link
                  href="/track-booking"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Track this order
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} autoComplete="on" className={pageMode ? "grid grid-cols-1 gap-4 p-3 sm:p-5 lg:grid-cols-[0.92fr_1.08fr]" : "space-y-3 p-4 sm:p-5"}>
              {/* Auth Notice */}
              {!user && (
                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
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
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 lg:col-span-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="min-w-0 break-words leading-5">{error}</span>
                </div>
              )}

              {/* Order Summary */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:row-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="text-base font-black text-slate-900">Order Summary</h3><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{items.length} Item{items.length === 1 ? "" : "s"}</span></div>
                <div className={pageMode ? "divide-y divide-slate-100" : "max-h-36 divide-y divide-slate-100 overflow-y-auto"}>
                  {items.map((item) => {
                    const imgSrc = buildImageUrl(item.product.imageUrl);
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.product.title}
                              width={56}
                              height={56}

                              className="h-14 w-14 rounded-lg object-contain p-1 [image-rendering:auto]"
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
                <div className="space-y-2 border-t border-slate-200 px-4 py-4">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Product subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Shipping fee</span>
                    <span className="font-semibold">{shippingLoading ? "Loading…" : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <span className="text-sm font-bold text-slate-700">Total</span>
                    <span className="text-lg font-black text-emerald-600">
                      {shippingLoading ? "—" : formatPrice(displayedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid content-start grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 sm:col-span-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700"><User className="h-4 w-4" /></span><h3 className="text-base font-black text-slate-900">Contact Details</h3></div>
                <div ref={fieldRefs.name} className="scroll-mt-24">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      autoComplete="shipping name"
                      required
                      minLength={3}
                      maxLength={FIELD_LIMITS.name}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setTouched((old) => ({ ...old, name: true })); }}
                      onBlur={() => setTouched((old) => ({ ...old, name: true }))}
                      placeholder="e.g. Muhammad Ali"
                      className={`w-full rounded-lg border bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 ${fieldError("name", name) ? "border-red-400 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`}
                      aria-invalid={Boolean(fieldError("name", name))}
                    />
                  </div>
                  <div className="min-h-4" aria-live="polite">{fieldError("name", name) && <p className="mt-1 text-[11px] font-semibold leading-3 text-red-600">{fieldError("name", name)}</p>}</div>
                </div>

                <div ref={fieldRefs.phone} className="scroll-mt-24">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="shipping tel"
                      inputMode="tel"
                      required
                      maxLength={FIELD_LIMITS.phone}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setTouched((old) => ({ ...old, phone: true })); }}
                      onBlur={() => setTouched((old) => ({ ...old, phone: true }))}
                      placeholder="0300 1234567"
                      className={`w-full rounded-lg border bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 ${fieldError("phone", phone) ? "border-red-400 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`}
                      aria-invalid={Boolean(fieldError("phone", phone))}
                    />
                  </div>
                  <div className="min-h-4" aria-live="polite">{fieldError("phone", phone) && <p className="mt-1 text-[11px] font-semibold leading-3 text-red-600">{fieldError("phone", phone)}</p>}</div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-xs font-medium text-emerald-800 sm:col-span-2"><ShieldCheck className="h-4 w-4 shrink-0" /> We&apos;ll call you if needed to confirm your order.</div>
              </div>

              {/* Delivery Address & Map Picker */}
              <div className="rounded-2xl border border-slate-200 p-4 lg:col-start-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700"><MapPin className="h-4 w-4" /></span><h3 className="text-base font-black text-slate-900">Delivery Address</h3></div>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Pick from Map <span className="font-normal text-slate-400">(optional)</span>
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <AddressInput containerRef={fieldRefs.city} label="City" error={fieldError("city", city)}>
                    <select name="city" autoComplete="shipping address-level2" value={city} onChange={(e) => { setCity(e.target.value); setTouched((old) => ({ ...old, city: true })); }} onBlur={() => setTouched((old) => ({ ...old, city: true }))} className={inputClass(Boolean(fieldError("city", city)))} aria-label="City" aria-invalid={Boolean(fieldError("city", city))}>
                      <option value="">Select city</option>
                      {PAKISTAN_CITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </AddressInput>
                  <AddressInput containerRef={fieldRefs.house} label="House / Flat #" error={fieldError("house", house)}>
                    <input name="address-line1" autoComplete="shipping address-line1" minLength={2} maxLength={FIELD_LIMITS.house} value={house} onChange={(e) => { setHouse(e.target.value); setTouched((old) => ({ ...old, house: true })); }} onBlur={() => setTouched((old) => ({ ...old, house: true }))} placeholder="House 12, Flat 3" className={inputClass(Boolean(fieldError("house", house)))} aria-invalid={Boolean(fieldError("house", house))} />
                  </AddressInput>
                  <AddressInput containerRef={fieldRefs.street} label="Street / Road" error={fieldError("street", street)}>
                    <input name="address-line2" autoComplete="shipping address-line2" minLength={2} maxLength={FIELD_LIMITS.street} value={street} onChange={(e) => { setStreet(e.target.value); setTouched((old) => ({ ...old, street: true })); }} onBlur={() => setTouched((old) => ({ ...old, street: true }))} placeholder="Street 8, Main Road" className={inputClass(Boolean(fieldError("street", street)))} aria-invalid={Boolean(fieldError("street", street))} />
                  </AddressInput>
                  <AddressInput containerRef={fieldRefs.area} label="Area / Sector" error={fieldError("area", area)}>
                    <input name="address-level3" autoComplete="shipping address-level3" minLength={2} maxLength={FIELD_LIMITS.area} value={area} onChange={(e) => { setArea(e.target.value); setTouched((old) => ({ ...old, area: true })); }} onBlur={() => setTouched((old) => ({ ...old, area: true }))} placeholder="Bahria Town, F-10" className={inputClass(Boolean(fieldError("area", area)))} aria-invalid={Boolean(fieldError("area", area))} />
                  </AddressInput>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-bold text-slate-600">Additional Instructions <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea rows={2} name="delivery-instructions" autoComplete="off" maxLength={FIELD_LIMITS.instructions} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Landmark, gate code, floor or delivery directions" className={`${inputClass(false)} resize-y`} />
                </div>
                {mapAddress && <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-[11px] font-medium text-emerald-700"><p className="min-w-0 truncate"><MapPin className="mr-1 inline h-3 w-3" />Map location added: {mapAddress}</p><button type="button" onClick={() => setIsMapOpen(true)} className="shrink-0 font-black hover:underline">Edit</button></div>}
              </div>

              {/* Payment Method */}
              <div className="flex h-full min-h-20 flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50"><ShoppingCart className="h-4 w-4 text-emerald-700" /></span>
                  <span className="text-sm font-bold text-emerald-900">
                    Payment Method
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3 py-2.5"><span className="grid h-5 w-5 place-items-center rounded-full border-2 border-emerald-600"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /></span><div><p className="text-xs font-black text-slate-900">Cash on Delivery</p><p className="text-[10px] text-slate-500">Pay when you receive your order</p></div></div>
              </div>

              {/* Submit */}
              <div className="flex flex-col items-stretch justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In to Complete Order
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || shippingLoading || items.length === 0}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50 sm:text-base cursor-pointer"
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
                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  disabled={shippingLoading || items.length === 0}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-white px-3 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle className="h-5 w-5" />
                  Order via WhatsApp — {shippingLoading ? "Calculating…" : formatPrice(displayedTotal)}
                </button>
                <p className="text-center text-[11px] text-slate-500">The complete order and total will open in WhatsApp. Send your payment screenshot there after transfer.</p>
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 100% Safe &amp; Secure Checkout</p>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Leaflet Map Modal */}
      <MapAddressPickerModal
        key={isMapOpen ? `shop-map-${mapCoords?.lat || location.coords?.lat || "default"}-${mapCoords?.lng || location.coords?.lng || "default"}` : "shop-map-closed"}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={mapAddress || [area, city].filter(Boolean).join(", ")}
        initialLat={mapCoords?.lat || location.coords?.lat}
        initialLng={mapCoords?.lng || location.coords?.lng}
        onSelectAddress={(newAddress, lat, lng) => {
          setMapAddress(newAddress);
          setArea(newAddress.split(",")[0]?.trim() || "Map-selected area");
          const selectedCity = /islamabad/i.test(newAddress) ? "Islamabad" : /rawalpindi/i.test(newAddress) ? "Rawalpindi" : city;
          if (selectedCity) setCity(selectedCity);
          if (lat !== undefined && lng !== undefined) {
            const coords = { lat, lng };
            setMapCoords(coords);
            setManualLocation(coords, newAddress, selectedCity || "Rawalpindi / Islamabad", newAddress.split(",")[0]?.trim());
          }
          if (error) setError("");
        }}
      />
    </>
  );
  return pageMode ? checkoutContent : createPortal(checkoutContent, document.body);
}

function AddressInput({ containerRef, label, error, children }: { containerRef?: React.RefObject<HTMLDivElement | null>; label: string; error: string; children: React.ReactNode }) {
  return (
    <div ref={containerRef} className="scroll-mt-24">
      <label className="mb-1 block text-xs font-bold text-slate-600">{label} *</label>
      {children}
      <div className="min-h-4" aria-live="polite">
        {error && <p className="mt-1 text-[11px] font-medium leading-3 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
