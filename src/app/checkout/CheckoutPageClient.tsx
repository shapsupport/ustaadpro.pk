"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";

import { CheckoutHeader } from "./components/CheckoutHeader";
import { AuthRequiredCard } from "./components/AuthRequiredCard";
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

  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ── Handle form submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (formData: FormData, paymentMethod: PaymentMethod, screenshotName: string) => {
      setIsSubmitting(true);
      setLivePaymentMethod(paymentMethod);

      const isOnline = paymentMethod === "easypaisa" || paymentMethod === "jazzcash";
      const address = [selectedAddress, formData.houseNumber, formData.landmark]
        .filter(Boolean)
        .join(" · ")
        .replace(/\s+/g, " ")
        .trim();

      const record: BookingRecord = {
        id: `BK-${Date.now()}`,
        serviceTitle,
        workTitle,
        servicePrice,
        paymentMethod,
        status: isOnline ? "Pending review" : "Confirmed",
        createdAt: new Date().toISOString(),
        userEmail: user?.email ?? "",
        customerName: formData.fullName,
        phone: formData.phone,
        address,
        preferredTime: formData.preferredTime,
        notes: formData.notes,
        screenshotName,
      };

      // Persist to localStorage
      try {
        const stored: BookingRecord[] = JSON.parse(
          localStorage.getItem("ustaadpro_bookings") ?? "[]"
        );
        localStorage.setItem(
          "ustaadpro_bookings",
          JSON.stringify([record, ...stored])
        );
      } catch { /* no-op */ }

      // Simulate a small async delay for UX feedback
      setTimeout(() => {
        setIsSubmitting(false);
        setBooking(record);
      }, 600);
    },
    [selectedAddress, serviceTitle, workTitle, servicePrice, user]
  );

  // ── Render states ───────────────────────────────────────────────────────

  // 1 — Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <CheckoutHeader serviceTitle={serviceTitle} stepLabel="Sign in" />
        <AuthRequiredCard />
      </div>
    );
  }

  // 2 — Booking successful
  if (booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <CheckoutHeader serviceTitle={serviceTitle} stepLabel="Done!" />
        <SuccessScreen booking={booking} currency={settings.currency} />
      </div>
    );
  }

  // 3 — Checkout form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <CheckoutHeader serviceTitle={serviceTitle} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left: Form ───────────────────────────────────── */}
          <div className="min-w-0">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">Book your service</h1>
              <p className="mt-1 text-sm text-slate-500">
                Fill in the details below and we&apos;ll confirm your appointment shortly.
              </p>
            </div>

            <CheckoutForm
              initialName={user.name ?? ""}
              initialPhone={user.phone ?? ""}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* ── Right: Sticky summary ─────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-800">Order summary</h2>
                <p className="text-xs text-slate-500">
                  Review your booking details before confirming.
                </p>
              </div>
              <PriceBreakdown
                serviceTitle={serviceTitle}
                workTitle={workTitle}
                servicePrice={servicePrice}
                settings={settings}
                paymentMethod={livePaymentMethod}
                selectedAddress={selectedAddress}
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
                {(
                  servicePrice +
                  servicePrice * (settings.serviceTaxPercent / 100) +
                  settings.inspectionFee +
                  settings.shippingCost
                ).toLocaleString()}
              </span>
            </summary>
            <div className="border-t border-slate-100 p-5">
              <PriceBreakdown
                serviceTitle={serviceTitle}
                workTitle={workTitle}
                servicePrice={servicePrice}
                settings={settings}
                paymentMethod={livePaymentMethod}
                selectedAddress={selectedAddress}
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
