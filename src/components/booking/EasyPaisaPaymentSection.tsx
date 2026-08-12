"use client";

import React from "react";
import { CreditCard, ShieldCheck, Info, Upload, WalletCards, Gift } from "lucide-react";

interface EasyPaisaPaymentSectionProps {
  paymentMethod: "Rs 200 Advance" | "Full Payment in Advance";
  onPaymentMethodChange: (method: "Rs 200 Advance" | "Full Payment in Advance") => void;
  total: number;
  receiptFileName: string;
  onReceiptSelect: (file: File | null) => void;
  walletBalance: number;
  useWalletBalance: boolean;
  onUseWalletBalanceChange: (value: boolean) => void;
  rewardEligible: boolean;
  useRewardPoints: boolean;
  onUseRewardPointsChange: (value: boolean) => void;
}

export default function EasyPaisaPaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  total,
  receiptFileName,
  onReceiptSelect,
  walletBalance,
  useWalletBalance,
  onUseWalletBalanceChange,
  rewardEligible,
  useRewardPoints,
  onUseRewardPointsChange,
}: EasyPaisaPaymentSectionProps) {
  const walletApplied = useWalletBalance ? Math.min(walletBalance, total) : 0;
  const afterWalletTotal = Math.max(0, total - walletApplied);
  const cashDue = paymentMethod === "Rs 200 Advance"
    ? afterWalletTotal <= 250 ? afterWalletTotal : Math.max(0, 200 - walletApplied)
    : afterWalletTotal;
  const remaining = paymentMethod === "Rs 200 Advance" ? Math.max(0, afterWalletTotal - cashDue) : 0;
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          Booking confirmation payment
        </label>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          100% Safe & Secure
        </span>
      </div>

      {rewardEligible && <button type="button" onClick={() => onUseRewardPointsChange(!useRewardPoints)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${useRewardPoints ? "border-violet-500 bg-violet-50 ring-1 ring-violet-300" : "border-violet-200 bg-white hover:bg-violet-50"}`}><Gift className="h-5 w-5 text-violet-700" /><span className="flex-1"><strong className="block text-sm">Redeem 12 reward points</strong><span className="text-[11px] text-slate-500">Apply PKR 300 before tax</span></span></button>}

      {walletBalance > 0 && (
        <button type="button" onClick={() => onUseWalletBalanceChange(!useWalletBalance)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${useWalletBalance ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><WalletCards className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">Use wallet balance</span><span className="block text-[11px] text-slate-500">Available PKR {walletBalance.toLocaleString("en-PK")} · Apply PKR {Math.min(walletBalance, total).toLocaleString("en-PK")}</span></span>
          <span className={`h-5 w-9 rounded-full p-0.5 transition ${useWalletBalance ? "bg-emerald-600" : "bg-slate-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${useWalletBalance ? "translate-x-4" : ""}`} /></span>
        </button>
      )}

      {walletApplied > 0 && <div className="flex justify-between rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800"><span>Wallet adjustment</span><span>− Rs {walletApplied.toLocaleString("en-PK")}</span></div>}
      {paymentMethod === "Rs 200 Advance" && afterWalletTotal > 0 && afterWalletTotal <= 250 && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">The remaining PKR {afterWalletTotal.toLocaleString("en-PK")} must be paid in full to place this order.</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onPaymentMethodChange("Rs 200 Advance")} className={`rounded-2xl border p-3 text-center transition ${paymentMethod === "Rs 200 Advance" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400" : "border-slate-200 bg-white"}`}>
          <span className="text-lg font-black text-emerald-600">Rs 200</span>
          <p className="text-xs font-bold text-slate-800">Booking advance</p>
          <p className="text-[10px] text-slate-500">Adjusted in your final service bill</p>
        </button>
        <button type="button" onClick={() => onPaymentMethodChange("Full Payment in Advance")} className={`rounded-2xl border p-3 text-center transition ${paymentMethod === "Full Payment in Advance" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400" : "border-slate-200 bg-white"}`}>
          <span className="text-lg font-black text-emerald-600">Rs {total.toLocaleString("en-PK")}</span>
          <p className="text-xs font-bold text-slate-800">Pay in full</p>
          <p className="text-[10px] font-bold text-emerald-700">Extra 5% discount before tax</p>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-3 text-center text-white sm:gap-2">
        <div><p className="text-[9px] uppercase text-slate-400">Service total</p><p className="text-xs font-bold">Rs {total.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Pay now</p><p className="text-xs font-bold text-lime-300">Rs {cashDue.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Remaining</p><p className="text-xs font-bold">Rs {remaining.toLocaleString("en-PK")}</p></div>
      </div>

      {/* Notice when EasyPaisa selected */}
      {cashDue > 0 && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 animate-in fade-in duration-200">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">
              Send Rs {cashDue.toLocaleString("en-PK")} to EasyPaisa 03485838593
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Upload the screenshot below. Admin will verify it and process your booking. You will be notified shortly.
            </p>
          </div>
        </div>}

      {cashDue > 0 ? <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-white px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
        <Upload className="h-4 w-4" />
        {receiptFileName || "Upload booking payment receipt *"}
        <input type="file" accept="image/*" required={!receiptFileName} className="sr-only" onChange={(event) => onReceiptSelect(event.target.files?.[0] ?? null)} />
      </label> : null}
    </div>
  );
}
