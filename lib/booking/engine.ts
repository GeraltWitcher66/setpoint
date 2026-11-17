import { siteConfig } from "@/config/site";
import type {
  Booking,
  Coach,
  Court,
  CustomerPackage,
  Equipment,
  Holiday,
  ISODate,
  PricingRule,
} from "@/lib/types";
import {
  minutesToTime,
  timeToMinutes,
  toISODate,
  weekdayOf,
} from "@/lib/mock/date-utils";

export type SlotState =
  | "available"
  | "booked"
  | "blocked"
  | "past"
  | "closed"
  | "maintenance";

export interface DaySlot {
  startTime: string;
  endTime: string;
  state: SlotState;
  price: number;
  peak: boolean;
  bookingId: string | null;
}

export interface DaySchedule {
  date: ISODate;
  courtId: string;
  closed: boolean;
  reason: string | null;
  slots: DaySlot[];
}

const SLOT_MINUTES = siteConfig.booking.slotMinutes;
const OPEN_MINUTES = timeToMinutes(siteConfig.booking.openTime);
const CLOSE_MINUTES = timeToMinutes(siteConfig.booking.closeTime);

export function isPeakTime(
  date: ISODate,
  startTime: string,
  rules: PricingRule[],
): boolean {
  const weekday = weekdayOf(date);
  const start = timeToMinutes(startTime);

  return rules.some(
    (rule) =>
      rule.active &&
      rule.days.includes(weekday) &&
      start >= timeToMinutes(rule.startTime) &&
      start < timeToMinutes(rule.endTime),
  );
}

export function slotPrice(court: Court, peak: boolean): number {
  return peak ? court.peakPricePerHour : court.basePricePerHour;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

export function getDaySchedule({
  court,
  date,
  bookings,
  holidays,
  pricingRules,
  now = new Date(),
}: {
  court: Court;
  date: ISODate;
  bookings: Booking[];
  holidays: Holiday[];
  pricingRules: PricingRule[];
  now?: Date;
}): DaySchedule {
  const holiday = holidays.find((item) => item.date === date && item.closed);
  const today = toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lead = siteConfig.booking.minLeadMinutes;

  const slots: DaySlot[] = [];

  for (
    let start = OPEN_MINUTES;
    start + SLOT_MINUTES <= CLOSE_MINUTES;
    start += SLOT_MINUTES
  ) {
    const end = start + SLOT_MINUTES;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);
    const peak = isPeakTime(date, startTime, pricingRules);

    const collision = bookings.find(
      (booking) =>
        booking.courtId === court.id &&
        booking.date === date &&
        (booking.status === "confirmed" ||
          booking.status === "completed" ||
          booking.status === "blocked") &&
        overlaps(
          start,
          end,
          timeToMinutes(booking.startTime),
          timeToMinutes(booking.endTime),
        ),
    );

    let state: SlotState = "available";

    if (holiday) state = "closed";
    else if (court.status === "maintenance") state = "maintenance";
    else if (collision)
      state = collision.status === "blocked" ? "blocked" : "booked";
    else if (date < today || (date === today && start < nowMinutes + lead))
      state = "past";

    slots.push({
      startTime,
      endTime,
      state,
      price: slotPrice(court, peak),
      peak,
      bookingId: collision?.id ?? null,
    });
  }

  return {
    date,
    courtId: court.id,
    closed: Boolean(holiday) || court.status === "maintenance",
    reason: holiday
      ? holiday.name
      : court.status === "maintenance"
        ? "زمین در حال تعمیر است"
        : null,
    slots,
  };
}

export function isSlotFree({
  courtId,
  date,
  startTime,
  bookings,
  ignoreBookingId,
  durationMinutes = SLOT_MINUTES,
}: {
  courtId: string;
  date: ISODate;
  startTime: string;
  bookings: Booking[];
  ignoreBookingId?: string;
  durationMinutes?: number;
}): boolean {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;

  return !bookings.some(
    (booking) =>
      booking.id !== ignoreBookingId &&
      booking.courtId === courtId &&
      booking.date === date &&
      (booking.status === "confirmed" ||
        booking.status === "completed" ||
        booking.status === "blocked") &&
      overlaps(
        start,
        end,
        timeToMinutes(booking.startTime),
        timeToMinutes(booking.endTime),
      ),
  );
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  courtTotal: number;
  coachTotal: number;
  equipmentLines: PriceLine[];
  equipmentTotal: number;
  subtotal: number;
  discount: number;
  total: number;
  peak: boolean;
}

