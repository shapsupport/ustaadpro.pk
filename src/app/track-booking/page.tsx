"use client";

import Link from "next/link";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, Camera, ChevronDown, Loader2, MapPin, MessageSquareWarning, Package, RefreshCw, Star, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const STORAGE_KEY = "ustaadpro_bookings";

type Booking = {
  id: string; serviceId?: string; serviceTitle: string; workTitle?: string; servicePrice: number;
  paymentMethod: string; status: string; createdAt: string; userEmail?: string; address?: string;
  preferredTime?: string; notes?: string; kind?: "service" | "shop";
};

const statusSteps = ["confirmed", "assigned", "in_progress", "completed"];

function token() { try { return localStorage.getItem("ustaadpro_token") || ""; } catch { return ""; } }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }; }
function listFrom(payload: unknown): Booking[] {
  if (Array.isArray(payload)) return payload as Booking[];
  const object = payload as { orders?: Booking[]; data?: Booking[] };
  return object?.orders || object?.data || [];
}
function filesToDataUrls(files: FileList | null) {
  return Promise.all(Array.from(files || []).slice(0, 3).map((file) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
  })));
}

export default function TrackBookingPage() {
  const { user, setAuthModalMode } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!user?.email) return;
    await Promise.resolve();
    setLoading(true); setLoadError("");
    try {
      const headers = authHeaders();
      if (!token()) throw new Error("No authentication token");
      const [services, shop] = await Promise.all([
        fetch(`${API_BASE}/api/orders`, { headers, cache: "no-store" }),
        fetch(`${API_BASE}/api/shop/orders`, { headers, cache: "no-store" }),
      ]);
      if (!services.ok || !shop.ok) throw new Error("Unable to load every order");
      const serviceItems = listFrom(await services.json()).map((item) => ({ ...item, kind: "service" as const }));
      const shopItems = listFrom(await shop.json()).map((item) => ({ ...item, kind: "shop" as const, serviceTitle: item.serviceTitle || "Shop order" }));
      setBookings([...serviceItems, ...shopItems].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Booking[];
        setBookings(stored.filter((item) => item.userEmail === user.email));
        setLoadError("Showing bookings saved on this device. Sign in again to refresh live status.");
      } catch { setBookings([]); setLoadError("Bookings could not be loaded."); }
    } finally { setLoading(false); }
  }, [user]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh every 30 seconds for real-time status updates
  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, load]);

  if (!user) return <SignIn onLogin={() => setAuthModalMode("login")} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[.25em] text-emerald-600">My bookings</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Track every order in one place</h1><p className="mt-2 text-sm text-slate-600">Open a booking for its schedule, progress, review, payment, or support options.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button><Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Book service <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
      {loadError && <div className="mb-5 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" />{loadError}</div>}
      {loading && !bookings.length ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : bookings.length === 0 ? <Empty /> : <div className="grid gap-4">{bookings.map((booking) => <BookingCard key={`${booking.kind}-${booking.id}`} booking={booking} />)}</div>}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const normalized = booking.status.toLowerCase().replace(/\s+/g, "_");
  const isCancelled = normalized === "cancelled";
  const active = isCancelled ? -1 : Math.max(0, statusSteps.indexOf(normalized));

  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
      <div className="min-w-0"><div className="flex items-center gap-2"><Package className="h-5 w-5 shrink-0 text-primary" /><p className="truncate text-lg font-semibold text-slate-900">{booking.serviceTitle}</p></div><p className="mt-1 text-sm text-slate-500">#{booking.id} · {new Date(booking.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</p></div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${isCancelled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {normalized.replaceAll("_", " ")}
        </span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </div>
    </button>
    {open && <div className="border-t border-slate-100 p-5">
      {!isCancelled && booking.kind !== "shop" && <div className="mb-6 grid grid-cols-4 gap-1">{statusSteps.map((step, i) => <div key={step} className="text-center"><div className={`mx-auto h-2 rounded-full ${i <= active ? "bg-emerald-500" : "bg-slate-200"}`} /><p className="mt-2 text-[10px] font-semibold capitalize text-slate-500">{step.replace("_", " ")}</p></div>)}</div>}
      {isCancelled && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-bold text-red-700">This order has been cancelled</p>
        </div>
      )}
      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
        <p><strong>Payment:</strong> {booking.paymentMethod}</p><p><strong>Amount:</strong> PKR {Number(booking.servicePrice || 0).toLocaleString("en-PK")}</p>
        {booking.preferredTime && <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{new Date(booking.preferredTime).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p>}
        {booking.address && <p className="flex gap-2"><MapPin className="h-4 w-4 text-slate-400" />{booking.address}</p>}
      </div>
      <BookingActions booking={booking} completed={normalized === "completed" || normalized === "delivered"} isCancelled={isCancelled} />
    </div>}
  </article>;
}

