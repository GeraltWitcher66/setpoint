import type { Booking, Court, ISODate } from "@/lib/types";
import { addDays, timeToMinutes, todayISO, weekdayOf } from "@/lib/mock/date-utils";

export const ACTIVE_STATUSES = ["confirmed", "completed"] as const;

export function isRevenueBooking(booking: Booking): boolean {
  return booking.status === "confirmed" || booking.status === "completed";
}

export function sumRevenue(bookings: Booking[]): number {
  return bookings
    .filter(isRevenueBooking)
    .reduce((sum, booking) => sum + booking.total, 0);
}

export function getTodayRevenue(bookings: Booking[], today = todayISO()): number {
  return sumRevenue(bookings.filter((booking) => booking.date === today));
}

export function getWeekRevenue(bookings: Booking[], today = todayISO()): number {
  const from = addDays(today, -6);
  return sumRevenue(
    bookings.filter((booking) => booking.date >= from && booking.date <= today),
  );
}

export function getMonthRevenue(bookings: Booking[], today = todayISO()): number {
  const from = addDays(today, -29);
  return sumRevenue(
    bookings.filter((booking) => booking.date >= from && booking.date <= today),
  );
}

export function getTodayBookings(bookings: Booking[], today = todayISO()): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.date === today && booking.status !== "blocked",
  );
}

export function getOccupancyRate(
  courts: Court[],
  bookings: Booking[],
  date = todayISO(),
  slotsPerDay = 16,
): number {
  const activeCourts = courts.filter((court) => court.status === "active");
  if (activeCourts.length === 0) return 0;

  const totalSlots = activeCourts.length * slotsPerDay;
  const usedSlots = bookings.filter(
    (booking) =>
      booking.date === date &&
      (booking.status === "confirmed" ||
        booking.status === "completed" ||
        booking.status === "blocked") &&
      activeCourts.some((court) => court.id === booking.courtId),
  ).length;

  return Math.min(100, Math.round((usedSlots / totalSlots) * 100));
}

export interface DailyRevenue {
  date: ISODate;
  label: string;
  revenue: number;
  bookings: number;
}

export function getDailyRevenue(
  bookings: Booking[],
  days = 14,
  today = todayISO(),
): DailyRevenue[] {
  const result: DailyRevenue[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const dayBookings = bookings.filter(
      (booking) => booking.date === date && isRevenueBooking(booking),
    );
    result.push({
      date,
      label: new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "short",
      }).format(new Date(`${date}T00:00:00`)),
      revenue: dayBookings.reduce((sum, booking) => sum + booking.total, 0),
      bookings: dayBookings.length,
    });
  }

  return result;
}

export interface HeatmapCell {
  weekday: number;
  hour: number;
  count: number;
}

export const heatmapHours = Array.from({ length: 16 }, (_, index) => index + 7);

export function getDemandHeatmap(bookings: Booking[]): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (const hour of heatmapHours) {
      const count = bookings.filter(
        (booking) =>
          (booking.status === "confirmed" ||
            booking.status === "completed") &&
          weekdayOf(booking.date) === weekday &&
          timeToMinutes(booking.startTime) === hour * 60,
      ).length;
      cells.push({ weekday, hour, count });
    }
  }

  return cells;
}

export function getRevenueBreakdown(bookings: Booking[]) {
  const paid = bookings.filter(isRevenueBooking);
  const equipment = paid.reduce((sum, booking) => sum + booking.equipmentTotal, 0);
  const coaching = paid.reduce((sum, booking) => sum + booking.coachTotal, 0);
  const courts = paid.reduce((sum, booking) => sum + booking.subtotal - booking.coachTotal - booking.equipmentTotal, 0);
  const discounts = paid.reduce((sum, booking) => sum + booking.discount, 0);

  return { equipment, coaching, courts, discounts, total: courts + coaching + equipment - discounts };
}

export function getWeekDays(startDate: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}
