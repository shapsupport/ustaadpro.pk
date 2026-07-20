"use client";

import { Wallet, CreditCard, FileImage, ShieldCheck } from "lucide-react";
import type { PaymentMethod } from "../types";

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  screenshotName: string;
  onPaymentChange: (method: PaymentMethod) => void;
  onScreenshotChange: (name: string) => void;
}

const PAYMENT_OPTIONS = [
  { value: "cash" as PaymentMethod, label: "Cash", sublabel: "Pay on delivery", icon: Wallet },
  { value: "easypaisa" as PaymentMethod, label: "EasyPaisa", sublabel: "Mobile wallet", icon: CreditCard },
  { value: "jazzcash" as PaymentMethod, label: "JazzCash", sublabel: "Mobile wallet", icon: CreditCard },
];

const PAYMENT_NUMBERS: Record<string, string> = {
  easypaisa: "0300-1234567",
  jazzcash: "0311-1234567",
};

export function PaymentSection({
  paymentMethod,
  onPaymentChange,
  onScreenshotChange,
}: PaymentSectionProps) {
  const isOnline = paymentMethod === "easypaisa" || paymentMethod === "jazzcash";
  const paymentLabel = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? "";

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold text-slate-800">Payment method</legend>

      {/* Method cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {PAYMENT_OPTIONS.map(({ value, label, sublabel, icon: Icon }) => {
          const selected = paymentMethod === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                onPaymentChange(value);
                if (value !== paymentMethod) onScreenshotChange("");
              }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition-all duration-150 ${
                selected
                  ? "border-emerald-400 bg-emerald-50 shadow-sm ring-1 ring-emerald-400/50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  selected ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${selected ? "text-emerald-700" : "text-slate-500"}`}
                />
              </div>
              <span
                className={`text-xs font-bold ${selected ? "text-emerald-800" : "text-slate-700"}`}
              >
                {label}
              </span>
              <span
                className={`text-[10px] leading-tight ${selected ? "text-emerald-600" : "text-slate-400"}`}
              >
                {sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Online payment details */}
      {isOnline ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <FileImage className="h-4 w-4" />
            Pay after the work is completed
          </div>
          <p className="text-xs leading-5 text-amber-700">
            Do not pay during checkout. After the service is marked completed, send the final amount to{" "}
            <span className="font-semibold">{paymentLabel} — {PAYMENT_NUMBERS[paymentMethod]}</span>{" "}
            and upload the receipt from Track Booking for verification.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">Cash on delivery</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your booking will be confirmed instantly. Pay the technician on arrival.
            </p>
          </div>
        </div>
      )}
    </fieldset>
  );
}
