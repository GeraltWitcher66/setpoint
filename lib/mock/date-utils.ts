import type { ISODate, Weekday } from "@/lib/types";

/** YYYY-MM-DD based on local time, matching the club timezone. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fromISODate(iso: ISODate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: ISODate, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekdayOf(iso: ISODate): Weekday {
  return fromISODate(iso).getDay() as Weekday;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mins = String(normalized % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

export function isTimeWithin(
  time: string,
  start: string,
  end: string,
  includeEnd = false,
): boolean {
  const value = timeToMinutes(time);
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  return includeEnd ? value >= from && value <= to : value >= from && value < to;
}

/** «۲۴ آبان» — Persian calendar, useful for compact labels. */
export function formatShortDate(iso: ISODate): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
  }).format(fromISODate(iso));
}

/** «۲۴ آبان ۱۴۰۵» */
export function formatFullDate(iso: ISODate): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fromISODate(iso));
}

export const weekdayLabels: Record<Weekday, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
};
