"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  PackageCheck,
  MapPin,
  CreditCard,
  CalendarClock,
  Hash,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingRecord } from "../types";

interface SuccessScreenProps {
  booking: BookingRecord;
  currency: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function SuccessScreen({ booking, currency: _currency }: SuccessScreenProps) {

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <PackageCheck className="h-3 w-3 text-white" />
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">Booking confirmed!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thanks,{" "}
            <span className="font-semibold text-slate-700">{booking.customerName}</span>. We&apos;ve
            received your booking and will get in touch shortly.
          </p>
        </div>

        {/* Booking card */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Booking ID bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <Hash className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono font-semibold text-slate-600">{booking.id}</span>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {booking.status}
            </span>
          </div>

          <div className="divide-y divide-slate-100 p-4 text-sm">
            {/* Service */}
            <InfoRow
              icon={<PackageCheck className="h-4 w-4 text-emerald-600" />}
              label="Service"
              value={
                <span className="font-semibold text-slate-900">
                  {booking.serviceTitle}
                  {booking.workTitle ? (
                    <span className="ml-1 font-normal text-slate-500">
                      — {booking.workTitle}
                    </span>
                  ) : null}
                </span>
              }
            />

            {/* Address */}
            <InfoRow
              icon={<MapPin className="h-4 w-4 text-emerald-600" />}
              label="Address"
              value={<span className="text-slate-700">{booking.address}</span>}
            />

            {/* Payment */}
            <InfoRow
              icon={<CreditCard className="h-4 w-4 text-emerald-600" />}
              label="Payment"
              value={
                <span className="text-slate-700">
                  {PAYMENT_LABELS[booking.paymentMethod] ?? booking.paymentMethod}
                </span>
              }
            />

            {/* Booking time */}
            <InfoRow
              icon={<CalendarClock className="h-4 w-4 text-emerald-600" />}
              label="Booked at"
              value={<span className="text-slate-700">{formatTime(booking.createdAt)}</span>}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/track-booking">
            <Button className="w-full gap-2 rounded-2xl bg-primary py-5 font-bold shadow-lg shadow-primary/20 hover:bg-emerald-700">
              Track Booking
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full rounded-2xl border-slate-200 py-5 font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
    </div>
  );
}
