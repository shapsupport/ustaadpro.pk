"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  AlertTriangle, CalendarDays, Camera, CheckCircle2, ChevronRight, Coins,
  Loader2, LogIn, LogOut, Mail, MessageCircle, Phone, ShieldCheck, ShoppingBag,
  Trash2, WalletCards,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/services/bookingService";
import { submitComplaint } from "@/services/complaintService";

interface ComplaintBooking {
  id: string;
  value: string;
  label: string;
  bookedAt: string;
  scheduledFor: string;
  status: string;
}

export function ProfilePageClient() {
  const router = useRouter();
  const { user, isLoading, logout, deleteAccount, setAuthModalMode } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bookings, setBookings] = useState<ComplaintBooking[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!complaintOpen || !user) return;
    if (bookingsLoaded) {
      queueMicrotask(() => setLoadingBookings(false));
      return;
    }
    let active = true;
    getUserOrders()
      .then((orders) => {
        if (!active) return;
        setBookings(orders.map((booking) => {
          const firstItem = booking.items?.[0] as Record<string, unknown> | undefined;
          const service = (firstItem?.service || {}) as Record<string, unknown>;
          const label = String(firstItem?.serviceTitle || firstItem?.title || service.title || "Home service");
          return {
            id: String(booking.id), value: `service:${booking.id}`, label,
            bookedAt: booking.createdAt, scheduledFor: booking.bookedFor || "Awaiting confirmation",
            status: booking.status || "pending",
          };
        }).sort((a, b) => Date.parse(b.bookedAt) - Date.parse(a.bookedAt)));
      })
      .catch(() => { if (active) setBookings([]); })
      .finally(() => { if (active) { setLoadingBookings(false); setBookingsLoaded(true); } });
    return () => { active = false; };
  }, [bookingsLoaded, complaintOpen, user]);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setMessage(null);
    if (!file) return setImage(undefined);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImage(undefined); setMessage({ type: "error", text: "Please attach a JPG, PNG, or WebP image." }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImage(undefined); setMessage({ type: "error", text: "The image must be 5 MB or smaller." }); return;
    }
    setImage(file);
  };

  const lodgeComplaint = async () => {
    setMessage(null);
    if (!bookingId) return setMessage({ type: "error", text: "Please select the related service booking." });
    if (description.trim().length < 10) return setMessage({ type: "error", text: "Please describe the issue in at least 10 characters." });
    const selected = bookings.find((booking) => booking.value === bookingId);
    if (!selected || !user) return;
    setSubmitting(true);
    try {
      const result = await submitComplaint({ name: user.name, phone: user.phone, email: user.email, bookingId: selected.id, bookingLabel: selected.label, description, image });
      setMessage({ type: "success", text: result.message });
      setDescription(""); setImage(undefined); setBookingId("");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Your complaint could not be submitted." });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setMessage(null);
    try { await deleteAccount(); router.replace("/"); }
    catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Account deletion failed." }); }
    finally { setDeleting(false); }
  };

  if (!user) {
    return <main className="min-h-[70vh] bg-slate-50 px-4 py-16 sm:py-24">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-8 w-8" /></span>
        <h1 className="mt-5 text-2xl font-black text-slate-950">Sign in to view your profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your bookings, wallet balance, rewards, orders, and support requests are kept securely in your account.</p>
        <button disabled={isLoading} onClick={() => setAuthModalMode("login")} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><LogIn className="h-4 w-4" /> Sign in</button>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-slate-500 hover:text-emerald-700">Return to homepage</Link>
      </section>
    </main>;
  }

  const memberSince = Number.isNaN(Date.parse(user.createdAt)) ? "UstaadPro member" : `Member since ${new Date(user.createdAt).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}`;
  const actions = [
    { href: "/wallet", label: "Wallet & rewards", help: "View balance, points, and activity", icon: WalletCards, color: "bg-emerald-50 text-emerald-700" },
    { href: "/track-booking", label: "My service bookings", help: "Track and review your bookings", icon: CalendarDays, color: "bg-blue-50 text-blue-700" },
    { href: "/track-booking?tab=shop", label: "My store orders", help: "Track products you have ordered", icon: ShoppingBag, color: "bg-violet-50 text-violet-700" },
    { href: "/contact", label: "Contact support", help: "Call, WhatsApp, email, or send a message", icon: MessageCircle, color: "bg-amber-50 text-amber-700" },
  ];

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Your account</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">My profile</h1>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5 lg:flex-col lg:text-center">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-2xl font-black text-white shadow-md">{user.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0"><h2 className="truncate text-xl font-black text-slate-950">{user.name}</h2><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Verified member</span><p className="mt-2 text-xs text-slate-400">{memberSince}</p></div>
          </div>
          <dl className="mt-5 space-y-4">
            <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div className="min-w-0"><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email</dt><dd className="break-all text-sm font-semibold text-slate-700">{user.email}</dd></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone</dt><dd className="text-sm font-semibold text-slate-700">{user.phone || "Not set"}</dd></div></div>
          </dl>
          <button onClick={() => { logout(); router.replace("/"); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"><LogOut className="h-4 w-4" /> Sign out</button>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Account balances">
            <Balance icon={WalletCards} label="Wallet balance" value={`PKR ${Number(user.walletBalance || 0).toLocaleString("en-PK")}`} />
            <Balance icon={Coins} label="Reward points" value={`${Number(user.rewardPoints || 0).toLocaleString("en-PK")} pts`} />
            <Balance icon={Coins} label="Coins" value={Number(user.coins || 0).toLocaleString("en-PK")} />
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-950">Account shortcuts</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {actions.map(({ href, label, help, icon: Icon, color }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{label}</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">{help}</span></span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></Link>)}
              <button onClick={() => { if (!complaintOpen) setLoadingBookings(true); setComplaintOpen((value) => !value); setMessage(null); }} aria-expanded={complaintOpen} className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/40"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">Lodge a complaint</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">Report an issue with a service booking</span></span><ChevronRight className={`h-4 w-4 text-slate-300 transition ${complaintOpen ? "rotate-90" : ""}`} /></button>
            </div>
          </section>

          {complaintOpen && <section className="scroll-mt-28 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-950">Lodge a service complaint</h2><p className="mt-1 text-sm text-slate-500">Select the related booking and tell our support team what happened.</p>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div><p className="mb-2 text-xs font-bold text-slate-600">Service booking *</p>{loadingBookings ? <p className="flex min-h-28 items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…</p> : bookings.length === 0 ? <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No service bookings were found. <Link href="/services" className="font-bold text-emerald-700">Browse services</Link></div> : <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{bookings.map((booking) => <button key={booking.value} onClick={() => { setBookingId(booking.value); setMessage(null); }} className={`w-full rounded-xl border p-3 text-left transition ${bookingId === booking.value ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-300"}`}><span className="block text-sm font-black text-slate-900">{booking.label}</span><span className="mt-1 block text-[11px] text-slate-500">{booking.scheduledFor} · <span className="capitalize">{booking.status.replaceAll("_", " ")}</span> · #{booking.id}</span></button>)}</div>}</div>
              <div className="space-y-3"><label className="block text-xs font-bold text-slate-600">What went wrong? *<textarea value={description} onChange={(event) => { setDescription(event.target.value); setMessage(null); }} rows={5} placeholder="Describe the issue and how we can help." className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-normal outline-none focus:border-emerald-500" /></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 hover:border-emerald-400"><Camera className="h-5 w-5 text-emerald-600" /><span className="min-w-0 flex-1 truncate">{image?.name || "Attach an image (optional, max 5 MB)"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="sr-only" /></label>{message && <p role="status" className={`rounded-xl px-3 py-2 text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>}<button onClick={() => void lodgeComplaint()} disabled={submitting || loadingBookings || bookings.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? "Submitting…" : "Submit complaint"}</button></div>
            </div>
          </section>}

          <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-base font-black text-slate-950">Account deletion</h2><p className="mt-1 text-xs leading-5 text-slate-500">Permanently removes your account and associated account data. This cannot be undone.</p>{confirmDelete ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-800">Are you sure you want to permanently delete your account?</p>{message?.type === "error" && <p className="mt-2 text-xs font-semibold text-red-700">{message.text}</p>}<div className="mt-3 flex flex-col gap-2 sm:flex-row"><button disabled={deleting} onClick={() => { setConfirmDelete(false); setMessage(null); }} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700">Cancel</button><button disabled={deleting} onClick={() => void handleDelete()} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {deleting ? "Deleting…" : "Yes, delete permanently"}</button></div></div> : <button onClick={() => { setConfirmDelete(true); setMessage(null); }} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete account</button>}</section>
        </div>
      </div>
    </div>
  </main>;
}

function Balance({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string }) {
  return <Link href="/wallet" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:border-emerald-300"><Icon className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">{label}</p><p className="mt-1 text-lg font-black text-emerald-950">{value}</p></Link>;
}
