"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type BookingRecord = {
  id: string;
  serviceTitle: string;
  workTitle?: string;
  servicePrice: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  userEmail?: string;
};

const STORAGE_KEY = "ustaadpro_bookings";

export default function TrackBookingPage() {
  const { user, setAuthModalMode } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    if (!user?.email) {
      setBookings([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as BookingRecord[];
      const filtered = stored.filter((booking) => booking.userEmail === user.email);
      setBookings(filtered);
    } catch {
      setBookings([]);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-primary">
            <UserRound className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Please sign in to view your bookings</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your booking history is private. Sign in to see your orders, payment status, and next steps.
          </p>
          <button
            onClick={() => setAuthModalMode("login")}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Login to continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">My bookings</p>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Track your requests, payment progress, and service updates in one place.</p>
        </div>
        <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
          Make a booking
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900">No bookings yet</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            You do not have any confirmed or pending booking requests yet. Start by choosing a service and completing your checkout.
          </p>
          <Link href="/services" className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-emerald-700">
            Explore services
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{booking.serviceTitle}</p>
                  {booking.workTitle ? <p className="text-sm text-slate-500">{booking.workTitle}</p> : null}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  {booking.status}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span>Payment: {booking.paymentMethod}</span>
                <span>Amount: PKR {booking.servicePrice.toLocaleString()}</span>
                <span>Requested: {new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
