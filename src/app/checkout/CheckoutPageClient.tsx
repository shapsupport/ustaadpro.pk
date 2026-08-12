"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { createBooking } from "@/services/bookingService";
import { checkoutShopOrder } from "@/services/shopService";

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
import { clampBookingLeadHours } from "@/lib/booking-time";

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
  const [rewardEligible, setRewardEligible] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const walletBalance = Number(user?.walletBalance || 0);

  // ── Fetch public settings ───────────────────────────────────────────────
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/api/settings`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Partial<AdminSettings>;
        if (alive) setSettings({ ...DEFAULT_SETTINGS, ...data, minimumBookingLeadHours: clampBookingLeadHours(data.minimumBookingLeadHours) });
      })
      .catch(() => {
        if (alive) setSettings(DEFAULT_SETTINGS);
      });
    return () => { alive = false; };
  }, [API_BASE_URL]);

  useEffect(() => {
    if (isShop || !user) {
      return;
    }
    const token = localStorage.getItem("ustaadpro_token");
    if (!token) return;
    let alive = true;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE_URL}/api/orders/loyalty-status`, { headers, cache: "no-store" })
      .then(async (response) => {
        if (response.ok) return response.json() as Promise<{ eligible?: boolean }>;
        const fallback = await fetch(`${API_BASE_URL}/api/orders`, { headers, cache: "no-store" });
        if (!fallback.ok) throw new Error("Orders unavailable");
        const orders = await fallback.json() as Array<{ status?: string; rewardDiscount?: number; rewarddiscount?: number }>;
        const pendingReward = orders.some((order) =>
          String(order.status || "").toLowerCase() === "checking_receipt" && Number(order.rewardDiscount || order.rewarddiscount || 0) > 0
        );
        return { eligible: Number(user.rewardPoints || 0) >= 12 && !pendingReward };
      })
      .then((payload: { eligible?: boolean }) => {
        if (!alive) return;
        setRewardEligible(Boolean(payload.eligible));
      })
      .catch(() => { if (alive) setRewardEligible(false); })
    return () => { alive = false; };
  }, [API_BASE_URL, checkoutPrice, isShop, user]);

  // ── Derived values ──────────────────────────────────────────────────────
  const selectedAddress = useMemo(
    () => {
      const label = location.label || location.shortLabel || "";
      if (!location.coords) return label;
      return [
        label,
        `Latitude: ${location.coords.lat.toFixed(6)}`,
        `Longitude: ${location.coords.lng.toFixed(6)}`,
      ].filter(Boolean).join(" · ");
    },
    [location]
  );

  const [livePaymentMethod, setLivePaymentMethod] = useState<PaymentMethod>(isShop ? "cod" : "Rs 200 Advance");

  const subtotal = isShop ? productPrice * quantity : servicePrice;
  const selectedRewardDiscount = !isShop && rewardEligible && useRewardPoints ? Math.min(300, subtotal) : 0;
  const taxableSubtotal = Math.max(0, subtotal - selectedRewardDiscount);
  const taxAmount = isShop ? 0 : taxableSubtotal * (settings.serviceTaxPercent / 100);
  const inspectionFee = isShop ? 0 : settings.inspectionFee;
  const shippingCost = isShop ? settings.shippingCost : 0;

  const totalPayable = useMemo(
    () => taxableSubtotal + taxAmount + inspectionFee + shippingCost,
    [taxableSubtotal, taxAmount, inspectionFee, shippingCost]
  );

  // ── Handle form submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (formData: FormData, paymentMethod: PaymentMethod, applyWallet: boolean) => {
      setIsSubmitting(true);
      setSubmitError("");
      setLivePaymentMethod(paymentMethod);

      // Keep the precise map point and the user-entered house details together
      // in the single address value expected by the checkout APIs.
      const address = [formData.houseNumber, formData.landmark, selectedAddress]
        .filter(Boolean)
        .join(" · ")
        .replace(/\s+/g, " ")
        .trim();

      try {
        let orderId = "";
        let confirmedTotal = totalPayable;
        let confirmedInspectionFee = inspectionFee;
        let confirmedTax = taxAmount;
        let confirmedDiscount = 0;
        let confirmedLoyaltyDiscount = 0;
        let confirmedOriginalTotal = totalPayable;
        if (isShop) {
          const data = await checkoutShopOrder({
            items: [{ productId, quantity }],
            address,
            addressLat: location.coords?.lat,
            addressLng: location.coords?.lng,
            paymentMethod,
          });
          orderId = data.order?.id || `BK-${Date.now()}`;
        } else {
          const resData = await createBooking({
            name: formData.fullName,
            phone: formData.phone,
            address,
            addressLat: location.coords?.lat,
            addressLng: location.coords?.lng,
            date: formData.preferredDate,
            time: formData.preferredTime,
            requirements: formData.notes,
            items: [
              {
                serviceId,
                serviceTitle,
                servicePrice,
                workPriceId,
                workTitle,
                quantity: 1,
              },
            ],
            paymentMethod,
            inspectionFee: settings.inspectionFee,
            tax: taxAmount,
            loyaltyDiscount: selectedRewardDiscount,
            discount: selectedRewardDiscount,
            useRewardPoints,
            useWalletBalance: applyWallet,
          });
          orderId = resData.order?.id || `BK-${Date.now()}`;
          confirmedTotal = Number(resData.order?.total ?? totalPayable);
          confirmedInspectionFee = Number(resData.order?.inspectionFee ?? inspectionFee);
          confirmedTax = Number(resData.order?.tax ?? taxAmount);
          confirmedDiscount = Number(resData.order?.rewardDiscount ?? selectedRewardDiscount);
          confirmedLoyaltyDiscount = Number(resData.order?.loyaltyDiscount ?? selectedRewardDiscount);
          confirmedOriginalTotal = Number(resData.order?.originalTotal ?? (confirmedTotal + confirmedDiscount));
        }

        const record: BookingRecord = {
          id: orderId,
          serviceTitle: checkoutTitle,
          workTitle: isShop ? "" : workTitle,
          servicePrice: checkoutPrice,
          total: confirmedTotal,
          inspectionFee: isShop ? 0 : confirmedInspectionFee,
          tax: isShop ? 0 : confirmedTax,
          discount: confirmedDiscount,
          loyaltyDiscount: confirmedLoyaltyDiscount,
          originalTotal: confirmedOriginalTotal,
          paymentMethod,
          status: isShop ? "placed" : "checking_receipt",
          createdAt: new Date().toISOString(),
          userEmail: user?.email ?? "",
          customerName: formData.fullName,
          phone: formData.phone,
          address,
          preferredTime: isShop ? "" : new Date(`${formData.preferredDate}T${formData.preferredTime}:00+05:00`).toISOString(),
          notes: formData.notes,
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
    [selectedAddress, serviceTitle, workTitle, servicePrice, user, serviceId, workPriceId, settings, isShop, productId, productTitle, productPrice, productImage, quantity, checkoutTitle, checkoutPrice, taxAmount, selectedRewardDiscount, useRewardPoints, totalPayable, inspectionFee, location.coords]
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
              minimumBookingLeadHours={settings.minimumBookingLeadHours}
              submitError={submitError}
              onScheduleChange={() => setSubmitError("")}
              walletBalance={walletBalance}
              onWalletChange={setUseWalletBalance}
            />
          </div>

          {/* ── Right: Sticky summary ─────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              {rewardEligible && <button type="button" onClick={() => setUseRewardPoints((value) => !value)} className={`mb-4 w-full rounded-2xl border p-4 text-left ${useRewardPoints ? "border-violet-500 bg-violet-50" : "border-violet-200 bg-white"}`}><strong className="block text-sm text-slate-900">Redeem 12 points for PKR 300</strong><span className="text-xs text-slate-500">Deducted before tax</span></button>}
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
                loyaltyDiscount={selectedRewardDiscount}
                walletBalance={walletBalance}
                useWalletBalance={useWalletBalance}
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
