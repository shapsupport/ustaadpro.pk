"use client";

import React, { useMemo } from "react";
import { Repeat, Calendar, Info } from "lucide-react";

interface RecurringPickerProps {
  isRecurring: boolean;
  onToggleRecurring: (recurring: boolean) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  unitPrice: number;
}

export function calculateDaysCount(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 1;
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 1;
  const diffTime = to.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function RecurringPicker({
  isRecurring,
  onToggleRecurring,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  unitPrice,
}: RecurringPickerProps) {
  const daysCount = useMemo(
    () => (isRecurring ? calculateDaysCount(fromDate, toDate) : 1),
    [isRecurring, fromDate, toDate]
  );

  const totalPrice = unitPrice * daysCount;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      {/* Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Booking Type
          </span>
        </div>

        {/* Toggle Switch */}
        <div className="inline-flex rounded-xl bg-slate-200/80 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => onToggleRecurring(false)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              !isRecurring
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            One Time
          </button>
          <button
            type="button"
            onClick={() => onToggleRecurring(true)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              isRecurring
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Recurring
          </button>
        </div>
      </div>

      {/* Recurring Date Range Fields */}
      {isRecurring && (
        <div className="space-y-3 pt-1 border-t border-slate-200/60 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                From Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  min={getTodayString()}
                  value={fromDate}
                  onChange={(e) => {
                    onFromDateChange(e.target.value);
                    if (e.target.value > toDate) {
                      onToDateChange(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                To Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  min={fromDate || getTodayString()}
                  value={toDate}
                  onChange={(e) => onToDateChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Banner */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Info className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                {daysCount} {daysCount === 1 ? "day" : "days"} × Rs{" "}
                {unitPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-emerald-600 uppercase font-bold">
                Total Price
              </span>
              <span className="text-sm font-black text-emerald-700">
                Rs {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
