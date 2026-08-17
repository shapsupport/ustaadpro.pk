"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowRight, CalendarDays, Camera, Check, CheckCircle2,
  ChevronDown, Clock3, Copy, CreditCard, Filter, Loader2, MapPin,
  MessageSquareWarning, MoreVertical, Package, ReceiptText, RefreshCw,
  Search, ShoppingBag, Sparkles, Star, Trash2, UserRound, WalletCards,
  Wind, Wrench, X, XCircle, Zap, Droplets, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/imageCompression";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const STORAGE_KEY = "ustaadpro_bookings";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  cancelReason?: string;
};

type OrderItem = {
  productId?: string;
  serviceId?: string;
  title: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const serviceStatusSteps = ["confirmed", "assigned", "in_progress", "completed"];
const shopStatusSteps = ["placed", "confirmed", "processing", "shipped", "delivered"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
        title: String(item.title || item.name || product.title || serviceItem.title || serviceItem.name || item.selectedWorkTitle || item.selected_work_title || ""),
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
    const receiptList = (Array.isArray(row.paymentReceipts) ? row.paymentReceipts : Array.isArray(row.payment_receipts) ? row.payment_receipts : singleReceipt ? [singleReceipt] : []) as Booking["paymentReceipt"][];
    const receiptsPaid = (receiptList || []).filter((r) => r?.status !== "rejected").reduce((sum: number, r) => sum + Number(r?.amount || 0), 0);
    const apiTotal = Number(row.totalAmount || row.total || row.grandTotal || listedItemsTotal || 0);

    const extractedTitle = String(
      row.serviceTitle ||
      row.service_title ||
      row.serviceName ||
      row.service_name ||
      row.title ||
      row.name ||
      service.title ||
      service.name ||
      firstItem?.title ||
      ""
    );

    const extractedWork = String(
      row.workTitle ||
      row.work_title ||
      rawItems[0]?.selectedWorkTitle ||
      rawItems[0]?.selected_work_title ||
      rawItems[0]?.workTitle ||
      rawItems[0]?.work_title ||
      ""
    );

    return {
      ...row,
      id: String(row.id || row.orderId || ""),
      kind,
      serviceId: findServiceId(row) || String(service.id || firstItem?.serviceId || ""),
      serviceTitle: extractedTitle,
      workTitle: extractedWork,
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
      cancelReason: String(row.cancelReason || row.cancel_reason || ""),
    } as Booking;
  }).filter((item) => item.id);
}

function filesToDataUrls(files: FileList | null) {
  return Promise.all(Array.from(files || []).slice(0, 3).map((file) => compressImage(file)));
}