export function calculatePrice({
  court,
  date,
  startTime,
  durationMinutes = SLOT_MINUTES,
  coach,
  equipment = [],
  pricingRules,
  packageDiscountPercent = 0,
}: {
  court: Court;
  date: ISODate;
  startTime: string;
  durationMinutes?: number;
  coach?: Coach | null;
  equipment?: Array<{ equipment: Equipment; quantity: number }>;
  pricingRules: PricingRule[];
  packageDiscountPercent?: number;
}): PriceBreakdown {
  const peak = isPeakTime(date, startTime, pricingRules);
  const hourly = slotPrice(court, peak);
  const courtTotal = Math.round((hourly * durationMinutes) / 60);
  const coachTotal = coach ? coach.pricePerSession : 0;

  const equipmentLines = equipment
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      label: `${line.equipment.name} × ${line.quantity}`,
      amount: line.equipment.pricePerSession * line.quantity,
    }));

  const equipmentTotal = equipmentLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const subtotal = courtTotal + coachTotal + equipmentTotal;
  const discount =
    packageDiscountPercent > 0
      ? Math.round((subtotal * packageDiscountPercent) / 100)
      : 0;

  return {
    courtTotal,
    coachTotal,
    equipmentLines,
    equipmentTotal,
    subtotal,
    discount,
    total: subtotal - discount,
    peak,
  };
}

export interface CancellationResult {
  allowed: boolean;
  policy: "free" | "late" | "none";
  refund: number;
  fee: number;
  packageSessionRefund: boolean;
  message: string;
}

export function getCancellationResult(
  booking: Booking,
  now = new Date(),
): CancellationResult {
  if (booking.status !== "confirmed") {
    return {
      allowed: false,
      policy: "none",
      refund: 0,
      fee: 0,
      packageSessionRefund: false,
      message: "این رزرو قابل لغو نیست.",
    };
  }

  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  const hoursUntil = (start.getTime() - now.getTime()) / (60 * 60 * 1000);
  const freeWindow = siteConfig.booking.cancellation.freeUntilHours;
  const free = hoursUntil >= freeWindow;

  if (booking.packageId) {
    return {
      allowed: true,
      policy: free ? "free" : "late",
      refund: 0,
      fee: 0,
      packageSessionRefund: free,
      message: free
        ? "لغو رایگان است و سانس پکیج برمی‌گردد."
        : "لغو دیرهنگام است و سانس پکیج برنمی‌گردد.",
    };
  }

  if (free) {
    return {
      allowed: true,
      policy: "free",
      refund: booking.total,
      fee: 0,
      packageSessionRefund: false,
      message: "لغو رایگان است و کل مبلغ به اعتبار شما برمی‌گردد.",
    };
  }

  const feePercent = siteConfig.booking.cancellation.lateFeePercent;
  const fee = Math.round((booking.total * feePercent) / 100);

  return {
    allowed: true,
    policy: "late",
    refund: booking.total - fee,
    fee,
    packageSessionRefund: false,
    message: `لغو دیرهنگام است؛ ${feePercent}٪ مبلغ به‌عنوان جریمه کسر می‌شود.`,
  };
}

export function isCoachAvailable(
  coach: Coach,
  date: ISODate,
  startTime: string,
  endTime: string,
): boolean {
  if (!coach.active) return false;

  const timeOff = coach.timeOff.some(
    (range) => date >= range.from && date <= range.to,
  );
  if (timeOff) return false;

  const weekday = weekdayOf(date);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return coach.weeklyHours.some(
    (block) =>
      block.weekday === weekday &&
      start >= timeToMinutes(block.startTime) &&
      end <= timeToMinutes(block.endTime),
  );
}

export function getPackageRemaining(pkg: CustomerPackage): number {
  return Math.max(0, pkg.sessionsTotal - pkg.sessionsUsed);
}

export function getPackageRemainingByCustomer(
  customerId: string,
  packages: CustomerPackage[],
): CustomerPackage[] {
  return packages.filter(
    (item) => item.customerId === customerId && getPackageRemaining(item) > 0,
  );
}
