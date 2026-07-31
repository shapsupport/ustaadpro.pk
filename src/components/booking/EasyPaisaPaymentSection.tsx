"use client";

import React from "react";
import { CreditCard, Gift, ShieldCheck, Info, Upload } from "lucide-react";

interface EasyPaisaPaymentSectionProps {
  paymentMethod: "Rs 200 Advance" | "Full Payment in Advance";
  onPaymentMethodChange: (method: "Rs 200 Advance" | "Full Payment in Advance") => void;
  total: number;
  receiptFileName: string;
  onReceiptSelect: (file: File | null) => void;
  rewardEligible?: boolean;
  rewardLoading?: boolean;
  useRewardPoints?: boolean;
  onUseRewardPointsChange?: (value: boolean) => void;
}

export default function EasyPaisaPaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  total,
  receiptFileName,
  onReceiptSelect,
  rewardEligible = false,
  rewardLoading = false,
  useRewardPoints = false,
  onUseRewardPointsChange,
}: EasyPaisaPaymentSectionProps) {
  const rewardDiscount = useRewardPoints ? Math.min(200, total) : 0;
  const cashDue = paymentMethod === "Rs 200 Advance"
    ? Math.max(0, Math.min(200, total) - rewardDiscount)
    : Math.max(0, total - rewardDiscount);
  const remaining = paymentMethod === "Rs 200 Advance" ? Math.max(0, total - 200) : 0;
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onPaymentMethodChange("Rs 200 Advance")} className={`rounded-2xl border p-3 text-center transition ${paymentMethod === "Rs 200 Advance" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400" : "border-slate-200 bg-white"}`}>
          <span className="text-lg font-black text-emerald-600">Rs 200</span>
          <p className="text-xs font-bold text-slate-800">Booking advance</p>
          <p className="text-[10px] text-slate-500">Adjusted in your final service bill</p>
        </button>
        <button type="button" onClick={() => onPaymentMethodChange("Full Payment in Advance")} className={`rounded-2xl border p-3 text-center transition ${paymentMethod === "Full Payment in Advance" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400" : "border-slate-200 bg-white"}`}>
          <span className="text-lg font-black text-emerald-600">Rs {total.toLocaleString("en-PK")}</span>
          <p className="text-xs font-bold text-slate-800">Pay in full</p>
          <p className="text-[10px] text-slate-500">No balance on the listed charge</p>
        </button>
      </div>

      {(rewardEligible || rewardLoading) && (
        <button
          type="button"
          disabled={rewardLoading}
          onClick={() => onUseRewardPointsChange?.(!useRewardPoints)}
          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${useRewardPoints ? "border-violet-500 bg-violet-50 ring-1 ring-violet-300" : "border-violet-200 bg-white hover:bg-violet-50"}`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><Gift className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">Redeem PKR 200 loyalty reward</span><span className="block text-[11px] text-slate-500">Use it for the booking advance or deduct it from full payment.</span></span>
          <span className={`h-5 w-9 rounded-full p-0.5 transition ${useRewardPoints ? "bg-violet-600" : "bg-slate-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${useRewardPoints ? "translate-x-4" : ""}`} /></span>
        </button>
      )}

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-3 text-center text-white sm:gap-2">
        <div><p className="text-[9px] uppercase text-slate-400">Service total</p><p className="text-xs font-bold">Rs {total.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Pay now</p><p className="text-xs font-bold text-lime-300">Rs {cashDue.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Remaining</p><p className="text-xs font-bold">Rs {remaining.toLocaleString("en-PK")}</p></div>
      </div>

      {useRewardPoints && <p className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">PKR {rewardDiscount.toLocaleString("en-PK")} loyalty reward applied to this booking.</p>}

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
      </label> : <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">Your PKR 200 reward covers the booking confirmation. No receipt is required.</div>}
    </div>
  );
}
