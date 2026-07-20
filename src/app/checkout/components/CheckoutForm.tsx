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

function pakistanToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

interface CheckoutFormProps {
  initialName: string;
  initialPhone: string;
  onSubmit: (
    formData: FormData,
    paymentMethod: PaymentMethod,
    screenshotName: string
  ) => void;
  isSubmitting: boolean;
  isShop?: boolean;
  submitError?: string;
}

export function CheckoutForm({
  initialName,
  initialPhone,
  onSubmit,
  isSubmitting,
  isShop = false,
  submitError = "",
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [screenshotName, setScreenshotName] = useState("");
  const [error, setError] = useState("");

  const hasLocation =
    location.status === "serviceable" ||
    location.status === "not-serviceable" ||
    Boolean(location.label);

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
        setError("Please choose both a service date and an arrival time.");
        return;
      }
      const selected = new Date(`${formData.preferredDate}T${formData.preferredTime}:00+05:00`);
      if (Number.isNaN(selected.getTime()) || selected.getTime() <= Date.now()) {
        setError("Please choose a date and time in the future.");
        return;
      }
      if (formData.preferredTime < "07:00" || formData.preferredTime > "23:00") {
        setError("Available booking hours are 7:00 AM to 11:00 PM Pakistan time.");
        return;
      }
    }

    onSubmit(formData, paymentMethod, screenshotName);
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
                  min={pakistanToday()}
                  value={formData.preferredDate} onChange={handleChange}
                  className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary" required />
              </div>
            </Field>
            <Field label="Arrival time" htmlFor="preferredTime" required>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="preferredTime" name="preferredTime" type="time" step="900"
                  min="07:00" max="23:00"
                  value={formData.preferredTime} onChange={handleChange}
                  className="rounded-2xl border-slate-200 bg-slate-50 py-5 pl-10 text-sm focus-visible:ring-primary" required />
              </div>
            </Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Popular times</p>
            <div className="flex flex-wrap gap-2">{["09:00", "12:00", "15:00", "18:00", "21:00"].map((time) => <button key={time} type="button" onClick={() => setFormData((current) => ({ ...current, preferredTime: time }))} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${formData.preferredTime === time ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>{new Date(`2000-01-01T${time}`).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}</button>)}</div>
          </div>
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
          screenshotName={screenshotName}
          onPaymentChange={setPaymentMethod}
          onScreenshotChange={setScreenshotName}
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
      {error || submitError ? (
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
