"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, Camera, ChevronDown, Clock3, CreditCard, MapPin, MessageSquareWarning, Package, ReceiptText, RefreshCw, ShoppingBag, Star, UserRound, WalletCards, Wrench, XCircle, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const STORAGE_KEY = "ustaadpro_bookings";

type Booking = {
  id: string; serviceId?: string; serviceTitle: string; workTitle?: string; servicePrice: number;
  paymentMethod: string; status: string; createdAt: string; userEmail?: string; address?: string;
  preferredTime?: string; notes?: string; kind?: "service" | "shop";
  items?: OrderItem[];
  paymentReceipt?: { amount?: number; status?: string; paymentStage?: string; receiptUrl?: string };
  paymentReceipts?: Array<{ amount?: number; status?: string; paymentStage?: string; receiptUrl?: string }>;
  unitDescription?: string;
  pendingPayment?: number;
  apiTotal?: number;
  paidAmount?: number;
};

type OrderItem = {
  productId?: string;
  serviceId?: string;
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

function parsedObject(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function findServiceId(value: unknown, seen = new Set<object>()): string {
  const parsed = parsedObject(value);
  if (!parsed || typeof parsed !== "object") return "";
  if (seen.has(parsed)) return "";
  seen.add(parsed);
  const record = parsed as Record<string, unknown>;

  for (const key of ["serviceId", "service_id"]) {
    const candidate = record[key];
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) return String(candidate);
  }
  const service = parsedObject(record.service);
  if (service && typeof service === "object") {
    const serviceRecord = service as Record<string, unknown>;
    const candidate = serviceRecord.id ?? serviceRecord.serviceId ?? serviceRecord.service_id;
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) return String(candidate);
  } else if ((typeof service === "string" || typeof service === "number") && String(service).trim()) {
    return String(service);
  }
  for (const child of Object.values(record)) {
    const found = findServiceId(child, seen);
    if (found) return found;
  }
  return "";
}

