"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";

import { CheckoutHeader } from "./components/CheckoutHeader";
import { CheckoutForm } from "./components/CheckoutForm";
import { PriceBreakdown } from "./components/PriceBreakdown";
import { SuccessScreen } from "./components/SuccessScreen";

import type {
  AdminSettings,
  BookingRecord,
  FormData,
  PaymentMethod,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { location } = useLocation();

  const serviceTitle = searchParams.get("serviceTitle") || "Selected service";
  const servicePrice = Number(searchParams.get("servicePrice") || 0);
  const workTitle = searchParams.get("workTitle") || "";
  const serviceId = searchParams.get("serviceId") || "";
  const workPriceIdStr = searchParams.get("workPriceId");
  const workPriceId = workPriceIdStr ? Number(workPriceIdStr) : undefined;

  const productId = searchParams.get("productId") || "";
  const productTitle = searchParams.get("productTitle") || "Selected product";
  const productPrice = Number(searchParams.get("productPrice") || 0);
  const productImage = searchParams.get("productImage") || "";
  const quantity = Number(searchParams.get("quantity") || 1);
  const isShop = !!productId;

  const checkoutTitle = isShop ? productTitle : serviceTitle;
  const checkoutPrice = isShop ? productPrice * quantity : servicePrice;

  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Fetch admin settings ────────────────────────────────────────────────
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;
  useEffect(() => {
    if (!API_BASE_URL) return;
    let alive = true;
    fetch(`${API_BASE_URL}/api/admin/settings`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Partial<AdminSettings>;
        if (alive) setSettings({ ...DEFAULT_SETTINGS, ...data });
      })
      .catch(() => {
        if (alive) setSettings(DEFAULT_SETTINGS);
      });
    return () => { alive = false; };
  }, [API_BASE_URL]);

  // ── Derived values ──────────────────────────────────────────────────────
  const selectedAddress = useMemo(
    () => location.shortLabel || location.label || "",
    [location]
  );

  const [livePaymentMethod, setLivePaymentMethod] = useState<PaymentMethod>("cash");

  const subtotal = isShop ? productPrice * quantity : servicePrice;
  const taxAmount = isShop ? 0 : subtotal * (settings.serviceTaxPercent / 100);
  const inspectionFee = isShop ? 0 : settings.inspectionFee;
  const shippingCost = isShop ? settings.shippingCost : 0;

  const totalPayable = useMemo(
    () => subtotal + taxAmount + inspectionFee + shippingCost,
    [subtotal, taxAmount, inspectionFee, shippingCost]
  );

  // ── Handle form submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (formData: FormData, paymentMethod: PaymentMethod, screenshotName: string) => {
      setIsSubmitting(true);
      setSubmitError("");
      setLivePaymentMethod(paymentMethod);

      const isOnline = paymentMethod === "easypaisa" || paymentMethod === "jazzcash";
      const address = [selectedAddress, formData.houseNumber, formData.landmark]
        .filter(Boolean)
        .join(" · ")
        .replace(/\s+/g, " ")
        .trim();

      const url = isShop
        ? `${API_BASE_URL}/api/shop/checkout`
        : `${API_BASE_URL}/api/orders/checkout`;

      const payload = isShop
        ? {
            items: [
              { productId, quantity }
            ],
            address,
            paymentMethod: paymentMethod === "easypaisa" ? "Easypaisa" : (paymentMethod === "jazzcash" ? "Jazzcash" : "Cash"),
            useRewardPoints: false,
          }
        : {
            cart: [
              {
                service: {
                  id: serviceId,
                  title: serviceTitle,
                  price: servicePrice,
                  selectedWorkPriceId: workPriceId,
                  selectedWorkTitle: workTitle,
                },
                quantity: 1,
              },
            ],
            bookedFor: new Date(`${formData.preferredDate}T${formData.preferredTime}:00+05:00`).toISOString(),
            paymentMethod: paymentMethod === "easypaisa" ? "Easypaisa After Work Done" : (paymentMethod === "jazzcash" ? "Jazzcash After Work Done" : "Cash After Work Done"),
            address,
            specialInstructions: formData.notes,
            inspectionFee: settings.inspectionFee,
            tax: taxAmount,
            recurringOccurrences: 1,
            useRewardPoints: false,
          };

      try {
        let token = "";
        try {
          const storedToken = localStorage.getItem("ustaadpro_token");
          if (storedToken) token = storedToken;
        } catch {}

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const responseBody = await res.json().catch(() => null) as { message?: string; error?: string } | null;
          throw new Error(responseBody?.message || responseBody?.error || `The server could not place this order (${res.status}).`);
        }

        const data = await res.json();

        const record: BookingRecord = {
          id: data.order?.id || `BK-${Date.now()}`,
          serviceTitle: checkoutTitle,
          workTitle: isShop ? "" : workTitle,
          servicePrice: checkoutPrice,
          paymentMethod,
          status: isOnline ? (isShop ? "placed" : "Pending review") : (isShop ? "placed" : "Confirmed"),
          createdAt: new Date().toISOString(),
          userEmail: user?.email ?? "",
          customerName: formData.fullName,
          phone: formData.phone,
          address,
          preferredTime: isShop ? "" : new Date(`${formData.preferredDate}T${formData.preferredTime}:00+05:00`).toISOString(),
          notes: formData.notes,
          screenshotName,
          kind: isShop ? "shop" : "service",
          serviceId: isShop ? undefined : serviceId,
          items: isShop ? [{ productId, title: productTitle, quantity, price: productPrice, imageUrl: productImage }] : undefined,
        };

        // Persist to localStorage for local history
        try {
          const stored: BookingRecord[] = JSON.parse(
            localStorage.getItem("ustaadpro_bookings") ?? "[]"
          );
          localStorage.setItem(
            "ustaadpro_bookings",
            JSON.stringify([record, ...stored])
          );
        } catch { /* no-op */ }

        setBooking(record);
      } catch (err) {
        const message = err instanceof Error ? err.message : "There was an error placing your order. Please try again.";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedAddress, serviceTitle, workTitle, servicePrice, user, serviceId, workPriceId, settings, API_BASE_URL, isShop, productId, productTitle, productPrice, productImage, quantity, checkoutTitle, checkoutPrice, taxAmount]
  );


  // Booking successful
  if (booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <CheckoutHeader serviceTitle={checkoutTitle} stepLabel="Done!" />
        <SuccessScreen booking={booking} currency={settings.currency} />
      </div>
    );
  }

  // 3 — Checkout form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <CheckoutHeader serviceTitle={checkoutTitle} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left: Form ───────────────────────────────────── */}
          <div className="min-w-0">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">
                {isShop ? "Checkout your product" : "Book your service"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isShop
                  ? "Fill in the details below to complete your order."
                  : "Fill in the details below and we'll confirm your appointment shortly."}
              </p>
            </div>

            <CheckoutForm
              initialName={user?.name ?? ""}
              initialPhone={user?.phone ?? ""}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isShop={isShop}
              submitError={submitError}
            />
          </div>

          {/* ── Right: Sticky summary ─────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-800">Order summary</h2>
                <p className="text-xs text-slate-500">
                  Review your details before confirming.
                </p>
              </div>
              <PriceBreakdown
                serviceTitle={checkoutTitle}
                workTitle={workTitle}
                servicePrice={checkoutPrice}
                settings={settings}
                paymentMethod={livePaymentMethod}
                selectedAddress={selectedAddress}
                isShop={isShop}
              />
            </div>
          </aside>
        </div>

        {/* ── Mobile: Summary shown above form ─────────────────── */}
        <div className="mt-6 block lg:hidden">
          <details className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold text-slate-800">
              View order summary
              <span className="text-emerald-600 font-black text-base">
                {settings.currency}{" "}
                {totalPayable.toLocaleString()}
              </span>
            </summary>
            <div className="border-t border-slate-100 p-5">
              <PriceBreakdown
                serviceTitle={checkoutTitle}
                workTitle={workTitle}
                servicePrice={checkoutPrice}
                settings={settings}
                paymentMethod={livePaymentMethod}
                selectedAddress={selectedAddress}
                isShop={isShop}
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
