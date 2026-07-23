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
} from "lucide-react";
import { createBooking, uploadPaymentReceipt, ServiceItemInput } from "@/services/bookingService";
import { useAuth } from "@/context/AuthContext";
import TimeSlotPicker from "./TimeSlotPicker";
import RecurringPicker, { calculateDaysCount } from "./RecurringPicker";
import MapAddressPickerModal from "../location/MapAddressPickerModal";
import EasyPaisaPaymentSection from "./EasyPaisaPaymentSection";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string | number;
    title: string;
    price: number;
    selectedWorkPriceId?: number;
    selectedWorkTitle?: string;
  };
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingModal({ isOpen, onClose, service }: BookingModalProps) {
  const { user, setAuthModalMode } = useAuth();

  // Basic Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [requirements, setRequirements] = useState("");

  // Feature 1: Time Slot State
  const [selectedTime, setSelectedTime] = useState("10:00");

  // Feature 2: Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [fromDate, setFromDate] = useState(getTodayString());
  const [toDate, setToDate] = useState(getTodayString());

  // Feature 3: Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Feature 4: Payment & Receipt State
  const [paymentMethod, setPaymentMethod] = useState("Cash After Work Done");
  // const [receiptDataUrl, setReceiptDataUrl] = useState("");
  // const [receiptFileName, setReceiptFileName] = useState("");

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<{
    orderId: string;
    total: number;
    receiptUploaded?: boolean;
  } | null>(null);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  // Derived Calculations
  const unitPrice = service.price;
  const daysCount = useMemo(
    () => (isRecurring ? calculateDaysCount(fromDate, toDate) : 1),
    [isRecurring, fromDate, toDate]
  );
  const calculatedTotal = unitPrice * daysCount;

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
    if (!address.trim()) {
      setError("Please enter or pick your service address from the map.");
      return;
    }

    const addressValue = address.trim();

    // Minimum length check
    if (addressValue.length < 15) {
      setError("Please enter your complete address with house number, street, area and city.");
      return;
    }

    // Must contain a number (house/street number)
    if (!/\d/.test(addressValue)) {
      setError("Please include your house or street number in the address.");
      return;
    }

    // Must have at least 4 words (House, Street, Area, City)
    const addressWords = addressValue.split(/\s+/).filter(w => w.length > 1);
    if (addressWords.length < 4) {
      setError("Please enter complete address: house number, street, area/colony, and city/town/village.");
      return;
    }
    if (!fromDate) {
      setError("Please select a service date.");
      return;
    }
    if (!selectedTime) {
      setError("Please select a 30-minute time slot from the grid.");
      return;
    }

    setLoading(true);

    try {
      const workIdNum = Number(service.selectedWorkPriceId);
      const items: ServiceItemInput[] = [
        {
          serviceId: service.id,
          serviceTitle: service.title,
          servicePrice: unitPrice,
          workPriceId: !isNaN(workIdNum) && workIdNum > 0 ? workIdNum : undefined,
          workTitle: service.selectedWorkTitle || undefined,
          quantity: 1,
        },
      ];

      // const noteWithReceipt = receiptDataUrl
      //   ? `${requirements.trim()}\n[EasyPaisa Payment Screenshot Attached: ${receiptFileName || "receipt.png"}]`.trim()
      //   : requirements.trim();

      const noteWithReceipt = requirements.trim();


      // 1. Submit Booking
      const response = await createBooking({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        date: fromDate,
        time: selectedTime,
        requirements: noteWithReceipt,
        items,
        paymentMethod,
        recurringOccurrences: daysCount,
      });

      if (response && response.order) {
        const orderId = response.order.id;
        // let receiptUploaded = Boolean(receiptDataUrl);

        // if (receiptDataUrl) {
        //   try {
        //     await uploadPaymentReceipt(orderId, receiptDataUrl, calculatedTotal);
        //   } catch {
        //     // Backend stores receipt upon work completion; saved locally for track booking
        //   }
        // }

        setBookingSuccess({
          orderId,
          total: response.order.total || calculatedTotal,
        });

        // Local storage backup
        try {
          const stored = JSON.parse(localStorage.getItem("ustaadpro_bookings") || "[]");
          localStorage.setItem(
            "ustaadpro_bookings",
            JSON.stringify([
              {
                id: orderId,
                serviceTitle: service.title,
                servicePrice: calculatedTotal,
                status: response.order.status || "confirmed",
                createdAt: new Date().toISOString(),
                customerName: name,
                phone,
                address,
                paymentMethod,
                recurringDays: daysCount,
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
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl max-h-[85vh] mx-2 sm:mx-0 overflow-y-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl transition-all booking-modal-scrollbar">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Book Service</h2>
              <p className="text-xs font-bold text-emerald-600 truncate max-w-xs">{service.title}</p>
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
          {bookingSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Booking Confirmed!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your service request has been received. Our team will contact you shortly to dispatch your professional.
              </p>

              {/* Order Reference Box */}
              <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Booking Reference ID</p>
                <p className="text-2xl font-black text-emerald-700">{bookingSuccess.orderId}</p>
                <p className="text-xs font-bold text-slate-700 pt-1">
                  Total Payable: <span className="text-emerald-700">Rs {bookingSuccess.total.toLocaleString()}</span>
                </p>
                {bookingSuccess.receiptUploaded && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment receipt screenshot attached & verified!
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
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Auth Notice if guest */}
              {!user && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
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
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Summary Card */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Selected Service</p>
                  <p className="text-sm font-bold text-slate-800">
                    {service.selectedWorkTitle || service.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Unit Price</p>
                  <p className="text-sm font-black text-emerald-600">Rs {unitPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* FEATURE 3: Address & Map Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">Service Address *</label>
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
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Street #, Area or click 'Pick from Map'"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* FEATURE 2: Recurring Booking Picker */}
              <RecurringPicker
                isRecurring={isRecurring}
                onToggleRecurring={setIsRecurring}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                unitPrice={unitPrice}
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
                      min={getTodayString()}
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setToDate(e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* FEATURE 1: 30-Min Time Slot Picker Grid */}
              <TimeSlotPicker
                selectedDate={fromDate}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />

              {/* FEATURE 4: Payment Option & EasyPaisa Receipt Upload */}
              <EasyPaisaPaymentSection
                paymentMethod={paymentMethod}
                onSelectPaymentMethod={setPaymentMethod}
              />

              {/* Special Instructions */}
              <div>
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
              <div className="pt-2">
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
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting Booking...
                      </>
                    ) : (
                      `Confirm Booking (Rs ${calculatedTotal.toLocaleString()})`
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Feature 3: Leaflet Map Modal */}
      <MapAddressPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={address}
        onSelectAddress={(newAddress) => {
          setAddress(newAddress);
        }}
      />
    </>
  );
}
