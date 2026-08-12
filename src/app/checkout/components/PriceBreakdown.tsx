"use client";

import { useMemo, type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import type { AdminSettings, PaymentMethod } from "../types";

interface PriceBreakdownProps {
  serviceTitle: string;
  workTitle: string;
  servicePrice: number;
  settings: AdminSettings;
  paymentMethod: PaymentMethod;
  selectedAddress: string;
  isShop?: boolean;
  loyaltyDiscount?: number;
  walletBalance?: number;
  useWalletBalance?: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  "Rs 200 Advance": "Rs 200 Advance",
  "Full Payment in Advance": "Full Payment in Advance",
};

export function PriceBreakdown({
  serviceTitle,
  workTitle,
  servicePrice,
  settings,
  paymentMethod,
  selectedAddress,
  isShop = false,
  loyaltyDiscount = 0,
  walletBalance = 0,
  useWalletBalance = false,
}: PriceBreakdownProps) {
  const subtotal = servicePrice;
  const discountedSubtotal = Math.max(0, subtotal - loyaltyDiscount);
  const discountedTax = isShop ? 0 : discountedSubtotal * (settings.serviceTaxPercent / 100);
  const total = useMemo(
    () => discountedSubtotal + discountedTax + (isShop ? 0 : settings.inspectionFee) + (isShop ? settings.shippingCost : 0),
    [discountedSubtotal, discountedTax, settings.inspectionFee, settings.shippingCost, isShop]
  );
  const walletApplied = !isShop && useWalletBalance ? Math.min(walletBalance, total) : 0;
  const amountPayable = Math.max(0, total - walletApplied);
  const rewardPoints = useMemo(
    () => Math.floor(subtotal / settings.rewardPointValue),
    [subtotal, settings.rewardPointValue]
  );

  const fmt = (n: number) => `${settings.currency} ${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      {/* Service info */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isShop ? "Product" : "Service"}
        </p>
        <p className="mt-1 font-bold text-slate-900">{serviceTitle}</p>
        {workTitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{workTitle}</p>
        ) : null}
        <p className="mt-3 text-3xl font-black text-slate-900">{fmt(servicePrice)}</p>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm">
        <p className="font-semibold text-slate-900">Charges breakdown</p>
        <div className="mt-3 space-y-2 text-slate-600">
          <Row label={isShop ? "Product subtotal" : "Service subtotal"} value={fmt(subtotal)} />
          {!isShop && <Row label="Inspection fee" value={fmt(settings.inspectionFee)} />}
          {!isShop && loyaltyDiscount > 0 && <Row label="12-point reward" value={`- ${fmt(loyaltyDiscount)}`} />}
          {walletApplied > 0 && <Row label="Wallet adjustment" value={`- ${fmt(walletApplied)}`} />}
          {!isShop && (
            <Row
              label={`Tax (${settings.serviceTaxPercent}%)`}
              value={fmt(discountedTax)}
            />
          )}
          {isShop && <Row label="Shipping" value={fmt(settings.shippingCost)} />}
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between font-bold text-slate-900">
          <span>Total payable</span>
          <span className="text-lg">{fmt(amountPayable)}</span>
        </div>
      </div>

      {!isShop && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800 flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <p className="leading-normal">
            <strong>Note:</strong> If the work is confirmed, the inspection fee will be adjusted in the service provided. If the work is not closed, {fmt(settings.inspectionFee)} service charges are to be paid.
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 space-y-2.5">
        <MetaRow
          label="Payment method"
          value={
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {PAYMENT_LABELS[paymentMethod]}
            </span>
          }
        />
        {selectedAddress && selectedAddress !== "No location selected yet" ? (
          <MetaRow label="Delivery address" value={selectedAddress} />
        ) : null}
        {settings.rewardEnabled && rewardPoints > 0 ? (
          <MetaRow
            label="Reward points earned"
            value={
              <span className="font-semibold text-emerald-600">+{rewardPoints} pts</span>
            }
          />
        ) : null}
      </div>

      {/* Support */}
      <p className="text-center text-xs text-slate-400">
        Questions?{" "}
        <a
          href={`tel:${settings.supportPhone}`}
          className="font-semibold text-emerald-600 hover:underline"
        >
          {settings.supportPhone}
        </a>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{value}</span>
    </div>
  );
}
