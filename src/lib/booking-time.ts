const PAKISTAN_UTC_OFFSET = "+05:00";

export function clampBookingLeadHours(value: unknown): number {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return 0;
  return Math.min(168, Math.max(0, Math.trunc(hours)));
}

export function bookingTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time}:00${PAKISTAN_UTC_OFFSET}`).getTime();
}

export function earliestBookingTimestamp(leadHours: number): number {
  return Date.now() + clampBookingLeadHours(leadHours) * 60 * 60 * 1000;
}

/** Earliest Pakistan calendar date that still has a selectable slot by 11:00 PM. */
export function nextAvailableBookingDate(leadHours: number): string {
  const earliest = earliestBookingTimestamp(leadHours);
  const candidate = pakistanDateAndTime(earliest).date;
  if (bookingTimestamp(candidate, "23:00") >= earliest) return candidate;
  return pakistanDateAndTime(earliest + 24 * 60 * 60 * 1000).date;
}

export function pakistanDateAndTime(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` };
}
