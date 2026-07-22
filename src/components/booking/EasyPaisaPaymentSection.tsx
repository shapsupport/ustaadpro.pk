"use client";

import React from "react";
import { Banknote, CreditCard, ShieldCheck, Info } from "lucide-react";

interface EasyPaisaPaymentSectionProps {
  paymentMethod: string;
  onSelectPaymentMethod: (method: string) => void;
}

export default function EasyPaisaPaymentSection({
  paymentMethod,
  onSelectPaymentMethod,
}: EasyPaisaPaymentSectionProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          Select Payment Option *
        </label>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          100% Safe & Secure
        </span>
      </div>

      {/* Payment Option Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectPaymentMethod("Cash After Work Done")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all border ${paymentMethod === "Cash After Work Done"
              ? "bg-white border-emerald-600 text-emerald-800 shadow-md shadow-emerald-600/15"
              : "bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
        >
          <Banknote className="h-6 w-6 text-emerald-600" />
          <span className="text-xs font-bold">Cash After Work</span>
          <span className="text-[10px] text-slate-400">Pay cash upon completion</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPaymentMethod("Easypaisa")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all border ${paymentMethod === "Easypaisa" || paymentMethod === "Easypaisa After Work Done"
              ? "bg-white border-emerald-600 text-emerald-800 shadow-md shadow-emerald-600/15"
              : "bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px]">
            EP
          </div>
          <span className="text-xs font-bold">EasyPaisa Payment</span>
          <span className="text-[10px] text-slate-400">Pay via EasyPaisa</span>
        </button>
      </div>

      {/* Notice when EasyPaisa selected */}
      {(paymentMethod === "Easypaisa" || paymentMethod === "Easypaisa After Work Done") && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 animate-in fade-in duration-200">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">
              EasyPaisa payment details will be shared after service completion
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              You can upload your payment receipt from the Track Booking page once the job is done.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}