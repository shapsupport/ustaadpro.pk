"use client";

import React, { useState, type RefObject } from "react";
import { AlertCircle, Check, Copy, CreditCard, Gift, ShieldCheck, Upload, WalletCards } from "lucide-react";

const EASYPAISA_NUMBER = "03485838593";

interface EasyPaisaPaymentSectionProps {
  paymentMethod: "Rs 200 Advance" | "Full Payment in Advance";
  onPaymentMethodChange: (method: any) => void;
  total: number;
  receiptFileName: string;
  onReceiptSelect: (file: File | null) => void;
  receiptError?: boolean;
  fileError?: string;
  receiptAreaRef?: RefObject<HTMLDivElement | null>;
  rewardEligible?: boolean;
  rewardLoading?: boolean;
  useRewardPoints?: boolean;
  onUseRewardPointsChange?: (value: boolean) => void;
  rewardPoints?: number;
  rewardBalanceValue?: number;
  rewardDiscount?: number;
  rewardRedeemablePoints?: number;
  rewardHint?: string;
  walletBalance?: number;
  walletAdjustment?: number;
  useWalletBalance?: boolean;
  onUseWalletBalanceChange?: (value: boolean) => void;
}

export default function EasyPaisaPaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  total,
  receiptFileName,
  onReceiptSelect,
  receiptError = false,
  fileError = "",
  receiptAreaRef,
  rewardEligible = false,
  rewardLoading = false,
  useRewardPoints = false,
  onUseRewardPointsChange,
  rewardPoints = 0,
  rewardBalanceValue = 0,
  rewardDiscount = 0,
  rewardRedeemablePoints = 0,
  rewardHint = "",
  walletBalance = 0,
  walletAdjustment = 0,
  useWalletBalance = false,
  onUseWalletBalanceChange,
}: EasyPaisaPaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const cashDue = paymentMethod === "Rs 200 Advance"
    ? Math.max(0, Math.min(200, total))
    : Math.max(0, total);
  const remaining = paymentMethod === "Rs 200 Advance" ? Math.max(0, total - 200) : 0;

  const copyEasyPaisaNumber = async () => {
    try {
      await navigator.clipboard.writeText(EASYPAISA_NUMBER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          Booking confirmation payment <span className="text-red-500">*</span>
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

      <button
        type="button"
        disabled={walletBalance <= 0}
        onClick={() => onUseWalletBalanceChange?.(!useWalletBalance)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${useWalletBalance ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300" : "border-emerald-200 bg-white hover:bg-emerald-50"} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><WalletCards className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">Use wallet balance</span><span className="block text-[11px] text-slate-500">Available: Rs {walletBalance.toLocaleString("en-PK")}. {walletBalance > 0 ? `Apply up to Rs ${Math.min(walletBalance, total + walletAdjustment).toLocaleString("en-PK")}.` : "No wallet balance is available."}</span></span>
        <span className={`grid h-6 w-6 place-items-center rounded-lg border ${useWalletBalance ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check className="h-4 w-4" /></span>
      </button>

      <button
        type="button"
        disabled={rewardLoading || !rewardEligible}
        onClick={() => onUseRewardPointsChange?.(!useRewardPoints)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${useRewardPoints ? "border-violet-500 bg-violet-50 ring-1 ring-violet-300" : "border-violet-200 bg-white hover:bg-violet-50"} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><Gift className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{rewardLoading ? "Loading reward points…" : `Reward points: ${rewardPoints} pts`}</span><span className="block text-[11px] text-slate-500">Worth Rs {rewardBalanceValue.toLocaleString("en-PK")}. {rewardHint}</span></span>
        <span className={`grid h-6 w-6 place-items-center rounded-lg border ${useRewardPoints ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check className="h-4 w-4" /></span>
      </button>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-3 text-center text-white sm:gap-2">
        <div><p className="text-[9px] uppercase text-slate-400">Service total</p><p className="text-xs font-bold">Rs {total.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Pay now</p><p className="text-xs font-bold text-lime-300">Rs {cashDue.toLocaleString("en-PK")}</p></div>
        <div><p className="text-[9px] uppercase text-slate-400">Remaining</p><p className="text-xs font-bold">Rs {remaining.toLocaleString("en-PK")}</p></div>
      </div>

      {useRewardPoints && <p className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">{rewardRedeemablePoints} points applied: Rs {rewardDiscount.toLocaleString("en-PK")} off.</p>}
      {useWalletBalance && <p className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800">Rs {walletAdjustment.toLocaleString("en-PK")} wallet balance applied.</p>}

      {/* Notice when EasyPaisa selected */}
      {cashDue > 0 && <div className="overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/15 animate-in fade-in duration-200">
        <div className="px-4 py-4 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Send with EasyPaisa</p>
          <p className="mt-1 text-sm text-emerald-50">Transfer <strong className="text-lg text-white">Rs {cashDue.toLocaleString("en-PK")}</strong> to:</p>
          <div className="mt-3 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <span className="rounded-xl bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.08em] text-emerald-800 shadow-sm sm:text-3xl">{EASYPAISA_NUMBER}</span>
            <button type="button" onClick={() => void copyEasyPaisaNumber()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-lime-200" aria-label="Copy EasyPaisa number">
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Copied" : "Copy number"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-emerald-100">After transferring the amount, upload the payment screenshot below for verification.</p>
        </div>
      </div>}

      <div ref={receiptAreaRef} className="min-w-0 space-y-1">
        {cashDue > 0 && (
          <>
            <label className={`flex min-h-14 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 text-center text-sm font-bold transition-colors sm:px-4 ${receiptError || fileError ? "border-red-400 bg-white text-red-700 hover:bg-red-50" : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"}`}>
              <Upload className="h-5 w-5 shrink-0" />
              <span className="min-w-0 truncate">{receiptFileName || <>Upload booking payment receipt <span className="text-red-500">*</span></>}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onReceiptSelect(event.target.files?.[0] ?? null)} />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or WEBP image up to 5MB</p>
            {fileError && (
              <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fileError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