function listFrom(payload: unknown, kind: "service" | "shop"): Booking[] {
  const object = payload as { orders?: Record<string, unknown>[]; data?: Record<string, unknown>[] };
  const rows = Array.isArray(payload) ? payload : object?.orders || object?.data || [];
  return (rows as Record<string, unknown>[]).map((row) => {
    const possibleItems = parsedObject(row.items ?? row.orderItems ?? row.order_items ?? row.cart);
    const rawItems = Array.isArray(possibleItems) ? possibleItems as Record<string, unknown>[] : [];
    const items = rawItems.map((item) => {
      const product = (item.product || {}) as Record<string, unknown>;
      const serviceItem = (item.service || {}) as Record<string, unknown>;
      return {
        productId: String(item.productId || product.id || ""),
        serviceId: findServiceId(item),
        title: String(item.title || product.title || serviceItem.title || "Service"),
        quantity: Number(item.quantity || 1),
        price: Number(item.unitPrice || item.unit_price || item.price || product.price || serviceItem.price || 0),
        imageUrl: String(item.imageUrl || product.imageUrl || ""),
      };
    });
    const address = typeof row.address === "string" ? row.address : ((row.address || {}) as { address?: string; label?: string; fullAddress?: string }).address || ((row.address || {}) as { label?: string; fullAddress?: string }).fullAddress || ((row.address || {}) as { label?: string }).label || "";
    const firstItem = items[0];
    const service = (row.service || {}) as Record<string, unknown>;
    const listedItemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const singleReceipt = (row.paymentReceipt || row.payment_receipt) as Booking["paymentReceipt"];
    const receiptList = Array.isArray(row.paymentReceipts) ? row.paymentReceipts as Booking["paymentReceipts"] : Array.isArray(row.payment_receipts) ? row.payment_receipts as Booking["paymentReceipts"] : singleReceipt ? [singleReceipt] : [];
    const receiptsPaid = (receiptList || []).filter((receipt) => receipt.status !== "rejected").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
    const apiTotal = Number(row.totalAmount || row.total || row.grandTotal || listedItemsTotal || 0);
    return {
      ...row,
      id: String(row.id || row.orderId || ""),
      kind,
      serviceId: findServiceId(row) || String(service.id || firstItem?.serviceId || ""),
      serviceTitle: String(row.serviceTitle || row.service_title || service.title || (kind === "shop" ? (items.length > 1 ? `${items.length} products` : firstItem?.title || "Shop order") : firstItem?.title || "Service booking")),
      workTitle: String(row.workTitle || row.work_title || rawItems[0]?.selectedWorkTitle || rawItems[0]?.selected_work_title || ""),
      servicePrice: Number(row.servicePrice || (kind === "service" && listedItemsTotal > 0 ? listedItemsTotal : 0) || row.totalAmount || row.total || row.grandTotal || listedItemsTotal),
      paymentMethod: String(row.paymentMethod || row.payment_method || "Not specified"),
      status: String(row.status || (kind === "shop" ? "placed" : "confirmed")),
      createdAt: String(row.createdAt || row.created_at || new Date().toISOString()),
      preferredTime: String(row.preferredTime || row.bookedFor || row.scheduledAt || ""),
      address,
      items,
      paymentReceipt: singleReceipt || receiptList?.[receiptList.length - 1],
      paymentReceipts: receiptList,
      unitDescription: String(row.unitDescription || row.unit_description || row.serviceType || row.service_type || service.unitDescription || service.unit_description || service.serviceType || service.service_type || service.description || ""),
      pendingPayment: Number(row.pendingPayment || row.pending_payment || row.remainingAmount || row.remaining_amount || row.amountPayable || row.amount_payable || 0),
      apiTotal,
      paidAmount: Number(row.paidAmount || row.paid_amount || row.amountPaid || row.amount_paid || receiptsPaid),
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

  const loadInFlight = useRef(false);
  const load = useCallback(async () => {
    if (!user?.email) return;
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    await Promise.resolve();
    setLoading(true); setLoadError("");
    try {
      const headers = authHeaders();
      if (!token()) throw new Error("No authentication token");
      const [services, shop] = await Promise.all([
        fetch(`${API_BASE}/api/orders?limit=50&offset=0`, { headers, cache: "no-store" }),
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
    } finally { setLoading(false); loadInFlight.current = false; }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!user) return <SignIn onLogin={() => setAuthModalMode("login")} />;

  const visibleBookings = view === "all" ? bookings : bookings.filter((booking) => booking.kind === view);
  const serviceCount = bookings.filter((booking) => booking.kind === "service").length;
  const shopCount = bookings.filter((booking) => booking.kind === "shop").length;
  const completedCount = bookings.filter((booking) => ["completed", "delivered"].includes(booking.status.toLowerCase().replace(/\s+/g, "_"))).length;
  const updateBooking = (id: string, kind: Booking["kind"], updates: Partial<Booking>) => {
    setBookings((current) => current.map((booking) => booking.id === id && booking.kind === kind ? { ...booking, ...updates } : booking));
  };

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-slate-100 via-slate-50 to-white pb-16">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-lime-300"><ClipboardList className="h-4 w-4" />My activity</p>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Track bookings and orders</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Follow progress, manage payments, raise an issue, or leave a review—all from one clear timeline.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/wallet" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"><WalletCards className="h-4 w-4 text-lime-300" />PKR {Number(user.walletBalance || 0).toLocaleString("en-PK")}</Link>
              <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
              <Link href="/services" className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400">Book a service <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          {bookings.length > 0 && <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:max-w-lg sm:gap-3"><HeroStat label="All activity" value={bookings.length} /><HeroStat label="Services" value={serviceCount} /><HeroStat label="Completed" value={completedCount} /></div>}
        </section>

        {loadError && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p>{loadError}</p></div>}

        {bookings.length > 0 && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-black text-slate-900">Your activity</h2><p className="text-xs text-slate-500">Select a card to see its timeline and available actions.</p></div>
          <div className="flex w-full gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto">
            {(["all", "service", "shop"] as const).map((item) => { const count = item === "all" ? bookings.length : item === "service" ? serviceCount : shopCount; const label = item === "all" ? "All" : item === "service" ? "Services" : "Shop orders"; return <button key={item} type="button" onClick={() => setView(item)} className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${view === item ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{label}<span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${view === item ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span></button>; })}
          </div>
        </div>}

        <div className="mt-4">
          {loading && !bookings.length ? <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading bookings"><span className="sr-only">Loading bookings…</span>{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-40" /></div><Skeleton className="h-8 w-24 rounded-full" /></div></div>)}</div> : bookings.length === 0 ? <Empty /> : visibleBookings.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Package className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No activity in this section</p><p className="mt-1 text-sm text-slate-500">Try another filter to see your bookings and orders.</p></div> : <div className="grid items-start gap-4 lg:grid-cols-2">{visibleBookings.map((booking) => <BookingCard key={`${booking.kind}-${booking.id}`} booking={booking} onUpdate={(updates) => updateBooking(booking.id, booking.kind, updates)} />)}</div>}
        </div>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10"><p className="text-lg font-black text-white sm:text-xl">{value}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p></div>;
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: (updates: Partial<Booking>) => void }) {
  const [open, setOpen] = useState(false);
  const rawStatus = booking.status.toLowerCase().replace(/\s+/g, "_");
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const latestReceipt = receipts[receipts.length - 1];
  const receiptStatus = latestReceipt?.status?.toLowerCase();
  const paid = Number(booking.paidAmount ?? receipts.filter((receipt) => receipt.status !== "rejected").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0));
  const paymentTotal = Number(booking.apiTotal || booking.servicePrice || 0);
  const serverPending = Number(booking.pendingPayment || 0);
  const paymentRemaining = serverPending > 0 ? serverPending : Math.max(0, paymentTotal - paid);
  const isAdvance = booking.paymentMethod.toLowerCase().includes("200 advance");
  let normalized = rawStatus;
  if (booking.kind !== "shop") {
    if (receiptStatus === "rejected") normalized = "payment_receipt_rejected";
    else if (!latestReceipt || receiptStatus === "submitted" || receiptStatus === "pending") normalized = "payment_receipt_checking";
    else if (isAdvance && paymentRemaining > 0) normalized = rawStatus === "completed" ? "payment_pending" : rawStatus;
    else if (["placed", "pending", "confirmed"].includes(rawStatus)) normalized = receiptStatus === "verified" ? "confirmed" : "payment_receipt_checking";
  }
  const isCancelled = normalized === "cancelled" || normalized === "canceled";
  const steps = booking.kind === "shop" ? shopStatusSteps : serviceStatusSteps;
  const active = isCancelled ? -1 : steps.indexOf(normalized);
  const isShop = booking.kind === "shop";
  const acceptsReceipt = booking.kind !== "shop" && ["rs 200 advance", "full payment", "full payment in advance"].includes(booking.paymentMethod?.toLowerCase());
  const isCompleted = normalized === "completed" || normalized === "delivered";
  const title = booking.workTitle || booking.serviceTitle;
  const total = paymentTotal;
  const remaining = paymentRemaining;
  const created = new Date(booking.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  const statusClass = isCancelled ? "bg-red-50 text-red-700 ring-red-200" : isCompleted ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200";

  return <article className={`group overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 ${open ? "border-emerald-300 ring-4 ring-emerald-50 lg:col-span-2" : "border-slate-200"}`}>
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full p-4 text-left sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner sm:h-14 sm:w-14 ${isShop ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600" : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600"}`}>{isShop ? <ShoppingBag className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${isShop ? "text-blue-600" : "text-emerald-600"}`}>{isShop ? "Product order" : "Home service"}</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ring-1 ${statusClass}`}>{normalized.replaceAll("_", " ")}</span>
          </div>
          <h2 className="mt-1.5 truncate text-base font-black text-slate-900 sm:text-lg">{title}</h2>
          <p className="mt-1 text-xs font-medium text-slate-500"><span className="font-mono text-[11px] text-slate-400">#{booking.id}</span> <span className="mx-1 text-slate-300">•</span> Placed {created}</p>
        </div>
        <div className={`flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold transition ${open ? "bg-emerald-50 text-emerald-700" : "text-slate-500 group-hover:bg-slate-50"}`}><span className="hidden sm:inline">{open ? "Hide" : "Details"}</span><ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryValue label="Total" value={`PKR ${total.toLocaleString("en-PK")}`} />
        <SummaryValue label={isShop ? "Payment" : "Paid online"} value={isShop ? booking.paymentMethod : `PKR ${paid.toLocaleString("en-PK")}`} />
        <SummaryValue label={isShop ? "Items" : "Remaining"} value={isShop ? String(booking.items?.length || 0) : `PKR ${remaining.toLocaleString("en-PK")}`} />
        <SummaryValue label="Schedule" value={booking.preferredTime || (isShop ? "Delivery pending" : "Awaiting confirmation")} truncate />
      </div>
    </button>

    {open && <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
      {!isCancelled ? <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Order progress</h3>
        <div className={`mt-4 grid gap-1 ${isShop ? "grid-cols-5" : "grid-cols-4"}`}>{steps.map((step, i) => <div key={step} className="text-center"><div className={`mx-auto h-2 rounded-full ${i <= active ? (isShop ? "bg-blue-500" : "bg-emerald-500") : "bg-slate-200"}`} /><p className={`mt-2 text-[9px] font-bold capitalize sm:text-[10px] ${i <= active ? "text-slate-700" : "text-slate-400"}`}>{step.replace("_", " ")}</p></div>)}</div>
      </section> : <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">This order has been cancelled.</div>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900"><ReceiptText className="h-4 w-4 text-emerald-600" /> Booking information</h3>
          <div className="mt-4 space-y-3 text-sm">
            <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Created" value={created} />
            <DetailRow icon={<Clock3 className="h-4 w-4" />} label={isShop ? "Delivery" : "Appointment"} value={booking.preferredTime || "Awaiting confirmation"} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label={isShop ? "Delivery address" : "Service address"} value={booking.address || "Address unavailable"} />
            {booking.notes && <DetailRow icon={<MessageSquareWarning className="h-4 w-4" />} label="Special instructions" value={booking.notes} />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900"><CreditCard className="h-4 w-4 text-emerald-600" /> Payment summary</h3>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-900 p-3 text-center text-white">
            <SummaryValue label="Total" value={`PKR ${total.toLocaleString("en-PK")}`} dark />
            <SummaryValue label="Paid" value={`PKR ${paid.toLocaleString("en-PK")}`} dark accent />
            <SummaryValue label="Remaining" value={`PKR ${remaining.toLocaleString("en-PK")}`} dark />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Method</span><span className="text-right font-bold text-slate-800">{booking.paymentMethod}</span></div>
          {latestReceipt && <div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Latest receipt</span><span className={`rounded-full px-2 py-1 font-bold capitalize ${receiptStatus === "verified" ? "bg-emerald-50 text-emerald-700" : receiptStatus === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{latestReceipt.status || "submitted"}</span></div>}
        </section>
      </div>

      {isShop && booking.items && booking.items.length > 0 && <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">Products ordered</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{booking.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">{item.imageUrl ? <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100"><Image src={absoluteImage(item.imageUrl)} alt={item.title} fill className="object-cover" sizes="56px" /></div> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100"><Package className="h-5 w-5 text-slate-400" /></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">Qty {item.quantity}</p></div><p className="text-xs font-black text-slate-900">PKR {(item.price * item.quantity).toLocaleString("en-PK")}</p></div>)}</div></section>}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Available actions</h3><BookingActions booking={booking} completed={isCompleted} isCancelled={isCancelled} acceptsReceipt={acceptsReceipt} onUpdate={onUpdate} /></section>
    </div>}
  </article>;
}

function SummaryValue({ label, value, truncate = false, dark = false, accent = false }: { label: string; value: string; truncate?: boolean; dark?: boolean; accent?: boolean }) {
  return <div className={`min-w-0 ${dark ? "" : "rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"}`}><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-xs font-black sm:text-sm ${accent ? "text-lime-300" : dark ? "text-white" : "text-slate-800"} ${truncate ? "truncate" : ""}`}>{value}</p></div>;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3"><div className="mt-0.5 text-slate-400">{icon}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 break-words font-semibold leading-5 text-slate-700">{value}</p></div></div>;
}

function BookingActions({ booking, completed, isCancelled, acceptsReceipt, onUpdate }: { booking: Booking; completed: boolean; isCancelled: boolean; acceptsReceipt: boolean; onUpdate: (updates: Partial<Booking>) => void }) {
  const [panel, setPanel] = useState<"review" | "issue" | "receipt" | "cancel" | null>(null);
  const [now] = useState(Date.now);
  const normalized = booking.status.toLowerCase().replace(/\s+/g, "_");
  const terminal = ["completed", "delivered", "cancelled", "canceled", "refunded"].includes(normalized);
  const appointment = booking.preferredTime ? Date.parse(booking.preferredTime) : NaN;
  const hoursRemaining = Number.isFinite(appointment) ? (appointment - now) / 3_600_000 : null;
  const canCancel = !terminal && (booking.kind === "shop" || (hoursRemaining !== null && hoursRemaining >= 6));
  const cancellationHint = booking.kind === "service" && !terminal && !canCancel
    ? hoursRemaining === null ? "Cancellation is unavailable because this booking has no valid appointment time." : "Online cancellation closes six hours before the appointment. Please contact support for urgent help."
    : "";
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const paid = Number(booking.paidAmount ?? receipts.filter((receipt) => receipt.status !== "rejected").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0));
  const calculatedPending = Math.max(0, Number(booking.apiTotal || booking.servicePrice || 0) - paid);
  const isInspection = /visit|inspection/i.test(booking.unitDescription || "");
  const knownPending = booking.pendingPayment ? Number(booking.pendingPayment) : calculatedPending;
  const canUploadPayment = acceptsReceipt && (!receipts.length || receipts[receipts.length - 1]?.status === "rejected" || (booking.status.toLowerCase() === "completed" && (knownPending > 0 || isInspection)));

  if (isCancelled) {
    return <div className="mt-5"><div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setPanel(panel === "issue" ? null : "issue")}><MessageSquareWarning className="mr-2 h-4 w-4" />Raise an issue</Button>
    </div>{panel === "issue" && <IssueForm booking={booking} />}</div>;
  }

  return <div className="mt-5">
    <div className="flex flex-wrap gap-2">
      {completed && <Button onClick={() => setPanel(panel === "review" ? null : "review")}><Star className="mr-2 h-4 w-4" />{booking.kind === "shop" ? "Review products" : "Review service"}</Button>}
      {canUploadPayment && <Button variant="outline" onClick={() => setPanel(panel === "receipt" ? null : "receipt")}><Camera className="mr-2 h-4 w-4 text-emerald-600" />{!receipts.length ? "Upload Booking Payment Receipt" : isInspection && !knownPending ? "Pay Professional Quote" : "Upload Pending Payment"}</Button>}
      {canCancel && <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setPanel(panel === "cancel" ? null : "cancel")}><XCircle className="mr-2 h-4 w-4" />Cancel {booking.kind === "shop" ? "order" : "booking"}</Button>}
      <Button variant="outline" onClick={() => setPanel(panel === "issue" ? null : "issue")}><MessageSquareWarning className="mr-2 h-4 w-4" />Raise an issue</Button>
    </div>
    {cancellationHint && <p className="mt-3 text-xs font-medium text-amber-700">{cancellationHint}</p>}
    {panel === "review" && <ReviewForm booking={booking} />}
    {panel === "receipt" && <UploadReceiptForm booking={booking} />}
    {panel === "issue" && <IssueForm booking={booking} />}
    {panel === "cancel" && <CancelForm booking={booking} onCancelled={() => { onUpdate({ status: "cancelled" }); setPanel(null); }} />}
  </div>;
}

function UploadReceiptForm({ booking }: { booking: Booking }) {
  const EASYPAISA_NUMBER = "03485838593";
  const EASYPAISA_TITLE = "Muhammad Ikram";
  const [dataUrl, setDataUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFullPayment = booking.paymentMethod.toLowerCase().includes("full payment");
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const isInitialPayment = !receipts.length;
  const paid = Number(booking.paidAmount ?? receipts.filter((receipt) => receipt.status !== "rejected").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0));
  const calculatedPending = Math.max(0, Number(booking.apiTotal || booking.servicePrice || 0) - paid);
  const isInspection = /visit|inspection/i.test(booking.unitDescription || "");
  const knownPending = booking.pendingPayment ? Number(booking.pendingPayment) : calculatedPending;
  const initialAmount = isFullPayment ? Number(booking.servicePrice || 0) : 200;
  const [quotedAmount, setQuotedAmount] = useState(knownPending > 0 ? String(knownPending) : "");
  const amountDue = isInitialPayment ? initialAmount : isInspection ? Number(quotedAmount || 0) : knownPending;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(EASYPAISA_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  async function submit() {
    if (!dataUrl) { setMessage("Please select a valid receipt image."); return; }
    if (!Number.isFinite(amountDue) || amountDue <= 0) { setMessage("Please enter the approved payment amount."); return; }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/${booking.id}/payment-receipt`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ dataUrl, filename: `${isInitialPayment ? (isFullPayment ? "full-payment" : "advance") : isInspection ? "professional-quote" : "pending-payment"}-${booking.id}.jpg`, amount: amountDue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Receipt upload failed.");
      setMessage("Payment receipt uploaded. It is now being checked by admin. Review will unlock after the final payment is verified.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Receipt upload failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <p className="font-bold text-slate-900 text-base">Upload EasyPaisa Proof of Payment</p>
      {isInspection && !isInitialPayment ? <div><label className="mb-1 block text-xs font-bold text-slate-700">Amount quoted by the professional (PKR)</label><input type="number" min="1" step="1" value={quotedAmount} onChange={(event) => setQuotedAmount(event.target.value)} placeholder="Enter the approved quote" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500" /><p className="mt-1 text-[11px] text-slate-500">Enter only the amount you approved after the visit or inspection.</p></div> : <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">{isInitialPayment ? (isFullPayment ? "Full listed service payment" : "Booking confirmation advance") : "Pending listed payment"}: PKR {amountDue.toLocaleString("en-PK")}</p>}
      <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900">EasyPaisa Account Details</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center justify-between bg-emerald-50/50 rounded-lg p-3">
          <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Account Title</p><p className="text-sm font-bold text-slate-800">{EASYPAISA_TITLE}</p></div>
          <div className="text-right"><p className="text-[10px] font-semibold text-slate-400 uppercase">Account Number</p><p className="text-lg font-black text-emerald-700 tracking-wider">{EASYPAISA_NUMBER}</p></div>
        </div>
        <button type="button" onClick={handleCopyNumber} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition">{copied ? "✓ Account Number Copied!" : `Copy Account Number (${EASYPAISA_NUMBER})`}</button>
      </div>
      <ImagePicker onChange={(urls) => setDataUrl(urls[0] || "")} />
      {message && <p className={`text-sm font-medium ${message.includes("successfully") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
      <Button onClick={() => void submit()} disabled={busy} className="w-full">{busy ? "Uploading…" : "Upload Receipt Screenshot"}</Button>
    </div>
  );
}

function ReviewForm({ booking }: { booking: Booking }) {
  const [rating, setRating] = useState(5), [comment, setComment] = useState(""), [images, setImages] = useState<string[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState(booking.items?.[0]?.productId || "");
  const [serviceId, setServiceId] = useState(booking.serviceId || booking.items?.find((item) => item.serviceId)?.serviceId || "");
  const serviceItems = booking.items?.filter((item) => item.serviceId) || [];
  async function submit() {
    if (booking.kind === "shop" && !productId) { setMessage("Select a product to review."); return; }
    if (!comment.trim()) { setMessage("Please write a short review."); return; }
    setBusy(true); setMessage("");
    try {
      let resolvedServiceId = serviceId;
      if (booking.kind === "service" && !resolvedServiceId) {
        // Older order-list responses omit serviceId. A detail response may
        // still contain it in a nested or serialized order item.
        try {
          const detailResponse = await fetch(`${API_BASE}/api/orders/${booking.id}`, { headers: authHeaders(), cache: "no-store" });
          if (detailResponse.ok) {
            resolvedServiceId = findServiceId(await detailResponse.json());
            if (resolvedServiceId) setServiceId(resolvedServiceId);
          }
        } catch { /* The review API can still resolve the service from orderId. */ }
      }
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...(booking.kind === "shop"
            ? { product: productId, productId }
            : resolvedServiceId
              ? { service: resolvedServiceId, serviceId: resolvedServiceId }
              : {}),
          order: booking.id,
          orderId: booking.id,
          rating,
          comment: comment.trim(),
          ...(images.length ? { images } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Review could not be submitted.");
      setMessage(data.message || "Review submitted successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Review could not be submitted.");
    } finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"><p className="font-bold text-slate-900">{booking.kind === "shop" ? "Review a delivered product" : "Review this service"}</p>{booking.kind === "shop" && (booking.items?.length || 0) > 1 && <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{booking.items?.map((item) => <option key={item.productId} value={item.productId}>{item.title}</option>)}</select>}{booking.kind === "service" && serviceItems.length > 1 && <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{serviceItems.map((item, index) => <option key={`${item.serviceId}-${index}`} value={item.serviceId}>{item.title}</option>)}</select>}<div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}</div><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What went well? Help other customers know what to expect." /><ImagePicker onChange={setImages} /><p className="text-xs text-slate-500">You can attach up to three JPG, PNG, or WebP images.</p>{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button></div>;
}

function CancelForm({ booking, onCancelled }: { booking: Booking; onCancelled: () => void }) {
  const [reason, setReason] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function cancel() { if (reason.trim().length < 5) { setMessage("Please provide a short cancellation reason."); return; } setBusy(true); setMessage(""); try { const path = booking.kind === "shop" ? `/api/shop/orders/${booking.id}/cancel` : `/api/orders/${booking.id}/cancel`; const body = booking.kind === "shop" ? { reason: reason.trim() } : { cancelReason: reason.trim() }; const res = await fetch(`${API_BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Cancellation could not be completed."); onCancelled(); } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation could not be completed."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4"><div className="flex gap-3"><AlertCircle className="h-5 w-5 shrink-0 text-red-600" /><div><p className="font-bold text-slate-900">Cancel this {booking.kind === "shop" ? "order" : "booking"}?</p><p className="mt-1 text-sm text-slate-600">This action is sent immediately and may not be reversible.</p></div></div><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why you need to cancel" />{message && <p className="text-sm font-medium text-red-700">{message}</p>}<Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => void cancel()} disabled={busy}>{busy ? "Cancelling…" : "Confirm cancellation"}</Button></div>;
}

function IssueForm({ booking }: { booking: Booking }) {
  const { user } = useAuth();
  const [details, setDetails] = useState(""), [images, setImages] = useState<File[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit() {
    if (!details.trim()) { setMessage("Please explain what went wrong."); return; }
    setBusy(true); setMessage("");
    try {
      const body = new FormData();
      body.append("name", user?.name || "UstaadPro customer");
      body.append("phone", user?.phone || "Not provided");
      body.append("email", user?.email || "");
      body.append("service", booking.kind === "shop" ? `Shop order #${booking.id}` : booking.serviceTitle);
      if (booking.workTitle) body.append("subService", booking.workTitle);
      body.append("description", `Order #${booking.id}: ${details.trim()}`);
      images.forEach((file) => body.append("images", file, file.name));
      const res = await fetch(`${API_BASE}/api/complaints`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Issue could not be sent.");
      setMessage(data.message || "Your complaint has been submitted.");
      setDetails(""); setImages([]);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Issue could not be sent."); } finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><p className="font-bold text-slate-900">Tell support what happened</p><Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the problem, what you expected, and how we can help." /><ImagePicker onChange={() => {}} onFiles={setImages} maxFiles={5} />{message && <p className="text-sm font-medium text-slate-700">{message}</p>}<Button onClick={() => void submit()} disabled={busy}>{busy ? "Sending…" : "Send to support"}</Button></div>;
}

function ImagePicker({ onChange, onFiles, maxFiles = 3 }: { onChange: (images: string[]) => void; onFiles?: (files: File[]) => void; maxFiles?: number }) { const [names, setNames] = useState<string[]>([]); async function choose(e: ChangeEvent<HTMLInputElement>) { const files = Array.from(e.target.files || []).slice(0, maxFiles); setNames(files.map(f => f.name)); onFiles?.(files); if (!onFiles) onChange(await filesToDataUrls(e.target.files)); } return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600"><Camera className="h-5 w-5 text-primary" /><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => void choose(e)} /><span>{names.length ? `${names.length} photo${names.length > 1 ? "s" : ""} attached` : `Attach up to ${maxFiles} website photos`}</span></label>; }

function SignIn({ onLogin }: { onLogin: () => void }) { return <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4"><div className="w-full rounded-3xl border bg-white p-8 text-center shadow-sm"><UserRound className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 text-2xl font-bold">Sign in to view your bookings</h1><p className="mt-3 text-sm text-slate-600">Your order details and support conversations are private.</p><Button className="mt-6" onClick={onLogin}>Login to continue</Button></div></div>; }
function Empty() { return <div className="rounded-3xl border border-dashed bg-slate-50 p-10 text-center"><CalendarDays className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-sm text-slate-600">Choose a service to create your first booking.</p><Link href="/services" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">Explore services</Link></div>; }
