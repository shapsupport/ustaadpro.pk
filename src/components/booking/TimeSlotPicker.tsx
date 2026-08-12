"use client";

import React, { useMemo } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { bookingTimestamp, clampBookingLeadHours, earliestBookingTimestamp } from "@/lib/booking-time";

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  minimumBookingLeadHours?: number;
  error?: string;
}

/** Generate 30-min time slots from 7:00 AM to 11:00 PM. */
function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 23 && minute > 0) break;

      const hStr = hour.toString().padStart(2, "0");
      const mStr = minute.toString().padStart(2, "0");
      const value = `${hStr}:${mStr}`;

      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const label = `${displayHour}:${mStr} ${period}`;

      slots.push({ value, label });
    }
  }
  return slots;
}

/** Check if slot is in the past for today's date in Pakistan Time */
function isSlotUnavailable(slotValue: string, selectedDate: string, leadHours: number): boolean {
  if (!selectedDate) return true;
  const slot = bookingTimestamp(selectedDate, slotValue);
  return !Number.isFinite(slot) || slot < earliestBookingTimestamp(clampBookingLeadHours(leadHours));
}

export default function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelectTime,
  minimumBookingLeadHours = 0,
  error = "",
}: TimeSlotPickerProps) {
  const slots = useMemo(() => generateTimeSlots(), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Clock className="h-4 w-4 text-emerald-600" />
          Select Preferred Time Slot <span className="text-red-500">*</span>
        </label>
        {selectedTime && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Selected: {slots.find((s) => s.value === selectedTime)?.label || selectedTime}
          </span>
        )}
      </div>

      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {slots.map((slot) => {
          const disabled = isSlotUnavailable(slot.value, selectedDate, minimumBookingLeadHours);
          const isSelected = selectedTime === slot.value;

          return (
            <button
              key={slot.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTime(slot.value)}
              className={`rounded-xl px-2 py-2 text-xs font-bold transition-all text-center ${
                disabled
                  ? "opacity-35 cursor-not-allowed bg-slate-100 text-slate-400 border border-transparent"
                  : isSelected
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border border-emerald-600 scale-[1.02]"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30"
              }`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="flex items-center gap-1 text-sm font-semibold text-red-700" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p> : !selectedTime && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Please select a 30-minute arrival slot between 7:00 AM and 11:00 PM.
        </p>
      )}
    </div>
  );
}
