"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  MapPin,
  User,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  Map as MapIcon,
  Calendar,
  Info,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { createBooking, uploadPaymentReceipt, ServiceItemInput } from "@/services/bookingService";
import { useAuth } from "@/context/AuthContext";
import TimeSlotPicker from "./TimeSlotPicker";
import RecurringPicker, { calculateDaysCount } from "./RecurringPicker";
import MapAddressPickerModal from "../location/MapAddressPickerModal";
import EasyPaisaPaymentSection from "./EasyPaisaPaymentSection";
import { showSuccessToast } from "@/context/ToastContext";
import { getProfile } from "@/services/authService";
import { useRouter } from "next/navigation";
import { useServiceCart } from "@/context/ServiceCartContext";
import { bookingTimestamp, clampBookingLeadHours, earliestBookingTimestamp, pakistanDateAndTime } from "@/lib/booking-time";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const BOOKING_DRAFT_KEY = "ustaadpro_booking_draft";

// ── Service Area: Rawalpindi + Islamabad ────────────────────────────────
const SERVICE_AREA = { south: 33.40, north: 33.80, west: 72.85, east: 73.30 };

function isWithinServiceArea(lat: number, lng: number): boolean {
  return lat >= SERVICE_AREA.south && lat <= SERVICE_AREA.north &&
    lng >= SERVICE_AREA.west && lng <= SERVICE_AREA.east;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string | number;
    title: string;
    price: number;
    quantity?: number;
    selectedWorkPriceId?: number;
    selectedWorkTitle?: string;
    unitDescription?: string;
  };
  services?: BookingModalProps["service"][];
  onBookingComplete?: () => void;
}

function getTodayString() {
  return pakistanDateAndTime(Date.now()).date;
}

function validateSpecificAddress(value: string, mapLocationSelected: boolean): string {
  const address = value.trim();
  if (!address) return mapLocationSelected ? "" : "Enter your house and street address, or select a precise map location.";
  if (address.length < 8) return "Add a little more detail, including your house and street number.";
  if (!/\d/.test(address)) return "Include your house, building, or street number.";
  const words = address.match(/[a-zA-Z]{2,}/g) || [];
  if (words.length < 2) return "Enter both the house/building and street details.";
  return "";
}

