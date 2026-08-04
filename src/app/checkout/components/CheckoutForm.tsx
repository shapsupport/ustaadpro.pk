"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import { CalendarDays, Clock3, MessageSquare, User, Phone, AlertCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationSection } from "./LocationSection";
import { PaymentSection } from "./PaymentSection";
import { useLocation } from "@/context/LocationContext";
import type { FormData, PaymentMethod } from "../types";
import { bookingTimestamp, clampBookingLeadHours, earliestBookingTimestamp, pakistanDateAndTime } from "@/lib/booking-time";

interface CheckoutFormProps {
  initialName: string;
  initialPhone: string;
  onSubmit: (
    formData: FormData,
    paymentMethod: PaymentMethod
  ) => void;
  isSubmitting: boolean;
  isShop?: boolean;
  minimumBookingLeadHours?: number;
  submitError?: string;
  onScheduleChange?: () => void;
}

export function CheckoutForm({
  initialName,
  initialPhone,
  onSubmit,
  isSubmitting,
  isShop = false,
  minimumBookingLeadHours = 0,
  submitError = "",
  onScheduleChange,
}: CheckoutFormProps) {
  const { location } = useLocation();

  const [formData, setFormData] = useState<FormData>({
    fullName: initialName,
    phone: initialPhone,
    houseNumber: "",
    landmark: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isShop ? "cod" : "Rs 200 Advance");
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const leadHours = clampBookingLeadHours(minimumBookingLeadHours);
  const earliestBookingTime = earliestBookingTimestamp(leadHours);
  const earliestBooking = pakistanDateAndTime(earliestBookingTime);
  const leadTimeError = leadHours > 0 ? `Please choose a time at least ${leadHours} hour(s) from now.` : "Please choose a future date and time.";
  const isUnavailableTime = (time: string) => !formData.preferredDate || bookingTimestamp(formData.preferredDate, time) < earliestBookingTime;
  const apiScheduleError = /choose.*time|future date and time|hour\(s\).*from now|booking time/i.test(submitError) ? submitError : "";
  const displayedScheduleError = scheduleError || apiScheduleError;

  const hasLocation =
    location.status === "serviceable" ||
    (Boolean(location.label) && !location.coords);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError("Please enter your full name and phone number.");
      return;
    }
    if (!hasLocation) {
      setError("Please select your service area before placing the order.");
      return;
    }
    if (!formData.houseNumber.trim() && !formData.landmark.trim()) {
      setError("Please add a house number or landmark so the technician can find you.");
      return;
    }
    if (!isShop) {
      if (!formData.preferredDate || !formData.preferredTime) {
        setScheduleError("Please choose both a service date and an arrival time.");
        return;
      }
      const selected = new Date(`${formData.preferredDate}T${formData.preferredTime}:00+05:00`);
      const earliest = earliestBookingTimestamp(leadHours);
      if (Number.isNaN(selected.getTime()) || selected.getTime() < earliest) {
        setScheduleError(leadTimeError);
        return;
      }
      if (formData.preferredTime < "07:00" || formData.preferredTime > "23:00") {
        setScheduleError("Available booking hours are 7:00 AM to 11:00 PM Pakistan time.");
        return;
      }
      setScheduleError("");
    }

    onSubmit(formData, paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ─── 1. Contact Information ─────────────────────────── */}
      <Section
        step={1}
        label="Contact information"
        description="We'll use this to confirm your booking."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required htmlFor="fullName">
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ayesha Khan"
                className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary"
                required
              />
            </div>
          </Field>
          <Field label="Phone number" required htmlFor="phone">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03xx-xxxxxxx"
                className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary"
                required
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* ─── 2. Address ─────────────────────────────────────── */}
      <Section step={2} label="Address" description={isShop ? "Where should we deliver the product?" : "Where should the technician arrive?"}>
        <LocationSection
          houseNumber={formData.houseNumber}
          landmark={formData.landmark}
          onHouseNumberChange={handleChange}
          onLandmarkChange={handleChange}
        />
      </Section>

      {/* ─── 3. Preferred Time ──────────────────────────────── */}
      {!isShop && (
        <Section
          step={3}
          label="Schedule your visit"
          description="Choose a future date and a separate arrival time."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service date" htmlFor="preferredDate" required>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="preferredDate" name="preferredDate" type="date"
                  min={earliestBooking.date}
                  value={formData.preferredDate} onChange={(event) => {
                    const date = event.target.value;
                    if (date < earliestBooking.date) { setScheduleError(leadTimeError); return; }
                    const keepTime = Boolean(formData.preferredTime) && bookingTimestamp(date, formData.preferredTime) >= earliestBookingTime;
                    setScheduleError(formData.preferredTime && !keepTime ? leadTimeError : "");
                    setFormData((current) => ({ ...current, preferredDate: date, preferredTime: keepTime ? current.preferredTime : "" }));
                    onScheduleChange?.();
                  }}
                  className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary" required />
              </div>
            </Field>
            <Field label="Arrival time" htmlFor="preferredTime" required>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="preferredTime" name="preferredTime" type="time" step="900"
                  min={formData.preferredDate === earliestBooking.date && earliestBooking.time > "07:00" ? earliestBooking.time : "07:00"} max="23:00"
                  value={formData.preferredTime} onChange={(event) => {
                    const time = event.target.value;
                    if (isUnavailableTime(time)) { setScheduleError(leadTimeError); return; }
                    setFormData((current) => ({ ...current, preferredTime: time }));
                    setScheduleError("");
                    onScheduleChange?.();
                  }}
                  className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary" required />
              </div>
            </Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Popular times</p>
            <div className="flex flex-wrap gap-2">{["09:00", "12:00", "15:00", "18:00", "21:00"].map((time) => { const disabled = isUnavailableTime(time); return <button key={time} type="button" disabled={disabled} onClick={() => { setFormData((current) => ({ ...current, preferredTime: time })); setScheduleError(""); onScheduleChange?.(); }} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${disabled ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300" : formData.preferredTime === time ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>{new Date(`2000-01-01T${time}`).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}</button>; })}</div>
          </div>
          {displayedScheduleError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{displayedScheduleError}</div>}
          <div className="flex gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div><p className="font-bold">Bookings are available from 7:00 AM to 11:00 PM PKT.</p><p className="mt-1 leading-5 text-amber-800">Past times cannot be booked. Your selected slot is a request and our team will confirm it after checkout.</p></div>
          </div>
        </Section>
      )}

      {/* ─── 4. Payment ─────────────────────────────────────── */}
      <Section step={isShop ? 3 : 4} label="Payment" description="Choose how you'd like to pay.">
        <PaymentSection
          paymentMethod={paymentMethod}
          isShop={isShop}
          onPaymentChange={setPaymentMethod}
        />
      </Section>

      {/* ─── 5. Special Instructions ────────────────────────── */}
      <Section
        step={isShop ? 4 : 5}
        label="Special instructions"
        description={isShop ? "Optional — delivery notes, gate codes, etc." : "Optional — parking, access codes, anything we should know."}
        optional
      >
        <div className="relative">
          <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={isShop ? "Entry instructions? Landmark? Leave package at front door?" : "Parking available? Entry gate code? Mention floor number…"}
            className="min-h-[90px] rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm focus-visible:ring-primary"
          />
        </div>
      </Section>


      {/* ─── Error ──────────────────────────────────────────── */}
      {error || (submitError && !apiScheduleError) ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{error || submitError}</p>
        </div>
      ) : null}

      {/* ─── Submit ─────────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full gap-2.5 rounded-2xl bg-primary py-6 text-base font-bold shadow-lg shadow-primary/25 transition-all hover:bg-emerald-700 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Placing booking…
          </>
        ) : (
          "Place Booking Request"
        )}
      </Button>

      <p className="text-center text-xs text-slate-400">
        By placing a booking, you agree to our{" "}
        <a href="/terms" className="underline hover:text-slate-600">
          Terms of Service
        </a>
        .
      </p>
    </form>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function Section({
  step,
  label,
  description,
  optional,
  children,
}: {
  step: number;
  label: string;
  description: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-700">
          {step}
        </div>
        <div>
          <p className="font-bold text-slate-900 leading-none">
            {label}
            {optional && (
              <span className="ml-2 text-xs font-normal text-slate-400">optional</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
