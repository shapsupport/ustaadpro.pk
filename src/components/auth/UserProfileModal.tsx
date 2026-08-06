"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { X, Mail, Phone, LogOut, CheckCircle2, Wallet, CalendarDays, MessageCircle, ChevronRight, AlertTriangle, ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/services/bookingService";
import { submitComplaint } from "@/services/complaintService";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk").replace(/\/$/, "");

interface ComplaintBooking {
  id: string;
  value: string;
  label: string;
  bookedAt: string;
  scheduledFor: string;
  status: string;
  imageUrl: string;
}

function absoluteImageUrl(url: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [bookings, setBookings] = useState<ComplaintBooking[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | undefined>();
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!open || !complaintOpen) return;

    let active = true;
    getUserOrders()
      .then((orders) => {
        if (!active) return;
        const serviceBookings = orders
          .map((booking) => {
            const firstItem = booking.items?.[0] as Record<string, unknown> | undefined;
            const service = (firstItem?.service || {}) as Record<string, unknown>;
            const title = String(firstItem?.serviceTitle || firstItem?.title || service.title || "Home service");
            const imageUrl = String(firstItem?.imageUrl || firstItem?.image_url || service.imageUrl || service.image_url || "");
            return {
              id: String(booking.id),
              value: `service:${booking.id}`,
              label: title,
              bookedAt: booking.createdAt,
              scheduledFor: booking.bookedFor || "Awaiting confirmation",
              status: booking.status || "pending",
              imageUrl: absoluteImageUrl(imageUrl),
            };
          })
          .sort((a, b) => Date.parse(b.bookedAt) - Date.parse(a.bookedAt));
        setBookings(serviceBookings);
      })
      .catch(() => { if (active) setBookings([]); })
      .finally(() => { if (active) setLoadingBookings(false); });
    return () => { active = false; };
  }, [open, complaintOpen]);

  const closeModal = () => {
    setComplaintOpen(false);
    setMessage(null);
    onClose();
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setMessage(null);
    if (!file) { setImage(undefined); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImage(undefined);
      setMessage({ type: "error", text: "Please attach a JPG, PNG, or WebP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImage(undefined);
      setMessage({ type: "error", text: "The image must be 5 MB or smaller." });
      return;
    }
    setImage(file);
  };

  const lodgeComplaint = async () => {
    setMessage(null);
    if (!bookingId) { setMessage({ type: "error", text: "Please select the related service booking." }); return; }
    if (description.trim().length < 10) { setMessage({ type: "error", text: "Please describe the issue in at least 10 characters." }); return; }
    const selectedBooking = bookings.find((booking) => booking.value === bookingId);
    if (!selectedBooking || !user) return;
    setSubmitting(true);
    try {
      const result = await submitComplaint({
        name: user.name,
        phone: user.phone,
        email: user.email,
        bookingId: selectedBooking.id,
        bookingLabel: selectedBooking.label,
        description,
        image,
      });
      setMessage({ type: "success", text: result.message });
      setDescription("");
      setImage(undefined);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Your complaint could not be submitted." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeModal}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        className={`fixed inset-x-4 top-1/2 z-[110] mx-auto max-h-[calc(100dvh-2rem)] -translate-y-1/2 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 ${complaintOpen ? "max-w-5xl overflow-y-auto lg:overflow-hidden" : "max-w-sm overflow-y-auto"}`}
      >
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {complaintOpen ? (
            <div>
              <button type="button" onClick={() => { setComplaintOpen(false); setMessage(null); }} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700">
                <ArrowLeft className="h-4 w-4" /> Back to account
              </button>
              <div className="mb-4 flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
                <div><h3 className="text-xl font-black text-slate-900">Lodge a service complaint</h3><p className="mt-1 text-xs leading-5 text-slate-500">Choose the service visually, then tell our support team what happened.</p></div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="mb-2 text-xs font-bold text-slate-600">Select a service booking *</p>
                  {loadingBookings ? <div className="grid min-h-48 place-items-center text-sm text-slate-500"><Loader2 className="mb-2 h-5 w-5 animate-spin text-emerald-600" />Loading your services…</div> : bookings.length === 0 ? <div className="grid min-h-48 place-items-center px-4 text-center text-sm text-slate-500">No service bookings were found on this account.</div> : (
                    <div className="grid max-h-[54dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {bookings.map((booking) => {
                        const selected = bookingId === booking.value;
                        const bookedDate = Number.isNaN(Date.parse(booking.bookedAt)) ? "Date unavailable" : new Date(booking.bookedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
                        return <button key={booking.value} type="button" onClick={() => { setBookingId(booking.value); setMessage(null); }} className={`flex min-h-24 items-center gap-3 rounded-xl border p-2.5 text-left transition ${selected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-emerald-100">
                            {booking.imageUrl ? <Image src={booking.imageUrl} alt="" fill className="object-cover" sizes="64px" /> : <span className="grid h-full place-items-center text-emerald-700"><CalendarDays className="h-6 w-6" /></span>}
                          </div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{booking.label}</p><p className="mt-1 text-[11px] font-medium text-slate-600">Booked {bookedDate}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">Visit: {booking.scheduledFor}</p><span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold capitalize text-slate-600">{booking.status.replaceAll("_", " ")}</span><span className="ml-1 text-[9px] text-slate-400">Ref #{booking.id}</span></div>
                        </button>;
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">What went wrong? *</label>
                  <textarea value={description} onChange={(event) => { setDescription(event.target.value); setMessage(null); }} rows={6} placeholder="Describe the issue, what you expected, and how we can help." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500" />
                  <p className="mt-1 text-right text-[10px] text-slate-400">{description.trim().length} characters</p>
                  </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 hover:border-emerald-400">
                  <Camera className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">{image ? image.name : "Attach an image (optional)"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="sr-only" />
                </label>
                <p className="-mt-2 text-[10px] text-slate-400">JPG, PNG or WebP, up to 5 MB.</p>
                {message && <p role="status" className={`rounded-xl px-3 py-2 text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>}
                <button type="button" onClick={() => void lodgeComplaint()} disabled={submitting || loadingBookings || bookings.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? "Submitting complaint…" : "Submit complaint"}
                </button>
                </div>
              </div>
            </div>
          ) : (<>
          {/* User Initial Avatar */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md mb-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified Member
            </p>
          </div>

          {/* Details list */}
          <div className="py-6 space-y-4">
            <Link href="/wallet" onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 transition hover:bg-emerald-100">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Wallet Balance</p>
                <p className="text-sm font-bold text-emerald-900">PKR {Number(user.walletBalance || 0).toLocaleString("en-PK")}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-medium text-slate-700 truncate">{user.phone || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link href="/track-booking" onClick={onClose} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4" /></span>
              <span className="flex-1 text-left">My Bookings</span><ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
            <Link href="/contact" onClick={onClose} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><MessageCircle className="h-4 w-4" /></span>
              <span className="flex-1 text-left">Contact Us</span><ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
            <button type="button" onClick={() => { setLoadingBookings(true); setComplaintOpen(true); setMessage(null); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle className="h-4 w-4" /></span>
              <span className="flex-1 text-left">Lodge a Complaint</span><ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-2xl text-sm transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
          </>)}
        </div>
      </div>
    </>
  );
}
