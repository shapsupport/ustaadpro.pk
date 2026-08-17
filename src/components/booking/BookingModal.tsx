"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ArrowLeft,
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
import { bookingTimestamp, clampBookingLeadHours, earliestBookingTimestamp, nextAvailableBookingDate, pakistanDateAndTime } from "@/lib/booking-time";
import { calculateRewards } from "@/lib/rewards";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const BOOKING_DRAFT_KEY = "ustaadpro_booking_draft";
const CHECKOUT_SELECTION_KEY = "ustaadpro_service_checkout";

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
  pageMode?: boolean;
}

function getTodayString() {
  return nextAvailableBookingDate(0);
}

function addDays(date: string, days: number) {
  const timestamp = new Date(`${date}T12:00:00+05:00`).getTime() + days * 24 * 60 * 60 * 1000;
  return pakistanDateAndTime(timestamp).date;
}

function dateCardLabel(date: string, index: number) {
  const value = new Date(`${date}T12:00:00+05:00`);
  return {
    eyebrow: index === 0 ? "Next available" : new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(value),
    date: new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", month: "short", day: "numeric" }).format(value),
  };
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

export default function BookingModal({ isOpen, onClose, service, services, onBookingComplete, pageMode = false }: BookingModalProps) {
  const { user, updateUser, setAuthModalMode } = useAuth();
  const router = useRouter();
  const { items: cartItems, addService, updateQuantity, removeService } = useServiceCart();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const contactCardRef = useRef<HTMLDivElement>(null);
  const addressCardRef = useRef<HTMLDivElement>(null);
  const scheduleCardRef = useRef<HTMLDivElement>(null);
  const receiptAreaRef = useRef<HTMLDivElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const [validationFocus, setValidationFocus] = useState<{ target: "contact" | "address" | "schedule" | "receipt"; attempt: number } | null>(null);

  useEffect(() => {
    if (!isOpen || pageMode) return;
    const selection = JSON.stringify(services?.length ? services : [service]);
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, selection);
    localStorage.setItem(CHECKOUT_SELECTION_KEY, selection);
    router.push("/service-checkout");
    onClose();
  }, [isOpen, pageMode, onClose, router, service, services]);

  // Basic Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [invalidContact, setInvalidContact] = useState<{ name?: boolean; phone?: boolean }>({});

  // Feature 1: Time Slot State
  const [selectedTime, setSelectedTime] = useState("");
  const [minimumBookingLeadHours, setMinimumBookingLeadHours] = useState(0);
  const [inspectionFee, setInspectionFee] = useState(0);
  const [serviceTaxPercent, setServiceTaxPercent] = useState(0);
  const [rewardSettings, setRewardSettings] = useState({ rewardEnabled: true, rewardPointValue: 25, rewardMinimumRedeem: 100, serviceRewardMaxDiscountPercent: 10 });
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/settings`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((settings: { minimumBookingLeadHours?: number; inspectionFee?: number; serviceTaxPercent?: number; rewardEnabled?: boolean; rewardPointValue?: number; rewardMinimumRedeem?: number; serviceRewardMaxDiscountPercent?: number }) => {
        const leadHours = clampBookingLeadHours(settings.minimumBookingLeadHours);
        const minimumDate = nextAvailableBookingDate(leadHours);
        setMinimumBookingLeadHours(leadHours);
        if (fromDate < minimumDate) {
          setFromDate(minimumDate);
          setToDate(minimumDate);
          setSelectedTime("");
        }
        setInspectionFee(Math.max(0, Number(settings.inspectionFee || 0)));
        setServiceTaxPercent(Math.max(0, Number(settings.serviceTaxPercent || 0)));
        setRewardSettings({
          rewardEnabled: settings.rewardEnabled !== false,
          rewardPointValue: Math.max(1, Number(settings.rewardPointValue || 25)),
          rewardMinimumRedeem: Math.max(0, Number(settings.rewardMinimumRedeem || 100)),
          serviceRewardMaxDiscountPercent: Math.max(0, Number(settings.serviceRewardMaxDiscountPercent || 10)),
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isOpen]);

  // Feature 2: Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [fromDate, setFromDate] = useState(getTodayString());
  const [toDate, setToDate] = useState(getTodayString());
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Feature 3: Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Coordinates from map picker (null = manual address)
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Feature 4: Payment & Receipt State
  const [paymentMethod, setPaymentMethod] = useState<"Rs 200 Advance" | "Full Payment in Advance">("Rs 200 Advance");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptValidationError, setReceiptValidationError] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
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
      setUseWalletBalance(false);
      return;
    }
    setRewardLoading(true);
    getProfile()
      .then((profile) => { setRewardPoints(Number(profile.rewardPoints || 0)); setWalletBalance(Number(profile.walletBalance || 0)); updateUser(profile); })
      .catch(() => { setRewardPoints(Number(user.rewardPoints || 0)); setWalletBalance(Number(user.walletBalance || 0)); })
      .finally(() => setRewardLoading(false));
  }, [isOpen, updateUser, user]);

  // Derived Calculations
  const baseSelectedServices = services?.length ? services : [service];
  const selectedServices = baseSelectedServices.map((item) => {
    const key = `${item.id}:${item.selectedWorkPriceId || "service"}`;
    const currentCartItem = cartItems.find((entry) => entry.key === key);
    return {
      ...item,
      quantity: currentCartItem?.quantity ?? item.quantity,
      price: livePrices[key] ?? item.price,
    };
  });
  const unitPrice = service.price;
  const quantity = Math.max(1, Math.min(10, Number(service.quantity || 1)));
  const daysCount = useMemo(
    () => (isRecurring ? calculateDaysCount(fromDate, toDate) : 1),
    [isRecurring, fromDate, toDate]
  );
  const listedServicesTotal = selectedServices.reduce((sum, item) => sum + Number(item.price) * Math.max(1, Math.min(10, Number(item.quantity || 1))), 0);
  const serviceSubtotal = listedServicesTotal * daysCount;
  const reward = calculateRewards({ enabled: rewardSettings.rewardEnabled && Boolean(user), points: rewardPoints, pointValue: rewardSettings.rewardPointValue, minimumRedeem: rewardSettings.rewardMinimumRedeem, subtotal: serviceSubtotal, maxDiscountPercent: rewardSettings.serviceRewardMaxDiscountPercent });
  const rewardEligible = reward.canRedeem;
  const rewardDiscount = useRewardPoints && reward.canRedeem ? reward.redeemableValue : 0;
  const afterRewardSubtotal = Math.max(0, serviceSubtotal - rewardDiscount);
  const fullAdvanceDiscount = paymentMethod === "Full Payment in Advance" ? Math.round(afterRewardSubtotal * 0.05) : 0;
  const taxableSubtotal = Math.max(0, afterRewardSubtotal - fullAdvanceDiscount);
  const serviceTax = taxableSubtotal * serviceTaxPercent / 100;
  const totalBeforeWallet = taxableSubtotal + inspectionFee + serviceTax;
  const walletAdjustment = useWalletBalance ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const calculatedTotal = Math.max(0, totalBeforeWallet - walletAdjustment);
  const paymentNow = paymentMethod === "Rs 200 Advance"
    ? Math.max(0, Math.min(200, calculatedTotal) - rewardDiscount)
    : Math.max(0, calculatedTotal - rewardDiscount);
  const isInspectionService = selectedServices.some((item) => /visit|inspection/i.test(item.unitDescription || ""));
  const hasMapLocation = Boolean(selectedLocation.trim() && addressCoords);
  const addressFieldError = validateSpecificAddress(specificAddress, hasMapLocation);
  const minimumBookingDate = nextAvailableBookingDate(minimumBookingLeadHours);
  const quickBookingDates = useMemo(
    () => Array.from({ length: 5 }, (_, index) => addDays(minimumBookingDate, index)),
    [minimumBookingDate],
  );

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => modalBodyRef.current?.scrollTo({ top: 0 }));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, step]);

  useEffect(() => {
    if (!validationFocus) return;
    const targets = { contact: contactCardRef, address: addressCardRef, schedule: scheduleCardRef, receipt: receiptAreaRef };
    const frame = window.requestAnimationFrame(() => {
      const container = modalBodyRef.current;
      const target = targets[validationFocus.target].current;
      if (!target) return;
      if (pageMode) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const field = target.querySelector<HTMLElement>("input, button, textarea, [tabindex]");
        window.setTimeout(() => field?.focus({ preventScroll: true }), 350);
        return;
      }
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = container.scrollTop + targetRect.top - containerRect.top - 12;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [validationFocus, pageMode]);

  useEffect(() => {
    if (!error || validationFocus) return;
    errorAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, validationFocus]);

  const focusValidationCard = (target: "contact" | "address" | "schedule" | "receipt") => {
    setValidationFocus((current) => ({ target, attempt: (current?.attempt || 0) + 1 }));
  };

  const handleReceiptSelect = (file: File | null) => {
    setReceiptDataUrl("");
    setReceiptFileName(file?.name || "");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setReceiptFileName("");
      setReceiptValidationError(true);
      setError("Please upload a JPG, PNG, or WebP receipt image.");
      focusValidationCard("receipt");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReceiptFileName("");
      setReceiptValidationError(true);
      setError("The receipt image must be 5 MB or smaller.");
      focusValidationCard("receipt");
      return;
    }
    setReceiptValidationError(false);
    setError("");
    const reader = new FileReader();
    reader.onload = () => setReceiptDataUrl(String(reader.result || ""));
    reader.onerror = () => {
      setError("The selected receipt image could not be read.");
      focusValidationCard("receipt");
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || (!pageMode && isOpen)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationFocus(null);
    setInvalidContact({});

    // Auth Check
    const token = typeof window !== "undefined" ? localStorage.getItem("ustaadpro_token") : null;
    if (!user || !token) {
      setError("Please sign in or create an account to place your booking.");
      setValidationFocus(null);
      setAuthModalMode("login");
      return;
    }

    // Validations
    if (!name.trim()) {
      setInvalidContact({ name: true });
      setError("Please enter your full name.");
      focusValidationCard("contact");
      return;
    }
    if (!phone.trim()) {
      setInvalidContact({ phone: true });
      setError("Please enter your phone number.");
      focusValidationCard("contact");
      return;
    }

    const hasSpecificAddress = !!specificAddress.trim();

    if (!hasMapLocation && !hasSpecificAddress) {
      setAddressTouched(true);
      focusValidationCard("address");
      return;
    }

    if (hasSpecificAddress && addressFieldError) {
      setAddressTouched(true);
      focusValidationCard("address");
      return;
    }

    if (!fromDate) {
      setScheduleError("Please select a service date.");
      if (step === "payment") setStep("details");
      focusValidationCard("schedule");
      return;
    }
    if (!selectedTime) {
      setScheduleError("Please select a 30-minute time slot from the grid.");
      if (step === "payment") setStep("details");
      focusValidationCard("schedule");
      return;
    }
    const selectedDateTime = bookingTimestamp(fromDate, selectedTime);
    if (!Number.isFinite(selectedDateTime) || selectedDateTime < earliestBookingTimestamp(minimumBookingLeadHours)) {
      setScheduleError(minimumBookingLeadHours > 0 ? `Please choose a time at least ${minimumBookingLeadHours} hour(s) from now.` : "Please choose a future date and time.");
      if (step === "payment") setStep("details");
      focusValidationCard("schedule");
      return;
    }
    setScheduleError("");
    // Service area check: block if map coords are outside RWP+ISB
    if (addressCoords && !isWithinServiceArea(addressCoords.lat, addressCoords.lng)) {
      setAddressTouched(true);
      setError("📍 This location is outside our service area. We currently only serve Rawalpindi & Islamabad. Please pick a location within the service area.");
      focusValidationCard("address");
      return;
    }

    if (step === "details" && !pageMode) {
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
      setReceiptValidationError(true);
      focusValidationCard("receipt");
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
        useWalletBalance: useWalletBalance && walletBalance > 0,
        inspectionFee,
        tax: serviceTax,
      });

      if (response && response.order) {
        if (response.user) updateUser(response.user);
        const orderId = response.order.id;
        const confirmedTotal = Number(response.order.total || calculatedTotal);
        const confirmedPaymentNow = paymentMethod === "Rs 200 Advance"
          ? Math.max(0, Math.min(200, confirmedTotal))
          : Math.max(0, confirmedTotal);
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
        focusValidationCard("schedule");
      } else {
        setValidationFocus(null);
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
    setInvalidContact({});
    setReceiptValidationError(false);
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

  const returnToDetails = () => {
    setStep("details");
    setError("");
    setReceiptValidationError(false);
    setReceiptDataUrl("");
    setReceiptFileName("");
  };

  return (
    <>
      <div className={pageMode ? "min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8" : "fixed inset-0 z-50 flex touch-pan-y items-end justify-center overscroll-contain bg-slate-900/60 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"}>
        <div className={pageMode ? "relative mx-auto flex min-w-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl" : "relative flex max-h-[90dvh] min-w-0 w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"}>
          <div className={`${pageMode ? "sticky top-0" : ""} z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5`}>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {pageMode && (
                <button type="button" onClick={() => router.back()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Go back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {!pageMode && step === "payment" && (
                <button type="button" onClick={returnToDetails} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Back to booking details">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 sm:text-2xl">Complete your booking</h1>
                <p className="max-w-[16rem] truncate text-xs font-bold text-emerald-600 sm:max-w-xl">All details on one page · {selectedServices.length > 1 ? `${selectedServices.length} services selected` : service.title}</p>
              </div>
            </div>
            {pageMode && <button type="button" onClick={addMoreServices} className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 sm:inline-flex">Book other services</button>}
            <button
              type="button"
              onClick={handleModalClose}
              className={`${pageMode ? "hidden" : ""} rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div ref={modalBodyRef} className={pageMode ? "min-w-0 overflow-x-hidden" : "min-w-0 max-h-[calc(100dvh-4.25rem)] overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [overflow-anchor:none] booking-modal-scrollbar sm:max-h-[calc(94dvh-4.5rem)]"}>
          {bookingSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Order placed successfully!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your booking has been received. Track its status anytime from Track Booking while our team verifies the payment and assigns a professional.
              </p>
              <div className="mx-auto flex max-w-lg items-center justify-center gap-2 text-[11px] font-bold text-slate-500 sm:text-xs">
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">1. Order placed</span>
                <span aria-hidden="true">→</span>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">2. Verification</span>
                <span aria-hidden="true">→</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">3. Professional assigned</span>
              </div>

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

              <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => router.push("/track-booking")} className="rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
                  Track this booking
                </button>
                <button type="button" onClick={() => router.push("/services")} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                  Book another service
                </button>
              </div>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className={step === "details" || pageMode
                ? "grid min-w-0 grid-cols-1 content-start gap-3 overflow-x-hidden bg-slate-50/40 p-3 sm:p-5 lg:grid-cols-2 lg:gap-5"
                : "flex min-w-0 flex-col gap-3 overflow-x-hidden bg-slate-50/40 p-3 sm:p-4"}
            >
              <p className="text-right text-[11px] font-semibold text-slate-500 lg:col-span-2"><span className="font-black text-red-500">*</span> Required fields</p>
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
                <div ref={errorAlertRef} role="alert" tabIndex={-1} className="flex scroll-mt-6 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 outline-none lg:col-span-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="min-w-0 break-words leading-5">{error}</span>
                </div>
              )}

              {/* Service Summary Card */}
              <div className={`rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm sm:p-4 ${step === "payment" && !pageMode ? "lg:col-span-2" : "lg:row-span-2 lg:h-full lg:self-stretch"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Selected service{selectedServices.length === 1 ? "" : "s"}</p>
                  <p className="text-sm font-black text-emerald-700">Rs {listedServicesTotal.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedServices.map((item) => {
                    const itemQuantity = Math.max(1, Number(item.quantity || 1));
                    const key = `${item.id}:${item.selectedWorkPriceId || "service"}`;
                    const cartItem = cartItems.find((entry) => entry.key === key);
                    return <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:gap-4">
                        <p className="min-w-0 break-words text-xs font-black leading-4 text-slate-900 sm:text-sm">{item.selectedWorkTitle || item.title}</p>
                        <div className="min-w-16 text-right sm:min-w-24"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[9px]">Unit price</p><p className="whitespace-nowrap text-[11px] font-semibold text-slate-600 sm:text-xs">Rs {Number(item.price).toLocaleString("en-PK")} each</p></div>
                        <div className="min-w-14 text-right sm:min-w-20"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[9px]">Total</p><p className="whitespace-nowrap text-xs font-black text-emerald-700 sm:text-sm">Rs {(item.price * itemQuantity).toLocaleString("en-PK")}</p></div>
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
                  {rewardDiscount > 0 && <div className="flex justify-between font-bold text-violet-700"><span>Reward discount ({reward.redeemablePoints} pts)</span><strong>- Rs {rewardDiscount.toLocaleString("en-PK")}</strong></div>}
                  {fullAdvanceDiscount > 0 && <div className="flex justify-between font-bold text-emerald-700"><span>Full advance discount (5%)</span><strong>- Rs {fullAdvanceDiscount.toLocaleString("en-PK")}</strong></div>}
                  <div className="flex justify-between"><span>Inspection/service charge</span><strong>Rs {inspectionFee.toLocaleString("en-PK")}</strong></div>
                  <div className="flex justify-between"><span>Service tax ({serviceTaxPercent}%)</span><strong>Rs {serviceTax.toLocaleString("en-PK")}</strong></div>
                  {walletAdjustment > 0 && <div className="flex justify-between font-bold text-emerald-700"><span>Wallet balance applied</span><strong>- Rs {walletAdjustment.toLocaleString("en-PK")}</strong></div>}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm text-slate-900"><span className="font-black">Final total</span><strong className="text-emerald-700">Rs {calculatedTotal.toLocaleString("en-PK")}</strong></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={addMoreServices} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">+ Add more services</button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">The backend confirms the authoritative total when the order is submitted.</p>
              </div>

              {step === "payment" && !pageMode && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900">Shared booking details</h3><button type="button" onClick={returnToDetails} className="text-xs font-bold text-emerald-700 hover:underline">Modify details</button></div>
                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Customer</p><p className="mt-1 font-semibold text-slate-800">{name} · {phone}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Address</p><p className="mt-1 font-semibold text-slate-800">{[specificAddress, selectedLocation].filter(Boolean).join(" · ")}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Schedule</p><p className="mt-1 font-semibold text-slate-800">{fromDate} at {selectedTime}</p></div>
                  <div><p className="font-bold uppercase tracking-wide text-slate-400">Applies to</p><p className="mt-1 font-semibold text-slate-800">All {selectedServices.length} selected services</p></div>
                </div>
              </div>}

              {/* Contact Information */}
              <div ref={contactCardRef} className={`${step === "details" || pageMode ? "lg:col-start-2" : "hidden"} rounded-2xl border bg-white p-4 shadow-sm transition ${invalidContact.name || invalidContact.phone ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}>
                <h3 className="mb-3 text-sm font-black text-slate-900">Your contact details</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setInvalidContact((current) => ({ ...current, name: false })); }}
                      placeholder="e.g. Raja Sajawal"
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 ${invalidContact.name ? "border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (e.target.value.trim()) setInvalidContact((current) => ({ ...current, phone: false })); }}
                      placeholder="0300-1234567"
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 ${invalidContact.phone ? "border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"}`}
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* FEATURE 3: Address & Map Picker */}
              <div ref={addressCardRef} className={`${step === "details" || pageMode ? "lg:col-start-2" : "hidden"} space-y-3 rounded-2xl border bg-white p-4 shadow-sm transition ${addressTouched && (addressFieldError || error.includes("outside our service area")) ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}>
                <h3 className="text-sm font-black text-slate-900">Where should we send the professional?</h3>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Service Location (map){!specificAddress.trim() && <span className="text-red-500"> *</span>}
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
                    House / Street Address{!hasMapLocation && <span className="text-red-500"> *</span>}
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

              <div ref={scheduleCardRef} className={`${step === "details" || pageMode ? "" : "hidden"} space-y-4 rounded-2xl border bg-white p-4 shadow-sm transition lg:col-span-2 ${scheduleError ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}>
                <div><h3 className="text-sm font-black text-slate-900">Choose booking date & time</h3><p className="mt-1 text-xs text-slate-500">Select a date, recurrence preference, and an available arrival slot.</p></div>
                {/* FEATURE 2: Recurring Booking Picker */}
                <RecurringPicker
                  isRecurring={isRecurring}
                  onToggleRecurring={setIsRecurring}
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                  unitPrice={unitPrice * quantity}
                  minimumDate={nextAvailableBookingDate(minimumBookingLeadHours)}
                />

              {/* Date selection if One Time */}
              {!isRecurring && (
                <div className="space-y-3">
                  <label className="mb-1 block text-xs font-bold text-slate-600">Service Date <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {quickBookingDates.map((date, index) => {
                      const label = dateCardLabel(date, index);
                      const selected = fromDate === date && !showCustomDate;
                      return <button key={date} type="button" onClick={() => { setShowCustomDate(false); setFromDate(date); setToDate(date); setSelectedTime(""); setScheduleError(""); }} className={`rounded-xl border px-2 py-2.5 text-center transition ${selected ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"}`}>
                        <span className={`block text-[9px] font-bold uppercase tracking-wide ${selected ? "text-emerald-100" : "text-slate-400"}`}>{label.eyebrow}</span>
                        <span className="mt-0.5 block text-sm font-black">{label.date}</span>
                      </button>;
                    })}
                    <button type="button" onClick={() => setShowCustomDate(true)} className={`flex min-h-[3.75rem] items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-black transition ${showCustomDate || !quickBookingDates.includes(fromDate) ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300" : "border-dashed border-slate-300 bg-white text-slate-600 hover:border-emerald-400"}`}><Calendar className="h-4 w-4" />Custom date</button>
                  </div>
                  {(showCustomDate || !quickBookingDates.includes(fromDate)) && <div className="relative animate-in fade-in duration-150">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-emerald-600" />
                    <input
                      type="date"
                      required
                      min={minimumBookingDate}
                      value={fromDate}
                      onChange={(e) => {
                        if (e.target.value < minimumBookingDate) return;
                        setFromDate(e.target.value);
                        setToDate(e.target.value);
                        setSelectedTime("");
                        setScheduleError("");
                      }}
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>}
                </div>
              )}
                <div className="border-t border-slate-100 pt-4">
                <TimeSlotPicker selectedDate={fromDate} selectedTime={selectedTime} minimumBookingLeadHours={minimumBookingLeadHours} error={scheduleError} onSelectTime={(time) => { setSelectedTime(time); setScheduleError(""); }} />
                </div>
              </div>

              {/* FEATURE 4: Payment Option & EasyPaisa Receipt Upload */}
              {(step === "payment" || pageMode) && <div className="min-w-0 lg:col-span-2">
                <EasyPaisaPaymentSection
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={(method) => { setPaymentMethod(method); setReceiptDataUrl(""); setReceiptFileName(""); setReceiptValidationError(false); }}
                  total={calculatedTotal}
                  receiptFileName={receiptFileName}
                  onReceiptSelect={handleReceiptSelect}
                  receiptError={receiptValidationError}
                  receiptAreaRef={receiptAreaRef}
                  rewardEligible={rewardEligible}
                  rewardLoading={rewardLoading}
                  useRewardPoints={useRewardPoints && rewardEligible}
                  onUseRewardPointsChange={(value) => { setUseRewardPoints(value); setReceiptDataUrl(""); setReceiptFileName(""); setReceiptValidationError(false); }}
                  rewardPoints={reward.points}
                  rewardBalanceValue={reward.balanceValue}
                  rewardDiscount={rewardDiscount}
                  rewardRedeemablePoints={reward.redeemablePoints}
                  rewardHint={reward.canRedeem ? `Apply up to Rs ${reward.redeemableValue.toLocaleString("en-PK")} to this booking.` : reward.pointsNeeded > 0 ? `${reward.pointsNeeded} more point(s) needed to redeem rewards.` : `Reward discount is below the Rs ${reward.minimumRedeem.toLocaleString("en-PK")} minimum for this booking.`}
                  walletBalance={walletBalance}
                  walletAdjustment={walletAdjustment}
                  useWalletBalance={useWalletBalance}
                  onUseWalletBalanceChange={(value) => { setUseWalletBalance(value); setReceiptDataUrl(""); setReceiptFileName(""); setReceiptValidationError(false); }}
                />
              </div>}

              {/* Special Instructions */}
              <div className={`${step === "details" || pageMode ? "" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2`}>
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
                      paymentNow > 0 ? `Pay Rs ${paymentNow.toLocaleString()} & Confirm Booking` : "Redeem Reward & Confirm Booking"
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
