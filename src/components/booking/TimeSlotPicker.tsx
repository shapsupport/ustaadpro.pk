"use client";

import React, { useMemo } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

/** Generate 30-min time slots from 6:00 AM (06:00) to 10:00 PM (22:00) */
function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 22 && minute > 0) break; // End at 22:00 (10:00 PM)

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
function isSlotInPast(slotValue: string, selectedDate: string): boolean {
  if (!selectedDate) return false;

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (selectedDate !== todayStr) return false;

  const nowPkt = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );
  const [slotHour, slotMin] = slotValue.split(":").map(Number);

  const slotTimeInMin = slotHour * 60 + slotMin;
  const currentTimeInMin = nowPkt.getHours() * 60 + nowPkt.getMinutes();

  return slotTimeInMin <= currentTimeInMin;
}

export default function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  const slots = useMemo(() => generateTimeSlots(), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Clock className="h-4 w-4 text-emerald-600" />
          Select Preferred Time Slot *
        </label>
        {selectedTime && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Selected: {slots.find((s) => s.value === selectedTime)?.label || selectedTime}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 rounded-2xl border border-slate-200 bg-slate-50/50">
        {slots.map((slot) => {
          const disabled = isSlotInPast(slot.value, selectedDate);
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

      {!selectedTime && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Please select a 30-minute arrival slot between 6:00 AM and 10:00 PM.
        </p>
      )}
    </div>
  );
}
