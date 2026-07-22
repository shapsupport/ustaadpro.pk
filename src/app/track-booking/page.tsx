"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, Camera, ChevronDown, Loader2, MapPin, MessageSquareWarning, Package, RefreshCw, ShoppingBag, Star, UserRound, Wrench, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const STORAGE_KEY = "ustaadpro_bookings";

type Booking = {
  id: string; serviceId?: string; serviceTitle: string; workTitle?: string; servicePrice: number;
  paymentMethod: string; status: string; createdAt: string; userEmail?: string; address?: string;
  preferredTime?: string; notes?: string; kind?: "service" | "shop";
  items?: OrderItem[];
};

type OrderItem = {
  productId?: string;
  title: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

const serviceStatusSteps = ["confirmed", "assigned", "in_progress", "completed"];
const shopStatusSteps = ["placed", "confirmed", "processing", "shipped", "delivered"];

function token() { try { return localStorage.getItem("ustaadpro_token") || ""; } catch { return ""; } }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }; }
function absoluteImage(url?: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}
function listFrom(payload: unknown, kind: "service" | "shop"): Booking[] {
  const object = payload as { orders?: Record<string, unknown>[]; data?: Record<string, unknown>[] };
  const rows = Array.isArray(payload) ? payload : object?.orders || object?.data || [];
  return (rows as Record<string, unknown>[]).map((row) => {
    const rawItems = Array.isArray(row.items) ? row.items as Record<string, unknown>[] : [];
    const items = rawItems.map((item) => {
      const product = (item.product || {}) as Record<string, unknown>;
      return {
        productId: String(item.productId || product.id || ""),
        title: String(item.title || product.title || "Product"),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || product.price || 0),
        imageUrl: String(item.imageUrl || product.imageUrl || ""),
      };
    });
    const address = typeof row.address === "string" ? row.address : ((row.address || {}) as { label?: string; fullAddress?: string }).fullAddress || ((row.address || {}) as { label?: string }).label || "";
    const firstItem = items[0];
    return {
      ...row,
      id: String(row.id || row.orderId || ""),
      kind,
      serviceId: String(row.serviceId || ((row.service || {}) as { id?: string }).id || ""),
      serviceTitle: String(row.serviceTitle || ((row.service || {}) as { title?: string }).title || (kind === "shop" ? (items.length > 1 ? `${items.length} products` : firstItem?.title || "Shop order") : "Service booking")),
      workTitle: String(row.workTitle || ""),
      servicePrice: Number(row.servicePrice || row.totalAmount || row.total || row.grandTotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      paymentMethod: String(row.paymentMethod || "Not specified"),
      status: String(row.status || (kind === "shop" ? "placed" : "confirmed")),
      createdAt: String(row.createdAt || row.created_at || new Date().toISOString()),
      preferredTime: String(row.preferredTime || row.bookedFor || row.scheduledAt || ""),
      address,
      items,
    } as Booking;
  }).filter((item) => item.id);
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
  const [view, setView] = useState<"all" | "service" | "shop">("all");

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
      if (!services.ok && !shop.ok) throw new Error("Unable to load orders");
      const serviceItems = services.ok ? listFrom(await services.json(), "service") : [];
      const shopItems = shop.ok ? listFrom(await shop.json(), "shop") : [];
      setBookings([...serviceItems, ...shopItems].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      if (!services.ok || !shop.ok) setLoadError(`Some ${services.ok ? "shop orders" : "service bookings"} could not be refreshed. The available records are shown below.`);
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Booking[];
        setBookings(stored.filter((item) => item.userEmail === user.email).map((item) => ({ ...item, kind: item.kind || (item.items?.length ? "shop" : "service") })));
        setLoadError("Showing bookings saved on this device. Sign in again to refresh live status.");
      } catch { setBookings([]); setLoadError("Bookings could not be loaded."); }
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    // Initial remote synchronization for this client-only account page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!user) return <SignIn onLogin={() => setAuthModalMode("login")} />;

  const visibleBookings = view === "all" ? bookings : bookings.filter((booking) => booking.kind === view);
  const updateBooking = (id: string, kind: Booking["kind"], updates: Partial<Booking>) => {
    setBookings((current) => current.map((booking) => booking.id === id && booking.kind === kind ? { ...booking, ...updates } : booking));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[.25em] text-emerald-600">My bookings</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Track every order in one place</h1><p className="mt-2 text-sm text-slate-600">Open a booking for its schedule, progress, review, payment, or support options.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button><Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Book service <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
      {loadError && <div className="mb-5 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" />{loadError}</div>}
      {bookings.length > 0 && <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {(["all", "service", "shop"] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{item === "all" ? `All (${bookings.length})` : item === "service" ? `Services (${bookings.filter((booking) => booking.kind === "service").length})` : `Shop orders (${bookings.filter((booking) => booking.kind === "shop").length})`}</button>)}
      </div>}
      {loading && !bookings.length ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : bookings.length === 0 ? <Empty /> : visibleBookings.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No orders in this section.</div> : <div className="grid gap-4">{visibleBookings.map((booking) => <BookingCard key={`${booking.kind}-${booking.id}`} booking={booking} onUpdate={(updates) => updateBooking(booking.id, booking.kind, updates)} />)}</div>}
    </div>
  );
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: (updates: Partial<Booking>) => void }) {
  const [open, setOpen] = useState(false);
  const normalized = booking.status.toLowerCase().replace(/\s+/g, "_");
  const steps = booking.kind === "shop" ? shopStatusSteps : serviceStatusSteps;
  const active = Math.max(0, steps.indexOf(normalized));
  const isShop = booking.kind === "shop";
  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isShop ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>{isShop ? <ShoppingBag className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}</div>
        <div className="min-w-0"><p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${isShop ? "text-blue-600" : "text-emerald-600"}`}>{isShop ? "Product order" : "Service booking"}</p><p className="truncate text-lg font-semibold text-slate-900">{booking.workTitle || booking.serviceTitle}</p><p className="mt-1 text-sm text-slate-500">#{booking.id} · {new Date(booking.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${normalized === "cancelled" || normalized === "canceled" ? "bg-red-50 text-red-700" : normalized === "completed" || normalized === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-50 text-amber-700"}`}>{normalized.replaceAll("_", " ")}</span><ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} /></div>
    </button>
    {open && <div className="border-t border-slate-100 p-5">
      {!(["cancelled", "canceled"].includes(normalized)) && <div className={`mb-6 grid gap-1 ${isShop ? "grid-cols-5" : "grid-cols-4"}`}>{steps.map((step, i) => <div key={step} className="text-center"><div className={`mx-auto h-2 rounded-full ${i <= active ? (isShop ? "bg-blue-500" : "bg-emerald-500") : "bg-slate-200"}`} /><p className="mt-2 text-[10px] font-semibold capitalize text-slate-500">{step.replace("_", " ")}</p></div>)}</div>}
      {isShop && booking.items && booking.items.length > 0 && <div className="mb-4 space-y-2"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Products ordered</p>{booking.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">{item.imageUrl ? <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"><Image src={absoluteImage(item.imageUrl)} alt={item.title} fill unoptimized className="object-cover" sizes="64px" /></div> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100"><Package className="h-6 w-6 text-slate-400" /></div>}<div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{item.title}</p><p className="text-sm text-slate-500">Quantity {item.quantity}</p></div><p className="text-sm font-bold text-slate-900">PKR {(item.price * item.quantity).toLocaleString("en-PK")}</p></div>)}</div>}
      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
        <p><strong>Payment:</strong> {booking.paymentMethod}</p><p><strong>Amount:</strong> PKR {Number(booking.servicePrice || 0).toLocaleString("en-PK")}</p>
        {booking.preferredTime && <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{new Date(booking.preferredTime).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p>}
        {booking.address && <p className="flex gap-2"><MapPin className="h-4 w-4 text-slate-400" />{booking.address}</p>}
      </div>
      <BookingActions booking={booking} completed={normalized === "completed" || normalized === "delivered"} onUpdate={onUpdate} />
    </div>}
  </article>;
}

function BookingActions({ booking, completed, onUpdate }: { booking: Booking; completed: boolean; onUpdate: (updates: Partial<Booking>) => void }) {
  const [panel, setPanel] = useState<"review" | "issue" | "cancel" | null>(null);
  const [now] = useState(Date.now);
  const normalized = booking.status.toLowerCase().replace(/\s+/g, "_");
  const terminal = ["completed", "delivered", "cancelled", "canceled", "refunded"].includes(normalized);
  const appointment = booking.preferredTime ? Date.parse(booking.preferredTime) : NaN;
  const hoursRemaining = Number.isFinite(appointment) ? (appointment - now) / 3_600_000 : null;
  const canCancel = !terminal && (booking.kind === "shop" || (hoursRemaining !== null && hoursRemaining >= 6));
  const cancellationHint = booking.kind === "service" && !terminal && !canCancel
    ? hoursRemaining === null ? "Cancellation is unavailable because this booking has no valid appointment time." : "Online cancellation closes six hours before the appointment. Please contact support for urgent help."
    : "";
  return <div className="mt-5"><div className="flex flex-wrap gap-2">
    {completed && <Button onClick={() => setPanel(panel === "review" ? null : "review")}><Star className="mr-2 h-4 w-4" />{booking.kind === "shop" ? "Review products" : "Review service"}</Button>}
    {canCancel && <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setPanel(panel === "cancel" ? null : "cancel")}><XCircle className="mr-2 h-4 w-4" />Cancel {booking.kind === "shop" ? "order" : "booking"}</Button>}
    <Button variant="outline" onClick={() => setPanel(panel === "issue" ? null : "issue")}><MessageSquareWarning className="mr-2 h-4 w-4" />Raise an issue</Button>
  </div>{cancellationHint && <p className="mt-3 text-xs font-medium text-amber-700">{cancellationHint}</p>}{panel === "review" && <ReviewForm booking={booking} />}{panel === "issue" && <IssueForm booking={booking} />}{panel === "cancel" && <CancelForm booking={booking} onCancelled={() => { onUpdate({ status: "cancelled" }); setPanel(null); }} />}</div>;
}

function ReviewForm({ booking }: { booking: Booking }) {
  const [rating, setRating] = useState(5), [comment, setComment] = useState(""), [images, setImages] = useState<string[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState(booking.items?.[0]?.productId || "");
  async function submit() { if (booking.kind === "service" && !booking.serviceId) { setMessage("This booking has no service reference."); return; } if (booking.kind === "shop" && !productId) { setMessage("Select a product to review."); return; } if (!comment.trim()) { setMessage("Please write a short review."); return; } setBusy(true); setMessage(""); try { const res = await fetch(`${API_BASE}/api/reviews`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...(booking.kind === "shop" ? { productId } : { serviceId: booking.serviceId }), orderId: booking.id, rating, comment: comment.trim(), ...(images.length ? { images } : {}) }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Review could not be submitted."); setMessage(data.message || "Review submitted successfully."); } catch (e) { setMessage(e instanceof Error ? e.message : "Review could not be submitted."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"><p className="font-bold text-slate-900">{booking.kind === "shop" ? "Review a delivered product" : "Review this service"}</p>{booking.kind === "shop" && (booking.items?.length || 0) > 1 && <select value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{booking.items?.map((item) => <option key={item.productId} value={item.productId}>{item.title}</option>)}</select>}<div className="flex gap-1">{[1,2,3,4,5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}</div><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What went well? Help other customers know what to expect." /><ImagePicker onChange={setImages} /><p className="text-xs text-slate-500">You can attach up to three JPG, PNG, or WebP images.</p>{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button></div>;
}

function CancelForm({ booking, onCancelled }: { booking: Booking; onCancelled: () => void }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (reason.trim().length < 5) { setMessage("Please provide a short cancellation reason."); return; }
    setBusy(true); setMessage("");
    try {
      const path = booking.kind === "shop" ? `/api/shop/orders/${booking.id}/cancel` : `/api/orders/${booking.id}/cancel`;
      const res = await fetch(`${API_BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ reason: reason.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Cancellation could not be completed.");
      onCancelled();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation could not be completed."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4"><div className="flex gap-3"><AlertCircle className="h-5 w-5 shrink-0 text-red-600" /><div><p className="font-bold text-slate-900">Cancel this {booking.kind === "shop" ? "order" : "booking"}?</p><p className="mt-1 text-sm text-slate-600">This action is sent immediately and may not be reversible.</p></div></div><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us why you need to cancel" />{message && <p className="text-sm font-medium text-red-700">{message}</p>}<Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => void cancel()} disabled={busy}>{busy ? "Cancelling…" : "Confirm cancellation"}</Button></div>;
}

function IssueForm({ booking }: { booking: Booking }) {
  const [details, setDetails] = useState(""), [images, setImages] = useState<string[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit() { if (!details.trim()) { setMessage("Please explain what went wrong."); return; } setBusy(true); setMessage(""); try { const path = booking.kind === "shop" ? `/api/shop/orders/${booking.id}/issues` : `/api/orders/${booking.id}/issues`; const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ description: details.trim(), images }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Issue could not be sent. The support endpoint may not be enabled yet."); setMessage(data.message || "Your issue has been raised."); } catch (e) { setMessage(e instanceof Error ? e.message : "Issue could not be sent."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><p className="font-bold text-slate-900">Tell support what happened</p><Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the problem, what you expected, and how we can help." /><ImagePicker onChange={setImages} />{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Sending…" : "Send to support"}</Button></div>;
}

function ImagePicker({ onChange }: { onChange: (images: string[]) => void }) { const [names, setNames] = useState<string[]>([]); async function choose(e: ChangeEvent<HTMLInputElement>) { const files = Array.from(e.target.files || []).slice(0, 3); setNames(files.map(f => f.name)); onChange(await filesToDataUrls(e.target.files)); } return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600"><Camera className="h-5 w-5 text-primary" /><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => void choose(e)} /><span>{names.length ? `${names.length} photo${names.length > 1 ? "s" : ""} attached` : "Attach up to 3 photos"}</span></label>; }

function SignIn({ onLogin }: { onLogin: () => void }) { return <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4"><div className="w-full rounded-3xl border bg-white p-8 text-center shadow-sm"><UserRound className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 text-2xl font-bold">Sign in to view your bookings</h1><p className="mt-3 text-sm text-slate-600">Your order details and support conversations are private.</p><Button className="mt-6" onClick={onLogin}>Login to continue</Button></div></div>; }
function Empty() { return <div className="rounded-3xl border border-dashed bg-slate-50 p-10 text-center"><CalendarDays className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-sm text-slate-600">Choose a service to create your first booking.</p><Link href="/services" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">Explore services</Link></div>; }
