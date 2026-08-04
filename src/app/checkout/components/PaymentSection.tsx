"use client";

import { Wallet, CreditCard, ShieldCheck } from "lucide-react";
import type { PaymentMethod } from "../types";

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  isShop: boolean;
  onPaymentChange: (method: PaymentMethod) => void;
}

export function PaymentSection({
  paymentMethod,
  isShop,
  onPaymentChange,
}: PaymentSectionProps) {
  const options = isShop
    ? [{ value: "cod" as PaymentMethod, label: "Cash on delivery", sublabel: "Pay when your order arrives", icon: Wallet }]
    : [
        { value: "Rs 200 Advance" as PaymentMethod, label: "Rs 200 Advance", sublabel: "Pay Rs 200 to confirm", icon: Wallet },
        { value: "Full Payment in Advance" as PaymentMethod, label: "Full payment", sublabel: "Pay the complete order total", icon: CreditCard },
      ];

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold text-slate-800">Payment method</legend>

      {/* Method cards */}
      <div className={`grid gap-2.5 ${options.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {options.map(({ value, label, sublabel, icon: Icon }) => {
          const selected = paymentMethod === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onPaymentChange(value)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition-all duration-150 ${selected
                  ? "border-emerald-400 bg-emerald-50 shadow-sm ring-1 ring-emerald-400/50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-emerald-100" : "bg-slate-100"
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
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">{isShop ? "Cash on delivery" : paymentMethod}</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {isShop ? "Pay when your product order arrives." : paymentMethod === "Rs 200 Advance" ? "After booking, upload a Rs 200 receipt from Track Booking. The remaining balance can be uploaded after the service is completed." : "After booking, upload one receipt for the complete order total from Track Booking."}
            </p>
          </div>
      </div>
    </fieldset>
  );
}