export default function BookingModal({ isOpen, onClose, service, services, onBookingComplete }: BookingModalProps) {
  const { user, setAuthModalMode } = useAuth();
  const router = useRouter();
  const { items: cartItems, addService, updateQuantity, removeService } = useServiceCart();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Basic Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [requirements, setRequirements] = useState("");

  // Feature 1: Time Slot State
  const [selectedTime, setSelectedTime] = useState("");
  const [minimumBookingLeadHours, setMinimumBookingLeadHours] = useState(0);
  const [inspectionFee, setInspectionFee] = useState(0);
  const [serviceTaxPercent, setServiceTaxPercent] = useState(0);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/settings`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((settings: { minimumBookingLeadHours?: number; inspectionFee?: number; serviceTaxPercent?: number }) => {
        const leadHours = clampBookingLeadHours(settings.minimumBookingLeadHours);
        const minimumDate = pakistanDateAndTime(earliestBookingTimestamp(leadHours)).date;
        setMinimumBookingLeadHours(leadHours);
        if (fromDate < minimumDate) {
          setFromDate(minimumDate);
          setToDate(minimumDate);
          setSelectedTime("");
        }
        setInspectionFee(Math.max(0, Number(settings.inspectionFee || 0)));
        setServiceTaxPercent(Math.max(0, Number(settings.serviceTaxPercent || 0)));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isOpen]);

  // Feature 2: Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [fromDate, setFromDate] = useState(getTodayString());
  const [toDate, setToDate] = useState(getTodayString());

  // Feature 3: Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Coordinates from map picker (null = manual address)
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Feature 4: Payment & Receipt State
  const [paymentMethod, setPaymentMethod] = useState<"Rs 200 Advance" | "Full Payment in Advance">("Rs 200 Advance");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<{
    orderId: string;
    total: number;
    receiptUploaded?: boolean;
    receiptError?: string;
    paidAmount: number;
    remainingAmount: number;
    rewardApplied?: boolean;
  } | null>(null);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const draft = JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY) || "null") as null | {
        name?: string; phone?: string; selectedLocation?: string; specificAddress?: string;
        requirements?: string; selectedTime?: string; fromDate?: string; toDate?: string;
        isRecurring?: boolean; addressCoords?: { lat: number; lng: number } | null;
      };
      if (!draft) return;
      if (draft.name) setName(draft.name);
      if (draft.phone) setPhone(draft.phone);
      setSelectedLocation(draft.selectedLocation || "");
      setSpecificAddress(draft.specificAddress || "");
      setRequirements(draft.requirements || "");
      setSelectedTime(draft.selectedTime || "");
      if (draft.fromDate) setFromDate(draft.fromDate);
      if (draft.toDate) setToDate(draft.toDate);
      setIsRecurring(Boolean(draft.isRecurring));
      setAddressCoords(draft.addressCoords || null);
    } catch { /* Ignore an invalid saved draft. */ }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) {
      setUseRewardPoints(false);
      return;
    }
    setRewardLoading(true);
    getProfile()
      .then((profile) => setRewardPoints(Number(profile.rewardPoints || 0)))
      .catch(() => setRewardPoints(Number(user.rewardPoints || 0)))
      .finally(() => setRewardLoading(false));
  }, [isOpen, user]);

  // Derived Calculations
  const baseSelectedServices = services?.length ? services : [service];
  const selectedServices = baseSelectedServices.map((item) => ({
    ...item,
    price: livePrices[`${item.id}:${item.selectedWorkPriceId || "service"}`] ?? item.price,
  }));
  const unitPrice = service.price;
  const quantity = Math.max(1, Math.min(10, Number(service.quantity || 1)));
  const daysCount = useMemo(
    () => (isRecurring ? calculateDaysCount(fromDate, toDate) : 1),
    [isRecurring, fromDate, toDate]
  );
  const listedServicesTotal = selectedServices.reduce((sum, item) => sum + Number(item.price) * Math.max(1, Math.min(10, Number(item.quantity || 1))), 0);
  const serviceSubtotal = listedServicesTotal * daysCount;
  const serviceTax = serviceSubtotal * serviceTaxPercent / 100;
  const calculatedTotal = serviceSubtotal + inspectionFee + serviceTax;
  const rewardEligible = rewardPoints >= 200;
  const rewardDiscount = useRewardPoints && rewardEligible ? Math.min(200, calculatedTotal) : 0;
  const paymentNow = paymentMethod === "Rs 200 Advance"
    ? Math.max(0, Math.min(200, calculatedTotal) - rewardDiscount)
    : Math.max(0, calculatedTotal - rewardDiscount);
  const isInspectionService = selectedServices.some((item) => /visit|inspection/i.test(item.unitDescription || ""));
  const hasMapLocation = Boolean(selectedLocation.trim() && addressCoords);
  const addressFieldError = validateSpecificAddress(specificAddress, hasMapLocation);

  const handleReceiptSelect = (file: File | null) => {
    setReceiptDataUrl("");
    setReceiptFileName(file?.name || "");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptDataUrl(String(reader.result || ""));
    reader.onerror = () => setError("The selected receipt image could not be read.");
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Auth Check
    const token = typeof window !== "undefined" ? localStorage.getItem("ustaadpro_token") : null;
    if (!user || !token) {
      setError("Please sign in or create an account to place your booking.");
      setAuthModalMode("login");
      return;
    }

    // Validations
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    const hasSpecificAddress = !!specificAddress.trim();

    if (!hasMapLocation && !hasSpecificAddress) {
      setAddressTouched(true);
      return;
    }

    if (hasSpecificAddress && addressFieldError) {
      setAddressTouched(true);
      return;
    }

    if (!fromDate) {
      setScheduleError("Please select a service date.");
      return;
    }
    if (!selectedTime) {
      setScheduleError("Please select a 30-minute time slot from the grid.");
      return;
    }
    const selectedDateTime = bookingTimestamp(fromDate, selectedTime);
    if (!Number.isFinite(selectedDateTime) || selectedDateTime < earliestBookingTimestamp(minimumBookingLeadHours)) {
      setScheduleError(minimumBookingLeadHours > 0 ? `Please choose a time at least ${minimumBookingLeadHours} hour(s) from now.` : "Please choose a future date and time.");
      return;
    }
    setScheduleError("");
    // Service area check: block if map coords are outside RWP+ISB
    if (addressCoords && !isWithinServiceArea(addressCoords.lat, addressCoords.lng)) {
      setError("📍 This location is outside our service area. We currently only serve Rawalpindi & Islamabad. Please pick a location within the service area.");
      return;
    }

    if (step === "details") {
      setQuoteLoading(true);
      try {
        const settingsResponse = await fetch(`${API_BASE}/api/settings`, { cache: "no-store" });
        if (!settingsResponse.ok) throw new Error("Live billing settings could not be loaded.");
        const settings = await settingsResponse.json() as { inspectionFee?: number; serviceTaxPercent?: number; minimumBookingLeadHours?: number };
        setInspectionFee(Math.max(0, Number(settings.inspectionFee || 0)));
        setServiceTaxPercent(Math.max(0, Number(settings.serviceTaxPercent || 0)));
        setMinimumBookingLeadHours(clampBookingLeadHours(settings.minimumBookingLeadHours));
        const currentPrices = await Promise.all(selectedServices.map(async (item) => {
          const response = await fetch(`${API_BASE}/api/services/${encodeURIComponent(String(item.id))}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Current pricing for ${item.title} could not be loaded.`);
          const current = await response.json() as { price?: number; workPrices?: Array<{ id: string | number; price: number }> };
          const work = item.selectedWorkPriceId ? current.workPrices?.find((entry) => String(entry.id) === String(item.selectedWorkPriceId)) : undefined;
          const price = Number(work?.price ?? current.price);
          if (!Number.isFinite(price)) throw new Error(`Current pricing for ${item.title} is invalid.`);
          return [`${item.id}:${item.selectedWorkPriceId || "service"}`, price] as const;
        }));
        setLivePrices(Object.fromEntries(currentPrices));
        setStep("payment");
      } catch (quoteError) {
        setError(quoteError instanceof Error ? quoteError.message : "The live bill could not be prepared.");
      } finally {
        setQuoteLoading(false);
      }
      return;
    }

    if (paymentNow > 0 && !receiptDataUrl) {
      setError("Please upload the receipt for your booking payment.");
      return;
    }

    setLoading(true);

    try {
      const addressParts = [];
      if (specificAddress.trim()) addressParts.push(specificAddress.trim());
      if (selectedLocation.trim()) addressParts.push(selectedLocation.trim());
      const completeAddress = addressParts.join(" · ");
      const items: ServiceItemInput[] = selectedServices.map((item) => {
        const workIdNum = Number(item.selectedWorkPriceId);
        return {
          serviceId: item.id,
          serviceTitle: item.title,
          servicePrice: Number(item.price),
          workPriceId: !isNaN(workIdNum) && workIdNum > 0 ? workIdNum : undefined,
          workTitle: item.selectedWorkTitle || undefined,
          quantity: Math.max(1, Math.min(10, Number(item.quantity || 1))),
        };
      });

      // const noteWithReceipt = receiptDataUrl
      //   ? `${requirements.trim()}\n[EasyPaisa Payment Screenshot Attached: ${receiptFileName || "receipt.png"}]`.trim()
      //   : requirements.trim();

      const noteWithReceipt = requirements.trim();


      // 1. Submit Booking
      const response = await createBooking({
        name: name.trim(),
        phone: phone.trim(),
        address: completeAddress,
        addressLat: addressCoords?.lat,
        addressLng: addressCoords?.lng,
        date: fromDate,
        time: selectedTime,
        requirements: noteWithReceipt,
        items,
        paymentMethod,
        recurringOccurrences: daysCount,
        useRewardPoints: useRewardPoints && rewardEligible,
        inspectionFee,
        tax: serviceTax,
      });

      if (response && response.order) {
        const orderId = response.order.id;
        const confirmedTotal = Number(response.order.total || calculatedTotal);
        const confirmedPaymentNow = paymentMethod === "Rs 200 Advance"
          ? Math.max(0, Math.min(200, confirmedTotal) - rewardDiscount)
          : Math.max(0, confirmedTotal - rewardDiscount);
        const confirmedCoveredAmount = paymentMethod === "Rs 200 Advance" ? Math.min(200, confirmedTotal) : confirmedTotal;
        let receiptUploaded = false;
        let receiptError = "";
        if (confirmedPaymentNow > 0) {
          try {
            await uploadPaymentReceipt(orderId, receiptDataUrl, confirmedPaymentNow, receiptFileName);
            receiptUploaded = true;
          } catch (uploadError) {
            receiptError = uploadError instanceof Error ? uploadError.message : "Receipt upload failed.";
          }
        } else {
          receiptUploaded = true;
        }

        setBookingSuccess({
          orderId,
          total: confirmedTotal,
          receiptUploaded,
          receiptError,
          paidAmount: confirmedCoveredAmount,
          remainingAmount: Math.max(0, confirmedTotal - confirmedCoveredAmount),
          rewardApplied: useRewardPoints && rewardEligible,
        });
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        showSuccessToast(`${service.title} has been booked successfully.`);
        onBookingComplete?.();

        // Local storage backup
        try {
          const stored = JSON.parse(localStorage.getItem("ustaadpro_bookings") || "[]");
          localStorage.setItem(
            "ustaadpro_bookings",
            JSON.stringify([
              {
                id: orderId,
                serviceTitle: selectedServices.map((item) => item.selectedWorkTitle || item.title).join(", "),
                servicePrice: calculatedTotal,
                status: response.order.status || "confirmed",
                createdAt: new Date().toISOString(),
                customerName: name,
                phone,
                address: completeAddress,
                paymentMethod,
                recurringDays: daysCount,
                quantity: selectedServices.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
                // receiptDataUrl: receiptDataUrl || undefined,
              },
              ...stored,
            ])
          );
        } catch {
          // ignore storage error
        }
      } else {
        throw new Error("Failed to retrieve booking confirmation.");
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not place booking. Please check your inputs and try again.";
      const isSessionError =
        err.response?.status === 401 ||
        msg.includes("session") ||
        msg.includes("orders_user_id_fkey") ||
        msg.includes("foreign key constraint");

      if (isSessionError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ustaadpro_token");
          localStorage.removeItem("ustaadpro_user");
        }
        setError("Your login session has expired. Please sign in to complete your booking.");
        setAuthModalMode("login");
      } else if (/choose.*time|hour\(s\).*from now|booking time/i.test(msg)) {
        setScheduleError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setBookingSuccess(null);
    setError("");
    setAddressTouched(false);
    setStep("details");
    onClose();
  };

  const saveBookingDraft = () => {
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({
      name, phone, selectedLocation, specificAddress, requirements, selectedTime,
      fromDate, toDate, isRecurring, addressCoords,
    }));
  };

  const addMoreServices = () => {
    saveBookingDraft();
    selectedServices.filter((item) => !cartItems.some((cartItem) => cartItem.key === `${item.id}:${item.selectedWorkPriceId || "service"}`)).forEach((item) => addService({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: Math.max(1, Number(item.quantity || 1)),
      selectedWorkPriceId: item.selectedWorkPriceId,
      selectedWorkTitle: item.selectedWorkTitle,
      unitDescription: item.unitDescription,
    }));
    onClose();
    router.push("/services");
  };

  const editService = (id: string | number) => {
    saveBookingDraft();
    onClose();
    router.push(`/services/${encodeURIComponent(String(id))}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative mx-1 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all sm:mx-0 sm:rounded-[2rem]">
          <div className="z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{step === "details" ? "Booking details" : "Review & payment"}</h2>
              <p className="text-xs font-bold text-emerald-600 truncate max-w-xs">Step {step === "details" ? "1" : "2"} of 2 · {selectedServices.length > 1 ? `${selectedServices.length} services selected` : service.title}</p>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain booking-modal-scrollbar">
          {bookingSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Payment Submitted!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your payment and service request were submitted. Admin will verify the payment and process your booking. You will be notified shortly.
              </p>

              {/* Order Reference Box */}
              <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Booking Reference ID</p>
                <p className="text-2xl font-black text-emerald-700">{bookingSuccess.orderId}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-xs">
                  <div><p className="text-slate-400">Listed total</p><p className="font-black text-slate-800">Rs {bookingSuccess.total.toLocaleString("en-PK")}</p></div>
                  <div><p className="text-slate-400">Paid</p><p className="font-black text-emerald-700">Rs {bookingSuccess.paidAmount.toLocaleString("en-PK")}</p></div>
                  <div><p className="text-slate-400">Pay professional</p><p className="font-black text-slate-800">Rs {bookingSuccess.remainingAmount.toLocaleString("en-PK")}</p></div>
                </div>
                {isInspectionService && <p className="mt-2 text-[11px] text-slate-600">This covers the listed visit/inspection charge. Any labour, repair, parts, or materials quoted after inspection are separate and can be paid to the provided EasyPaisa account after you approve the work.</p>}
                {bookingSuccess.rewardApplied && (
                  <p className="text-[11px] font-bold text-violet-700 flex items-center justify-center gap-1 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PKR 200 loyalty reward redeemed successfully.
                  </p>
                )}
                {bookingSuccess.receiptUploaded && (!bookingSuccess.rewardApplied || bookingSuccess.paidAmount > 200) && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment receipt submitted for verification.
                  </p>
                )}
                {bookingSuccess.receiptError && (
                  <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    Your booking was created, but the receipt was not uploaded: {bookingSuccess.receiptError} Use Track Booking to retry—do not create another booking.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                Done & Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-4 bg-slate-50/40 p-3 sm:p-5 lg:grid-cols-2 lg:gap-5 lg:p-6">
              {/* Auth Notice if guest */}
              {!user && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Sign in required to confirm your order.</span>
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
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 lg:col-span-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Summary Card */}
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Selected service{selectedServices.length === 1 ? "" : "s"}</p>
                  <p className="text-sm font-black text-emerald-700">Rs {listedServicesTotal.toLocaleString()}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedServices.map((item) => {
                    const itemQuantity = Math.max(1, Number(item.quantity || 1));
                    const key = `${item.id}:${item.selectedWorkPriceId || "service"}`;
                    const cartItem = cartItems.find((entry) => entry.key === key);
                    return <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate font-black text-slate-900">{item.selectedWorkTitle || item.title}</p><p className="mt-0.5 text-xs text-slate-500">Rs {Number(item.price).toLocaleString("en-PK")} each</p></div>
                        <p className="shrink-0 font-black text-emerald-700">Rs {(item.price * itemQuantity).toLocaleString("en-PK")}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                        {cartItem ? <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                          <button type="button" onClick={() => updateQuantity(key, itemQuantity - 1)} className="grid h-8 w-8 place-items-center" aria-label={`Decrease ${item.title} quantity`}><Minus className="h-3 w-3" /></button>
                          <span className="w-8 text-center text-xs font-black">{itemQuantity}</span>
                          <button type="button" onClick={() => updateQuantity(key, itemQuantity + 1)} className="grid h-8 w-8 place-items-center" aria-label={`Increase ${item.title} quantity`}><Plus className="h-3 w-3" /></button>
                        </div> : <span className="text-xs font-bold text-slate-500">Quantity {itemQuantity}</span>}
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => editService(item.id)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Edit</button>
                          {cartItem && selectedServices.length > 1 && <button type="button" onClick={() => removeService(key)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.title}`}><Trash2 className="h-4 w-4" /></button>}
                        </div>
                      </div>
                    </article>;
                  })}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Service subtotal</span><strong>Rs {serviceSubtotal.toLocaleString("en-PK")}</strong></div>
                  <div className="flex justify-between"><span>Inspection/service charge</span><strong>Rs {inspectionFee.toLocaleString("en-PK")}</strong></div>
                  <div className="flex justify-between"><span>Service tax ({serviceTaxPercent}%)</span><strong>Rs {serviceTax.toLocaleString("en-PK")}</strong></div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm text-slate-900"><span className="font-black">Final total</span><strong className="text-emerald-700">Rs {calculatedTotal.toLocaleString("en-PK")}</strong></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={addMoreServices} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">+ Add more services</button>
                  {step === "payment" && <button type="button" onClick={() => { setStep("details"); setReceiptDataUrl(""); setReceiptFileName(""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Back to modify details</button>}
                </div>
                {step === "payment" && <p className="mt-2 text-[10px] text-slate-400">Live prices and fees were refreshed from the UstaadPro API. The backend confirms the authoritative total when the order is submitted.</p>}
              </div>

              {step === "payment" && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900">Shared booking details</h3><button type="button" onClick={() => { setStep("details"); setReceiptDataUrl(""); setReceiptFileName(""); }} className="text-xs font-bold text-emerald-700 hover:underline">Modify details</button></div>
                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Customer</p><p className="mt-1 font-semibold text-slate-800">{name} · {phone}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Address</p><p className="mt-1 font-semibold text-slate-800">{[specificAddress, selectedLocation].filter(Boolean).join(" · ")}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Schedule</p><p className="mt-1 font-semibold text-slate-800">{fromDate} at {selectedTime}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Applies to</p><p className="mt-1 font-semibold text-slate-800">All {selectedServices.length} selected services</p></div>
                </div>
              </div>}

              {/* Contact Information */}
              <div className={`${step === "details" ? "" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}>
                <h3 className="mb-3 text-sm font-black text-slate-900">Your contact details</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Raja Sajawal"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* FEATURE 3: Address & Map Picker */}
              <div className={`${step === "details" ? "" : "hidden"} space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}>
                <h3 className="text-sm font-black text-slate-900">Where should we send the professional?</h3>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Service Location{!specificAddress.trim() && " *"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Pick from Map
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={selectedLocation}
                    placeholder="Pick a location from the map"
                    className="w-full cursor-default rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600"
                  />
                </div>

                {hasMapLocation && (
                  <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <p><strong>Help the professional find you:</strong> add your house or building number, street, flat/apartment number, floor, and a nearby landmark below.</p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    House / Street Address{!(selectedLocation.trim() && addressCoords) && " *"}
                  </label>
                  <input
                    type="text"
                    required={!(selectedLocation.trim() && addressCoords)}
                    value={specificAddress}
                    onChange={(e) => {
                      setSpecificAddress(e.target.value);
                      if (e.target.value) setAddressTouched(true);
                    }}
                    onBlur={() => setAddressTouched(true)}
                    aria-invalid={addressTouched && Boolean(addressFieldError)}
                    aria-describedby="specific-address-help"
                    placeholder="House 12, Street 4, Flat 3, blue gate…"
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${addressTouched && addressFieldError ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`}
                  />
                  <div id="specific-address-help" aria-live="polite">
                    {addressTouched && addressFieldError ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] font-semibold text-red-600">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {addressFieldError}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">This is combined with the selected location and coordinates as one address.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${step === "details" ? "" : "hidden"} space-y-4`}>
                <h3 className="text-sm font-black text-slate-900">Choose booking date</h3>
                {/* FEATURE 2: Recurring Booking Picker */}
                <RecurringPicker
                  isRecurring={isRecurring}
                  onToggleRecurring={setIsRecurring}
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                  unitPrice={unitPrice * quantity}
                  minimumDate={pakistanDateAndTime(earliestBookingTimestamp(minimumBookingLeadHours)).date}
                />

              {/* Date selection if One Time */}
              {!isRecurring && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Service Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={pakistanDateAndTime(earliestBookingTimestamp(minimumBookingLeadHours)).date}
                      value={fromDate}
                      onChange={(e) => {
                        if (e.target.value < pakistanDateAndTime(earliestBookingTimestamp(minimumBookingLeadHours)).date) return;
                        setFromDate(e.target.value);
                        setToDate(e.target.value);
                        setSelectedTime("");
                        setScheduleError("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
              </div>

              {/* FEATURE 1: 30-Min Time Slot Picker Grid */}
              <div className={`${step === "details" ? "" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}>
                <TimeSlotPicker selectedDate={fromDate} selectedTime={selectedTime} minimumBookingLeadHours={minimumBookingLeadHours} error={scheduleError} onSelectTime={(time) => { setSelectedTime(time); setScheduleError(""); }} />
              </div>

              {/* FEATURE 4: Payment Option & EasyPaisa Receipt Upload */}
              {step === "payment" && <div className="lg:col-span-2">
                <EasyPaisaPaymentSection
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={(method) => { setPaymentMethod(method); setReceiptDataUrl(""); setReceiptFileName(""); }}
                  total={calculatedTotal}
                  receiptFileName={receiptFileName}
                  onReceiptSelect={handleReceiptSelect}
                  rewardEligible={rewardEligible}
                  rewardLoading={rewardLoading}
                  useRewardPoints={useRewardPoints && rewardEligible}
                  onUseRewardPointsChange={(value) => { setUseRewardPoints(value); setReceiptDataUrl(""); setReceiptFileName(""); }}
                />
              </div>}

              {/* Special Instructions */}
              <div className={`${step === "details" ? "" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2`}>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Requirements / Special Instructions
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Describe your issue, floor number, gate code, etc. (optional)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 lg:col-span-2">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In to Complete Booking
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || quoteLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loading || quoteLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {quoteLoading ? "Preparing live bill..." : "Submitting Booking..."}
                      </>
                    ) : (
                      step === "details" ? "Proceed to payment" : paymentNow > 0 ? `Pay Rs ${paymentNow.toLocaleString()} & Confirm Booking` : "Redeem Reward & Confirm Booking"
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Feature 3: Leaflet Map Modal */}
      <MapAddressPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={selectedLocation}
        onSelectAddress={(newAddress, lat, lng) => {
          setSelectedLocation(newAddress);
          if (lat !== undefined && lng !== undefined) {
            setAddressCoords({ lat, lng });
          }
        }}
      />
    </>
  );
}
