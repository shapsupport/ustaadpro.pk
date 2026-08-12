"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Coins, CreditCard, Gift, History, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, type AuthUser } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { LoyaltyProgressTracker } from "@/components/shared/LoyaltyProgressTracker";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";
const VALUE_PER_ORDER = 25;
const POINTS_PER_REWARD = 12;
const REWARD_VALUE = 300;

type PaymentActivity = {
  id: string;
  title: string;
  kind: "service" | "shop";
  status: string;
  date: string;
  total: number;
  paid: number;
  payable: number;
  paymentMethod: string;
  receiptStatus?: string;
};

function getToken() {
  try { return localStorage.getItem("ustaadpro_token") || ""; } catch { return ""; }
}

function rows(payload: unknown) {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  const object = payload as { orders?: Record<string, unknown>[]; data?: Record<string, unknown>[] };
  return object?.orders || object?.data || [];
}

function paymentActivities(payload: unknown, kind: "service" | "shop"): PaymentActivity[] {
  return rows(payload).map((row) => {
    const singleReceipt = (row.paymentReceipt || row.payment_receipt || {}) as Record<string, unknown>;
    const receipts = Array.isArray(row.paymentReceipts) ? row.paymentReceipts as Record<string, unknown>[] : Array.isArray(row.payment_receipts) ? row.payment_receipts as Record<string, unknown>[] : Object.keys(singleReceipt).length ? [singleReceipt] : [];
    const receipt = receipts[receipts.length - 1] || singleReceipt;
    const items = Array.isArray(row.items) ? row.items as Record<string, unknown>[] : Array.isArray(row.cart) ? row.cart as Record<string, unknown>[] : [];
    const firstProduct = (items[0]?.product || {}) as Record<string, unknown>;
    const listedItemsTotal = items.reduce((sum, item) => {
      const product = (item.product || {}) as Record<string, unknown>;
      const service = (item.service || {}) as Record<string, unknown>;
      const price = Number(item.unitPrice || item.unit_price || item.price || product.price || service.price || 0);
      return sum + price * Number(item.quantity || 1);
    }, 0);
    const total = Number(kind === "service" && listedItemsTotal > 0 ? listedItemsTotal : row.total || row.totalAmount || row.grandTotal || listedItemsTotal || 0);
    const paymentMethod = String(row.paymentMethod || row.payment_method || (kind === "shop" ? "Cash on delivery" : "Not specified"));
    const receiptsPaid = receipts.filter((item) => item.status !== "rejected").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const status = String(row.status || "pending");
    const paid = kind === "service"
      ? Number(row.paidAmount || row.paid_amount || row.amountPaid || row.amount_paid || receiptsPaid)
      : (/cash|cod/i.test(paymentMethod) ? (/delivered|completed/i.test(status) ? total : 0) : total);
    const serverPending = Number(row.pendingPayment || row.pending_payment || row.remainingAmount || row.remaining_amount || row.amountPayable || row.amount_payable || 0);
    return {
      id: String(row.id || row.orderId || ""),
      title: String(row.workTitle || row.serviceTitle || ((row.service || {}) as Record<string, unknown>).title || firstProduct.title || (kind === "shop" ? "Shop order" : "Home service")),
      kind,
      status,
      date: String(row.createdAt || row.created_at || new Date().toISOString()),
      total,
      paid,
      payable: serverPending > 0 ? serverPending : Math.max(0, total - paid),
      paymentMethod,
      receiptStatus: receipt.status ? String(receipt.status) : undefined,
    };
  }).filter((item) => item.id);
}