function BookingActions({ booking, completed, isCancelled }: { booking: Booking; completed: boolean; isCancelled: boolean }) {
  const [panel, setPanel] = useState<"review" | "issue" | "receipt" | null>(null);
  const isEasyPaisa = booking.paymentMethod?.toLowerCase().includes("easypaisa");

  if (isCancelled) {
    return <div className="mt-5"><div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setPanel(panel === "issue" ? null : "issue")}><MessageSquareWarning className="mr-2 h-4 w-4" />Raise an issue</Button>
    </div>{panel === "issue" && <IssueForm booking={booking} />}</div>;
  }

  return <div className="mt-5"><div className="flex flex-wrap gap-2">
    {completed && booking.kind !== "shop" && <Button onClick={() => setPanel(panel === "review" ? null : "review")}><Star className="mr-2 h-4 w-4" />Write review</Button>}
    {completed && isEasyPaisa && <Button variant="outline" onClick={() => setPanel(panel === "receipt" ? null : "receipt")}><Camera className="mr-2 h-4 w-4 text-emerald-600" />Upload Payment Receipt</Button>}
    <Button variant="outline" onClick={() => setPanel(panel === "issue" ? null : "issue")}><MessageSquareWarning className="mr-2 h-4 w-4" />Raise an issue</Button>
  </div>{panel === "review" && <ReviewForm booking={booking} />}{panel === "receipt" && <UploadReceiptForm booking={booking} />}{panel === "issue" && <IssueForm booking={booking} />}</div>;
}

function UploadReceiptForm({ booking }: { booking: Booking }) {
  const EASYPAISA_NUMBER = "03485838593";
  const EASYPAISA_TITLE = "Muhammad Ikram";
  const [dataUrl, setDataUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(EASYPAISA_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  async function submit() {
    if (!dataUrl) { setMessage("Please select a valid receipt image."); return; }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/${booking.id}/payment-receipt`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ dataUrl, amount: booking.servicePrice || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Receipt upload failed.");
      setMessage("Receipt uploaded successfully! Admin will verify your payment.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Receipt upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <p className="font-bold text-slate-900 text-base">Upload EasyPaisa Proof of Payment</p>

      <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900">EasyPaisa Account Details</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
        </div>

        <div className="flex items-center justify-between bg-emerald-50/50 rounded-lg p-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Account Title</p>
            <p className="text-sm font-bold text-slate-800">{EASYPAISA_TITLE}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Account Number</p>
            <p className="text-lg font-black text-emerald-700 tracking-wider">{EASYPAISA_NUMBER}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyNumber}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          {copied ? "✓ Account Number Copied!" : `Copy Account Number (${EASYPAISA_NUMBER})`}
        </button>
      </div>

      <ImagePicker onChange={(urls) => setDataUrl(urls[0] || "")} />

      {message && (
        <p className={`text-sm font-medium ${message.includes("successfully") ? "text-emerald-700" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <Button onClick={() => void submit()} disabled={busy} className="w-full">
        {busy ? "Uploading…" : "Upload Receipt Screenshot"}
      </Button>
    </div>
  );
}

function ReviewForm({ booking }: { booking: Booking }) {
  const [rating, setRating] = useState(5), [comment, setComment] = useState(""), [images, setImages] = useState<string[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit() { if (!booking.serviceId || !comment.trim()) { setMessage("A service reference and comment are required."); return; } setBusy(true); setMessage(""); try { const res = await fetch(`${API_BASE}/api/reviews`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ serviceId: booking.serviceId, orderId: booking.id, rating, comment: comment.trim(), ...(images.length ? { images } : {}) }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Review could not be submitted."); setMessage(data.message || "Review submitted successfully."); } catch (e) { setMessage(e instanceof Error ? e.message : "Review could not be submitted."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"><p className="font-bold text-slate-900">Review this service</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}</div><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What went well? Help other customers know what to expect." /><ImagePicker onChange={setImages} /><p className="text-xs text-amber-700">Photo fields are sent with the review, but the current review API must add image storage support before they can be guaranteed to appear publicly.</p>{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button></div>;
}

function IssueForm({ booking }: { booking: Booking }) {
  const [details, setDetails] = useState(""), [images, setImages] = useState<string[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit() { if (!details.trim()) { setMessage("Please explain what went wrong."); return; } setBusy(true); setMessage(""); try { const path = booking.kind === "shop" ? `/api/shop/orders/${booking.id}/issues` : `/api/orders/${booking.id}/issues`; const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ description: details.trim(), images }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Issue could not be sent. The support endpoint may not be enabled yet."); setMessage(data.message || "Your issue has been raised."); } catch (e) { setMessage(e instanceof Error ? e.message : "Issue could not be sent."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><p className="font-bold text-slate-900">Tell support what happened</p><Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the problem, what you expected, and how we can help." /><ImagePicker onChange={setImages} />{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Sending…" : "Send to support"}</Button></div>;
}

function ImagePicker({ onChange }: { onChange: (images: string[]) => void }) { const [names, setNames] = useState<string[]>([]); async function choose(e: ChangeEvent<HTMLInputElement>) { const files = Array.from(e.target.files || []).slice(0, 3); setNames(files.map(f => f.name)); onChange(await filesToDataUrls(e.target.files)); } return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600"><Camera className="h-5 w-5 text-primary" /><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => void choose(e)} /><span>{names.length ? `${names.length} photo${names.length > 1 ? "s" : ""} attached` : "Attach up to 3 photos"}</span></label>; }

function SignIn({ onLogin }: { onLogin: () => void }) { return <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4"><div className="w-full rounded-3xl border bg-white p-8 text-center shadow-sm"><UserRound className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 text-2xl font-bold">Sign in to view your bookings</h1><p className="mt-3 text-sm text-slate-600">Your order details and support conversations are private.</p><Button className="mt-6" onClick={onLogin}>Login to continue</Button></div></div>; }
function Empty() { return <div className="rounded-3xl border border-dashed bg-slate-50 p-10 text-center"><CalendarDays className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-sm text-slate-600">Choose a service to create your first booking.</p><Link href="/services" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">Explore services</Link></div>; }