// ─── Service Icon Resolver ────────────────────────────────────────────────────
function ServiceIcon({ title, className }: { title: string; className?: string }) {
  const t = title.toLowerCase();
  if (/ac|air.?con|cooling|hvac/i.test(t)) return <Wind className={className} />;
  if (/electric|wiring|switch|power|light/i.test(t)) return <Zap className={className} />;
  if (/plumb|pipe|tap|water|drain|leak/i.test(t)) return <Droplets className={className} />;
  if (/clean|wash|dust|mop|sweep/i.test(t)) return <Sparkles className={className} />;
  if (/shop|product|order/i.test(t)) return <ShoppingBag className={className} />;
  return <Wrench className={className} />;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
type StatusConfig = { label: string; color: string; dot: string };
function getStatusConfig(normalized: string): StatusConfig {
  switch (normalized) {
    case "payment_receipt_checking": return { label: "Payment Verification", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500" };
    case "payment_receipt_rejected": return { label: "Receipt Rejected", color: "bg-red-50 text-red-700 ring-1 ring-red-200", dot: "bg-red-500" };
    case "payment_pending": return { label: "Payment Pending", color: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", dot: "bg-orange-500" };
    case "confirmed": return { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" };
    case "assigned": return { label: "Provider Assigned", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500" };
    case "in_progress": return { label: "In Progress", color: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", dot: "bg-indigo-500" };
    case "completed": return { label: "Completed", color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" };
    case "placed": return { label: "Placed", color: "bg-slate-50 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
    case "processing": return { label: "Processing", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500" };
    case "shipped": return { label: "Shipped", color: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", dot: "bg-violet-500" };
    case "delivered": return { label: "Delivered", color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" };
    case "cancelled": case "canceled": return { label: "Cancelled", color: "bg-red-50 text-red-700 ring-1 ring-red-200", dot: "bg-red-500" };
    default: return { label: normalized.replaceAll("_", " "), color: "bg-slate-50 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
  }
}

// ─── Normalize booking status ─────────────────────────────────────────────────
function normalizeStatus(booking: Booking) {
  const rawStatus = booking.status.toLowerCase().replace(/\s+/g, "_");
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const latestReceipt = receipts[receipts.length - 1];
  const receiptStatus = latestReceipt?.status?.toLowerCase();
  const paid = Number(booking.paidAmount ?? receipts.filter((r) => r.status !== "rejected").reduce((sum, r) => sum + Number(r.amount || 0), 0));
  const paymentTotal = Number(booking.apiTotal || booking.servicePrice || 0);
  const serverPending = Number(booking.pendingPayment || 0);
  const paymentRemaining = serverPending > 0 ? serverPending : Math.max(0, paymentTotal - paid);
  const isAdvance = booking.paymentMethod.toLowerCase().includes("200 advance");

  // Statuses set by admin that represent real booking progress — always honour these.
  // NOTE: "completed" and "confirmed" are included so admin-set status is never
  //        overridden by payment-receipt logic once admin explicitly moves booking forward.
  const adminProgressStatuses = ["confirmed", "assigned", "in_progress", "processing", "completed", "shipped", "delivered", "cancelled", "canceled", "refunded"];

  let normalized = rawStatus;
  if (booking.kind !== "shop") {
    if (adminProgressStatuses.includes(rawStatus)) {
      // Admin has explicitly advanced the booking — respect it.
      // Only override if advance-payment booking is completed but still owes money.
      if (isAdvance && paymentRemaining > 0 && rawStatus === "completed") {
        normalized = "payment_pending";
      }
      // else: keep rawStatus (assigned / in_progress / etc.)
    } else if (receiptStatus === "rejected") {
      normalized = "payment_receipt_rejected";
    } else if (isAdvance && paymentRemaining > 0 && rawStatus === "completed") {
      normalized = "payment_pending";
    } else if (["placed", "pending", "confirmed"].includes(rawStatus)) {
      // Still in initial phase — let receipt status drive display.
      normalized = receiptStatus === "verified" ? "confirmed" : "payment_receipt_checking";
    } else if (!latestReceipt || receiptStatus === "submitted" || receiptStatus === "pending") {
      normalized = "payment_receipt_checking";
    }
  }
  return { normalized, receipts, latestReceipt, receiptStatus, paid, paymentTotal, paymentRemaining };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrackBookingPage() {
  const { user, setAuthModalMode } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "shop">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
      if (!services.ok || !shop.ok) setLoadError(`Some ${services.ok ? "shop orders" : "service bookings"} could not be refreshed.`);
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

  const activeStatuses = ["payment_receipt_checking", "payment_receipt_rejected", "payment_pending", "confirmed", "assigned", "in_progress", "placed", "processing", "shipped"];
  const totalSpent = bookings.reduce((sum, booking) => sum + Number(booking.paidAmount || 0), 0);
  const activeCount = bookings.filter((booking) => activeStatuses.includes(normalizeStatus(booking).normalized)).length;
  const shopCount = bookings.filter((booking) => booking.kind === "shop").length;
  const completedCount = bookings.filter((booking) => ["completed", "delivered"].includes(normalizeStatus(booking).normalized)).length;
  const updateBooking = (id: string, kind: Booking["kind"], updates: Partial<Booking>) => {
    setBookings((curr) => curr.map((b) => b.id === id && b.kind === kind ? { ...b, ...updates } : b));
    if (selectedBooking?.id === id) setSelectedBooking((curr) => curr ? { ...curr, ...updates } : curr);
  };

  const filtered = bookings.filter((b) => {
    const { normalized } = normalizeStatus(b);
    const isCompleted = normalized === "completed" || normalized === "delivered";
    const isActive = activeStatuses.includes(normalized);
    if (activeTab === "active" && !isActive) return false;
    if (activeTab === "completed" && !isCompleted) return false;
    if (activeTab === "shop" && b.kind !== "shop") return false;
    if (statusFilter !== "all" && normalized !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (b.workTitle || b.serviceTitle).toLowerCase();
      return title.includes(q) || b.id.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q);
    }
    return true;
  });
  const visibleBookings = filtered;

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-slate-100 pb-32 sm:pb-24">
      {/* ── HERO HEADER ── */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-lime-400/8 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-600/5 blur-2xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: title */}
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                <ClipboardList className="h-3.5 w-3.5" />
                My Activity
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Track your bookings & orders
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                Follow progress, manage payments, raise an issue, or leave a review—all from one clear timeline.
              </p>
            </div>
            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              <Link href="/wallet" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/12">
                <WalletCards className="h-4 w-4 text-lime-400" />
                <span className="text-lime-400">PKR {Number(user.walletBalance || 0).toLocaleString("en-PK")}</span>
              </Link>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link href="/services" className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400">
                Book a Service <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ── 4 Stat Cards ── */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/8 pt-5 sm:grid-cols-4">
            {[
              { label: "Total Activity", sub: "All bookings & orders", value: bookings.length, format: false, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", Icon: ClipboardList },
              { label: "Active Services", sub: "In progress", value: activeCount, format: false, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", Icon: Wrench },
              { label: "Completed", sub: "Finished services", value: completedCount, format: false, iconBg: "bg-violet-500/20", iconColor: "text-violet-400", Icon: CheckCircle2 },
              { label: "Total Spent", sub: "Across all services", value: totalSpent, format: true, prefix: "PKR ", iconBg: "bg-amber-500/20", iconColor: "text-amber-400", Icon: WalletCards },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/8">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.iconBg}`}>
                  <stat.Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.prefix || ""}{stat.format ? stat.value.toLocaleString("en-PK") : stat.value}</p>
                  <p className="text-[10px] text-slate-500">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Error Banner ── */}
        {loadError && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p>{loadError}</p>
          </div>
        )}

        {/* ── Tab Nav + Search ── */}
        <div className="mt-4 flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
          {/* Underline tabs */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {([
              { id: "all" as const, label: "All", count: bookings.length },
              { id: "active" as const, label: "Active", count: activeCount },
              { id: "completed" as const, label: "Completed", count: completedCount },
              { id: "shop" as const, label: "Shop Orders", count: shopCount },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 px-4 pb-3 pt-2 text-sm font-semibold transition-colors ${activeTab === tab.id
                  ? "text-emerald-600"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-3 sm:pb-2">
            <label className="relative min-w-0 flex-1 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking or service..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="relative">
              <button type="button" onClick={() => setShowFilterMenu((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <Filter className="h-4 w-4" /> Filter
              </button>
              {showFilterMenu && <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {[{ value: "all", label: "All statuses" }, ...Object.entries({ payment_receipt_checking: "Payment verification", confirmed: "Confirmed", assigned: "Provider assigned", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", placed: "Order placed", processing: "Processing", shipped: "Shipped", delivered: "Delivered" }).map(([value, label]) => ({ value, label }))].map((option) => (
                  <button key={option.value} type="button" onClick={() => { setStatusFilter(option.value); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${statusFilter === option.value ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}>
                    {option.label}{statusFilter === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {loading && !bookings.length ? <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading bookings"><span className="sr-only">Loading bookings…</span>{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-40" /></div><Skeleton className="h-8 w-24 rounded-full" /></div></div>)}</div> : bookings.length === 0 ? <Empty /> : visibleBookings.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Package className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No activity in this section</p><p className="mt-1 text-sm text-slate-500">Try another filter to see your bookings and orders.</p></div> : <div className="grid items-start gap-4 lg:grid-cols-2">{visibleBookings.map((booking) => <BookingCard key={`${booking.kind}-${booking.id}`} booking={booking} onViewDetails={() => setSelectedBooking(booking)} onUpdate={(updates) => updateBooking(booking.id, booking.kind, updates)} />)}</div>}
        </div>
      </div>
      {selectedBooking && <BookingDetailModal booking={selectedBooking} customerName={user.name} customerEmail={user.email} customerPhone={user.phone} onClose={() => setSelectedBooking(null)} onUpdate={(updates) => updateBooking(selectedBooking.id, selectedBooking.kind, updates)} />}
    </main>
  );
}

// ─── Service Title & Icon Resolver ───────────────────────────────────────────
function resolveBookingDetails(booking: Booking) {
  const isShop = booking.kind === "shop";
  const items = booking.items || [];
  const rawItem = items[0];

  let rawTitle = String(
    booking.workTitle ||
    booking.serviceTitle ||
    (booking as Record<string, unknown>).title ||
    (booking as Record<string, unknown>).serviceName ||
    (booking as Record<string, unknown>).service_name ||
    (booking as Record<string, unknown>).name ||
    rawItem?.title ||
    ""
  ).trim();

  // If generic title, clear it to resolve a specific service name
  if (!rawTitle || /^(service booking|service|shop order|order)$/i.test(rawTitle)) {
    rawTitle = "";
  }

  const searchStr = (
    rawTitle + " " +
    (booking.serviceId || "") + " " +
    (booking.unitDescription || "") + " " +
    (booking.notes || "") + " " +
    (booking.id || "")
  ).toLowerCase();

  let resolvedTitle = rawTitle;
  let iconTheme = {
    boxBg: "bg-emerald-50 text-emerald-600",
    Icon: Wind,
  };

  if (/ac|air.?con|cooling|hvac|compressor/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "AC Repair Service";
    iconTheme = { boxBg: "bg-emerald-50 text-emerald-600", Icon: Wind };
  } else if (/plumb|pipe|tap|water|drain|leak|geyser|motor/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "Plumbing Service";
    iconTheme = { boxBg: "bg-blue-50 text-blue-500", Icon: Droplets };
  } else if (/wash.*mach|laundry/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "Washing Machine Repair";
    iconTheme = { boxBg: "bg-pink-50 text-pink-500", Icon: Wrench };
  } else if (/clean|dust|mop|sweep|maid|housekeeping|sofa/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "Home Cleaning";
    iconTheme = { boxBg: "bg-purple-50 text-purple-500", Icon: Sparkles };
  } else if (/electric|wire|wiring|switch|power|light|breaker|fan|socket/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "Electrician Service";
    iconTheme = { boxBg: "bg-amber-50 text-amber-500", Icon: Zap };
  } else if (/paint|color|wall|renovat/i.test(searchStr)) {
    resolvedTitle = resolvedTitle || "Painting Service";
    iconTheme = { boxBg: "bg-teal-50 text-teal-500", Icon: Wrench };
  } else if (isShop) {
    resolvedTitle = resolvedTitle || (items.length > 1 ? `${items.length} Products` : rawItem?.title || "Shop Order");
    iconTheme = { boxBg: "bg-blue-50 text-blue-600", Icon: ShoppingBag };
  }

  // Deterministic fallback based on order ID if title is still empty
  if (!resolvedTitle) {
    const hash = (booking.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const catalog = [
      { title: "AC Repair Service", boxBg: "bg-emerald-50 text-emerald-600", Icon: Wind },
      { title: "Plumbing Service", boxBg: "bg-blue-50 text-blue-500", Icon: Droplets },
      { title: "Home Cleaning", boxBg: "bg-purple-50 text-purple-500", Icon: Sparkles },
      { title: "Electrician Service", boxBg: "bg-amber-50 text-amber-500", Icon: Zap },
      { title: "Washing Machine Repair", boxBg: "bg-pink-50 text-pink-500", Icon: Wrench },
      { title: "Painting Service", boxBg: "bg-teal-50 text-teal-500", Icon: Wrench },
    ];
    const item = catalog[hash % catalog.length];
    resolvedTitle = item.title;
    iconTheme = { boxBg: item.boxBg, Icon: item.Icon };
  }

  return { title: resolvedTitle, iconTheme };
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({
  booking,
  onUpdate,
  onViewDetails,
}: {
  booking: Booking;
  onUpdate: (updates: Partial<Booking>) => void;
  onViewDetails: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { normalized, paid, paymentTotal, paymentRemaining, receiptStatus } = normalizeStatus(booking);
  const statusConfig = getStatusConfig(normalized);
  const isCancelled = normalized === "cancelled" || normalized === "canceled";
  const isCompleted = normalized === "completed" || normalized === "delivered";
  const isShop = booking.kind === "shop";
  const total = paymentTotal;
  const remaining = paymentRemaining;

  const { title, iconTheme } = resolveBookingDetails(booking);
  const IconComponent = iconTheme.Icon;

  const steps = isShop ? shopStatusSteps : serviceStatusSteps;
  // 4 dots: Receipt → Confirmed → In Progress → Completed
  // (confirmed + assigned both fill dot 2; in_progress fills dot 3; completed fills dot 4)
  const stepLabels = isShop
    ? ["Placed", "Confirmed", "Shipped", "Delivered"]
    : ["Receipt", "Confirmed", "In Progress", "Completed"];
  const activeStep = isCancelled ? -1 : (() => {
    // Dot 1 — Receipt / payment checking
    if (normalized === "payment_receipt_checking" || normalized === "payment_receipt_rejected") return 0;
    // Dot 2 — Confirmed OR Assigned (both mean booking is accepted)
    if (normalized === "confirmed" || normalized === "payment_pending" || normalized === "assigned") return 1;
    // Dot 3 — In Progress
    if (normalized === "in_progress" || normalized === "processing") return 2;
    // Dot 4 — Completed
    if (normalized === "completed" || normalized === "delivered") return 3;
    const idx = steps.indexOf(normalized);
    return idx >= 0 ? idx : 0;
  })();

  // Clean address
  const rawAddress = booking.address || "";
  const isRawCoord = /latitude|longitude|-?\d+\.\d{4,}/i.test(rawAddress.trim());
  const displayAddress = isRawCoord ? "" : rawAddress;

  // Formatted date/time
  let scheduleText = "";
  if (booking.preferredTime) {
    const d = new Date(booking.preferredTime);
    if (!isNaN(d.getTime())) {
      scheduleText =
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
        "  •  " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else {
      scheduleText = booking.preferredTime;
    }
  }

  const completedCount = isCancelled ? 0 : activeStep + 1;
  const totalSteps = stepLabels.length;

  const acceptsReceipt = booking.kind !== "shop" && ["rs 200 advance", "full payment", "full payment in advance"].includes(booking.paymentMethod?.toLowerCase());
  const progressColor = isCancelled ? "bg-red-500" : isCompleted ? "bg-emerald-500" : normalized === "in_progress" ? "bg-indigo-500" : normalized === "assigned" ? "bg-blue-500" : "bg-amber-500";

  return (
    <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all duration-150 hover:shadow-md">
      <div>
        {/* ── Top Header Row ── */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* Left: Icon + Title info */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {/* Icon Box */}
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl ${iconTheme.boxBg}`}>
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.14em] ${isShop ? "text-blue-500" : "text-emerald-600"}`}>
                {isShop ? "SHOP ORDER" : "HOME SERVICE"}
              </p>
              <h2 className="mt-0.5 text-sm sm:text-base font-bold leading-snug text-slate-900 break-words line-clamp-2">{title}</h2>
              <p className="mt-0.5 font-mono text-[10px] sm:text-xs text-slate-400">#USTAADPRO-{booking.id.slice(-6).toUpperCase()}</p>

              {/* Schedule & Location */}
              {(scheduleText || displayAddress) && (
                <div className="mt-1.5 sm:mt-2 space-y-0.5 text-xs text-slate-500">
                  {scheduleText && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-[11px] sm:text-xs">{scheduleText}</span>
                    </div>
                  )}
                  {displayAddress && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-[11px] sm:text-xs">{displayAddress}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Status Badge + 3-Dot */}
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold leading-none ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="More options"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
                  <button type="button" onClick={() => { void navigator.clipboard.writeText(booking.id); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Order ID
                  </button>
                  <button type="button" onClick={() => { onViewDetails(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <ReceiptText className="h-3.5 w-3.5 text-emerald-600" /> View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Alerts (Rejected only) ── */}
        {receiptStatus === "rejected" && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            Payment receipt rejected — please upload a new screenshot.
          </div>
        )}
      </div>

      {/* ── Bottom Section: Financials (left) + Progress (right) ── */}
      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[1.2fr_.8fr]">
        {/* Left Column: Financial Numbers + View Details */}
        <div className="min-w-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400">Total</p>
              <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-900 truncate">PKR {total.toLocaleString("en-PK")}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400">Paid Online</p>
              <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-900 truncate">PKR {paid.toLocaleString("en-PK")}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400">{isShop ? "Items" : "Remaining"}</p>
              <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-900 truncate">
                {isShop ? String(booking.items?.length || 0) : `PKR ${remaining.toLocaleString("en-PK")}`}
              </p>
            </div>
          </div>

          <button type="button" onClick={onViewDetails} className="mt-3 inline-flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700">View Details<ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-[10px] font-semibold text-slate-500">Booking Progress</p>
          <div className="mt-3 flex items-center">
            {stepLabels.map((label, index) => <div key={label} className="flex flex-1 items-center last:flex-none"><span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${index <= activeStep ? `${progressColor} border-transparent text-white` : "border-slate-300 bg-white"}`}>{index <= activeStep && <Check className="h-2.5 w-2.5 stroke-[3]" />}</span>{index < totalSteps - 1 && <span className={`h-0.5 flex-1 ${index < activeStep ? progressColor : "bg-slate-200"}`} />}</div>)}
          </div>
          <p className="mt-3 text-[10px] font-medium text-slate-500">{isCancelled ? "Cancelled" : `${completedCount} of ${totalSteps} Completed`}</p>
        </div>
      </div>
    </article>
  );
}

function BookingDetailModal({ booking, customerName, customerEmail, customerPhone, onClose, onUpdate }: { booking: Booking; customerName: string; customerEmail: string; customerPhone: string; onClose: () => void; onUpdate: (updates: Partial<Booking>) => void }) {
  const { normalized, paid, paymentTotal, paymentRemaining } = normalizeStatus(booking);
  const status = getStatusConfig(normalized);
  const { title, iconTheme } = resolveBookingDetails(booking);
  const IconComponent = iconTheme.Icon;
  const isCompleted = normalized === "completed" || normalized === "delivered";
  const isCancelled = normalized === "cancelled" || normalized === "canceled";
  const schedule = booking.preferredTime && !Number.isNaN(Date.parse(booking.preferredTime)) ? new Date(booking.preferredTime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : booking.preferredTime || "Not scheduled";

  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="booking-details-title" onMouseDown={onClose}>
    <section className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconTheme.boxBg}`}><IconComponent className="h-6 w-6" /></div><div className="min-w-0"><p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${booking.kind === "shop" ? "text-blue-600" : "text-emerald-600"}`}>{booking.kind === "shop" ? "Shop order" : "Home service"}</p><h2 id="booking-details-title" className="truncate text-lg font-black text-slate-900">{title}</h2><p className="font-mono text-xs text-slate-500">#USTAADPRO-{booking.id.slice(-6).toUpperCase()}</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close details" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="text-xs font-semibold text-slate-500">Current status</p><span className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${status.color}`}>{status.label}</span></div><div className="text-right"><p className="text-xs font-semibold text-slate-500">Total amount</p><p className="mt-1 text-xl font-black text-slate-900">PKR {paymentTotal.toLocaleString("en-PK")}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Booking details</h3><div className="space-y-4"><DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Appointment" value={schedule} />{booking.address && <DetailRow icon={<MapPin className="h-4 w-4" />} label="Service address" value={booking.address} />}{booking.notes && <DetailRow icon={<ReceiptText className="h-4 w-4" />} label="Customer notes" value={booking.notes} />}</div></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Customer details</h3><div className="space-y-4"><DetailRow icon={<UserRound className="h-4 w-4" />} label="Name" value={customerName || "Not available"} /><DetailRow icon={<MessageSquareWarning className="h-4 w-4" />} label="Email" value={booking.userEmail || customerEmail || "Not available"} /><DetailRow icon={<CreditCard className="h-4 w-4" />} label="Phone" value={customerPhone || "Not available"} /></div></div></div>
        <div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Payment summary</h3><div className="mt-3 grid grid-cols-3 divide-x divide-slate-100"><SummaryValue label="Total" value={`PKR ${paymentTotal.toLocaleString("en-PK")}`} /><SummaryValue label="Paid online" value={`PKR ${paid.toLocaleString("en-PK")}`} /><SummaryValue label="Remaining" value={`PKR ${paymentRemaining.toLocaleString("en-PK")}`} /></div></div>
        {booking.items?.length ? <div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Order items</h3><div className="mt-3 space-y-2">{booking.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">{item.imageUrl ? <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"><Image src={absoluteImage(item.imageUrl)} alt={item.title} fill className="object-cover" sizes="48px" /></div> : <Package className="h-5 w-5 text-slate-400" />}<p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{item.title} <span className="text-slate-500">× {item.quantity}</span></p><p className="text-sm font-black text-slate-900">PKR {(item.price * item.quantity).toLocaleString("en-PK")}</p></div>)}</div></div> : null}
        <div className="rounded-2xl bg-slate-50 p-4"><h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Available actions</h3><BookingActions booking={booking} completed={isCompleted} isCancelled={isCancelled} acceptsReceipt={booking.kind !== "shop"} onUpdate={onUpdate} /></div>
      </div>
    </section>
  </div>;
}

function SummaryValue({ label, value, truncate = false, dark = false, accent = false }: { label: string; value: string; truncate?: boolean; dark?: boolean; accent?: boolean }) {
  return <div className={`min-w-0 ${dark ? "" : "rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"}`}><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-xs font-black sm:text-sm ${accent ? "text-lime-300" : dark ? "text-white" : "text-slate-800"} ${truncate ? "truncate" : ""}`}>{value}</p></div>;
}

function LegacyDetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function UploadReceiptForm({ booking, onUploaded }: { booking: Booking; onUploaded?: () => void | Promise<void> }) {
  const EASYPAISA_NUMBER = "03485838593";
  const EASYPAISA_TITLE = "Muhammad Ikram";
  const [dataUrl, setDataUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFullPayment = booking.paymentMethod.toLowerCase().includes("full payment");
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const isInitialPayment = !receipts.length;
  const paid = Number(booking.paidAmount ?? receipts.filter((r) => r.status !== "rejected").reduce((sum, r) => sum + Number(r.amount || 0), 0));
  const calculatedPending = Math.max(0, Number(booking.apiTotal || booking.servicePrice || 0) - paid);
  const isInspection = /visit|inspection/i.test(booking.unitDescription || "");
  const knownPending = booking.pendingPayment ? Number(booking.pendingPayment) : calculatedPending;
  const initialAmount = isFullPayment ? Number(booking.servicePrice || 0) : 200;
  const [quotedAmount, setQuotedAmount] = useState(knownPending > 0 ? String(knownPending) : "");
  const amountDue = isInitialPayment ? initialAmount : isInspection ? Number(quotedAmount || 0) : knownPending;

  const handleCopyNumber = () => {
    void navigator.clipboard.writeText(EASYPAISA_NUMBER);
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
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Receipt upload failed.");
      setMessage("Payment receipt uploaded. It is now being checked by admin. Review will unlock after the final payment is verified.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Receipt upload failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <p className="text-base font-bold text-slate-900">Upload EasyPaisa Proof of Payment</p>
      {isInspection && !isInitialPayment ? (
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">Amount quoted by the professional (PKR)</label>
          <input type="number" min="1" step="1" value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} placeholder="Enter the approved quote" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500" />
          <p className="mt-1 text-[11px] text-slate-500">Enter only the amount you approved after the visit or inspection.</p>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
          {isInitialPayment ? (isFullPayment ? "Full listed service payment" : "Booking confirmation advance") : "Pending listed payment"}: PKR {amountDue.toLocaleString("en-PK")}
        </p>
      )}
      <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900">EasyPaisa Account Details</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center justify-between bg-emerald-50/50 rounded-lg p-3">
          <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Account Title</p><p className="text-sm font-bold text-slate-800">{EASYPAISA_TITLE}</p></div>
          <div className="text-right"><p className="text-[10px] font-semibold text-slate-400 uppercase">Account Number</p><p className="text-lg font-black text-emerald-700 tracking-wider">{EASYPAISA_NUMBER}</p></div>
        </div>
        <button type="button" onClick={handleCopyNumber} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition">
          {copied ? "✓ Account Number Copied!" : `Copy Account Number (${EASYPAISA_NUMBER})`}
        </button>
      </div>
      <ImagePicker onChange={(urls) => setDataUrl(urls[0] || "")} />
      {message && <p className={`text-sm font-medium ${message.includes("uploaded") || message.includes("success") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
      <Button onClick={() => void submit()} disabled={busy} className="w-full">{busy ? "Uploading…" : "Upload Receipt Screenshot"}</Button>
    </div>
  );
}

function ReviewForm({ booking }: { booking: Booking }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
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
        try {
          const detailResponse = await fetch(`${API_BASE}/api/orders/${booking.id}`, { headers: authHeaders(), cache: "no-store" });
          if (detailResponse.ok) {
            resolvedServiceId = findServiceId(await detailResponse.json());
            if (resolvedServiceId) setServiceId(resolvedServiceId);
          }
        } catch { /* ignore */ }
      }
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...(booking.kind === "shop" ? { product: productId, productId } : resolvedServiceId ? { service: resolvedServiceId, serviceId: resolvedServiceId } : {}),
          order: booking.id, orderId: booking.id, rating, comment: comment.trim(),
          ...(images.length ? { images } : {}),
        }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Review could not be submitted.");
      setMessage(data.message || "Review submitted successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Review could not be submitted.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="font-bold text-slate-900">{booking.kind === "shop" ? "Review a delivered product" : "Review this service"}</p>
      {booking.kind === "shop" && (booking.items?.length || 0) > 1 && (
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
          {booking.items?.map((item) => <option key={item.productId} value={item.productId}>{item.title}</option>)}
        </select>
      )}
      {booking.kind === "service" && serviceItems.length > 1 && (
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
          {serviceItems.map((item, i) => <option key={`${item.serviceId}-${i}`} value={item.serviceId}>{item.title}</option>)}
        </select>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well? Help other customers know what to expect." />
      <ImagePicker onChange={setImages} />
      <p className="text-xs text-slate-500">You can attach up to three JPG, PNG, or WebP images.</p>
      {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
      <Button onClick={() => void submit()} disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button>
    </div>
  );
}

function CancelForm({ booking, onCancelled }: { booking: Booking; onCancelled: () => void }) {
  const [reason, setReason] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function cancel() { if (reason.trim().length < 5) { setMessage("Please provide a short cancellation reason."); return; } setBusy(true); setMessage(""); try { const path = booking.kind === "shop" ? `/api/shop/orders/${booking.id}/cancel` : `/api/orders/${booking.id}/cancel`; const body = booking.kind === "shop" ? { reason: reason.trim() } : { cancelReason: reason.trim() }; const res = await fetch(`${API_BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || "Cancellation could not be completed."); onCancelled(); } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation could not be completed."); } finally { setBusy(false); } }
  return <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4"><div className="flex gap-3"><AlertCircle className="h-5 w-5 shrink-0 text-red-600" /><div><p className="font-bold text-slate-900">Cancel this {booking.kind === "shop" ? "order" : "booking"}?</p><p className="mt-1 text-sm text-slate-600">This action is sent immediately and may not be reversible.</p></div></div><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why you need to cancel" />{message && <p className="text-sm font-medium text-red-700">{message}</p>}<Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => void cancel()} disabled={busy}>{busy ? "Cancelling…" : "Confirm cancellation"}</Button></div>;
}

function RemainingPaymentModal({ booking, onUploaded }: { booking: Booking; onUploaded: () => void | Promise<void> }) {
  const receipts = booking.paymentReceipts?.length ? booking.paymentReceipts : booking.paymentReceipt ? [booking.paymentReceipt] : [];
  const paid = Number(booking.paidAmount ?? receipts.filter((receipt) => receipt.status !== "rejected").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0));
  const remaining = Number(booking.pendingPayment || 0) || Math.max(0, Number(booking.apiTotal || booking.servicePrice || 0) - paid);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="remaining-payment-title">
    <div className="max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Service completed</p><h2 id="remaining-payment-title" className="mt-1 text-2xl font-black text-slate-900">Pay your remaining balance</h2><p className="mt-2 text-sm text-slate-600">Your PKR 200 advance is recorded. Upload the remaining payment receipt to finish this booking.</p></div>
      <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining balance</p><p className="mt-1 text-3xl font-black">PKR {remaining.toLocaleString("en-PK")}</p><p className="mt-1 text-xs text-slate-400">Order #{booking.id}</p></div>
      <UploadReceiptForm booking={booking} onUploaded={onUploaded} />
    </div>
  </div>;
}

function IssueForm({ booking }: { booking: Booking }) {
  const { user } = useAuth();
  const [details, setDetails] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Issue could not be sent.");
      setMessage(data.message || "Your complaint has been submitted.");
      setDetails(""); setImages([]);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Issue could not be sent."); } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="font-bold text-slate-900">Tell support what happened</p>
      <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the problem, what you expected, and how we can help." />
      <ImagePicker onChange={() => { }} onFiles={setImages} maxFiles={5} />
      {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
      <Button onClick={() => void submit()} disabled={busy}>{busy ? "Sending…" : "Send to support"}</Button>
    </div>
  );
}

// ─── Image Picker (with 5MB limit) ────────────────────────────────────────────
function ImagePicker({ onChange, onFiles, maxFiles = 3 }: { onChange: (images: string[]) => void; onFiles?: (files: File[]) => void; maxFiles?: number }) {
  const [names, setNames] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;
    const oversized = rawFiles.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setFileError("Image is too large. Please select an image under 5MB.");
      setNames([]);
      if (e.target) e.target.value = "";
      onFiles?.([]);
      onChange([]);
      return;
    }
    setFileError("");
    const files = rawFiles.slice(0, maxFiles);
    setNames(files.map((f) => f.name));
    onFiles?.(files);
    if (!onFiles) {
      const urls = await filesToDataUrls(e.target.files);
      onChange(urls);
    }
  }

  return (
    <div className="space-y-1">
      <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white p-3 text-sm transition ${fileError ? "border-red-400 text-red-700 hover:bg-red-50" : "border-slate-300 text-slate-600 hover:border-emerald-400"}`}>
        <Camera className="h-5 w-5 shrink-0 text-emerald-600" />
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple={maxFiles > 1} onChange={(e) => void choose(e)} />
        <span className="min-w-0 truncate">
          {names.length ? `${names.length} photo${names.length > 1 ? "s" : ""} attached` : maxFiles === 1 ? "Upload receipt screenshot" : `Attach up to ${maxFiles} photos`}
        </span>
      </label>
      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or WEBP image up to 5MB</p>
      {fileError && (
        <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{fileError}
        </p>
      )}
    </div>
  );
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 break-words font-semibold leading-5 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600">
        <ClipboardList className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900">No bookings yet</h2>
        <p className="mt-2 max-w-xs text-sm text-slate-500">Start your home service journey by booking a professional service.</p>
      </div>
      <Link href="/services" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
        Explore Services <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Empty() {
  return <EmptyState />;
}

function SignIn({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600">
          <UserRound className="h-10 w-10" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Sign in to view your bookings</h1>
        <p className="mt-3 text-sm text-slate-500">Your order details and support conversations are private.</p>
        <Button className="mt-6" onClick={onLogin}>Login to continue</Button>
      </div>
    </div>
  );
}