export default function WalletPage() {
  const { user, setAuthModalMode } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [activity, setActivity] = useState<PaymentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadInFlight = useRef(false);

  async function loadWallet() {
    if (!user) return;
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true); setError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Please sign in again to refresh your wallet.");
      const headers = { Authorization: `Bearer ${token}` };
      const [freshProfile, serviceResponse, shopResponse] = await Promise.all([
        getProfile(),
        fetch(`${API_BASE}/api/orders?limit=50&offset=0`, { headers, cache: "no-store" }),
        fetch(`${API_BASE}/api/shop/orders`, { headers, cache: "no-store" }),
      ]);
      setProfile(freshProfile);
      const services = serviceResponse.ok ? paymentActivities(await serviceResponse.json(), "service") : [];
      const shop = shopResponse.ok ? paymentActivities(await shopResponse.json(), "shop") : [];
      setActivity([...services, ...shop].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
      if (!serviceResponse.ok || !shopResponse.ok) setError("Some payment activity could not be loaded.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Wallet details could not be loaded.");
    } finally { setLoading(false); loadInFlight.current = false; }
  }

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => { void loadWallet(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const rewardPoints = Number(profile?.rewardPoints || 0);
  const loyaltyCycleProgress = Math.min(POINTS_PER_REWARD, rewardPoints);
  const rewardReady = rewardPoints >= POINTS_PER_REWARD;
  const loyaltyEarned = rewardPoints * VALUE_PER_ORDER;
  const paidTotal = activity.reduce((sum, item) => sum + item.paid, 0);
  const payableTotal = activity.reduce((sum, item) => sum + item.payable, 0);

  return <div className="min-h-screen bg-slate-50">
    <section className="border-b border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex max-w-3xl items-center gap-3"><div className="rounded-2xl bg-lime-300/10 p-3 ring-1 ring-lime-300/20"><WalletCards className="h-7 w-7 text-lime-300" /></div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-lime-300">UstaadPro Wallet</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Payments and rewards, made simple</h1></div></div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-100 sm:text-base">See wallet refunds, booking payments, outstanding listed charges, and your progress toward the twelve-point loyalty reward.</p>
      </div>
    </section>

    {!user ? <GuestWallet onLogin={() => setAuthModalMode("login")} /> : <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<WalletCards />} label="Wallet balance" value={`PKR ${Number(profile?.walletBalance || 0).toLocaleString("en-PK")}`} help="Verified eligible cancellation refunds" color="emerald" />
        <MetricCard icon={<CreditCard />} label="Payments submitted" value={`PKR ${paidTotal.toLocaleString("en-PK")}`} help="Across your loaded orders" color="blue" />
        <MetricCard icon={<History />} label="Listed amount payable" value={`PKR ${payableTotal.toLocaleString("en-PK")}`} help="Excludes later on-site quotes" color="amber" />
        <MetricCard icon={<Coins />} label="Available reward value" value={`PKR ${loyaltyEarned.toLocaleString("en-PK")}`} help={`${rewardPoints} point${rewardPoints === 1 ? "" : "s"} × PKR 25`} color="violet" />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <LoyaltyProgressTracker
            rewardPoints={rewardPoints}
            showSummaryCard={false}
          />
          <div className={`rounded-2xl p-5 text-center ${rewardReady ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-700"}`}>
            {rewardReady ? (
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
            ) : (
              <Gift className="mx-auto h-9 w-9 text-slate-300" />
            )}
            <p className="mt-3 text-sm font-bold">
              {rewardReady
                ? "PKR 300 OFF Ready!"
                : `${POINTS_PER_REWARD - loyaltyCycleProgress} more point${POINTS_PER_REWARD - loyaltyCycleProgress === 1 ? "" : "s"} to unlock`}
            </p>
            <p className="mt-1 text-2xl font-black">
              PKR {Math.min(REWARD_VALUE, loyaltyEarned).toLocaleString("en-PK")}
            </p>
            <p className="mt-1 text-xs opacity-70">Available reward value</p>
            {rewardReady && (
              <p className="mt-3 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800">
                Your next booking gets <strong>PKR 300 OFF</strong> automatically!
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-xl font-black text-slate-900">Payment activity</h2><p className="mt-1 text-sm text-slate-500">Paid, payable, method, and verification status</p></div><Button variant="outline" size="sm" onClick={() => void loadWallet()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>
        {activity.length ? <div className="divide-y divide-slate-100">{activity.map((item) => <PaymentRow key={`${item.kind}-${item.id}`} item={item} />)}</div> : <div className="p-10 text-center"><History className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No payment activity yet</p><Link href="/services" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">Book your first service <ArrowRight className="h-4 w-4" /></Link></div>}
      </section>
    </main>}
  </div>;
}

function GuestWallet({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Sparkles className="h-9 w-9 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-black text-slate-900">Earn PKR 300 after 12 completed orders</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Every completed service order earns 1 point worth PKR 25. Twelve points
            unlock a <strong>PKR 300 automatic discount</strong> on your next booking.
          </p>
          <div className="mt-6 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="grid h-10 place-items-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">
                {index + 1}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs font-bold text-slate-500">
            <span>Complete 12 orders</span>
            <span>12 points = PKR 300 OFF</span>
          </div>
          <Button className="mt-7 w-full sm:w-auto" onClick={onLogin}>Sign in to see my wallet</Button>
        </section>
        <section className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-black">What signed-in users can see</h2>
          <ul className="mt-5 space-y-4">
            {[
              "Live wallet refund balance",
              "Payments submitted for bookings",
              "Remaining listed amounts payable",
              "Receipt verification status",
              "Eight-order loyalty progress tracker",
              "A simple payment history for every order",
            ].map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm text-slate-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-lime-300" />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-300">
            <ShieldCheck className="mb-2 h-5 w-5 text-lime-300" />
            Wallet refunds are credited only after eligible cancellation and admin
            verification. Customers cannot manually credit a wallet.
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value, help, color }: { icon: React.ReactNode; label: string; value: string; help: string; color: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-xl ${colors[color]}`}>{icon}</div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{help}</p></div>;
}

function PaymentRow({ item }: { item: PaymentActivity }) {
  return <div className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.kind === "shop" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>{item.kind === "shop" ? <CreditCard className="h-5 w-5" /> : <WalletCards className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-slate-900">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">{item.status.replaceAll("_", " ")}</span>{item.receiptStatus && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold capitalize text-amber-700">Receipt {item.receiptStatus}</span>}</div><p className="mt-1 text-xs text-slate-500">#{item.id} · {new Date(item.date).toLocaleDateString("en-PK", { dateStyle: "medium" })} · {item.paymentMethod}</p></div><div className="grid grid-cols-3 gap-4 text-right text-xs sm:min-w-[310px]"><div><p className="text-slate-400">Total</p><p className="font-black text-slate-800">PKR {item.total.toLocaleString("en-PK")}</p></div><div><p className="text-slate-400">Paid</p><p className="font-black text-emerald-700">PKR {item.paid.toLocaleString("en-PK")}</p></div><div><p className="text-slate-400">Payable</p><p className="font-black text-slate-800">PKR {item.payable.toLocaleString("en-PK")}</p></div></div></div></div>;
}
