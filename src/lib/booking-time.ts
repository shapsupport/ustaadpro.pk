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
