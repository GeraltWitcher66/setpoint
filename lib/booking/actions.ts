import { siteConfig } from "@/config/site";
import { getDatabase, updateDatabase } from "@/lib/mock/db";
import { createConfirmationCode, createId } from "@/lib/id";
import type {
  Booking,
  BookingSource,
  CancellationPolicy,
  Customer,
  CustomerPackage,
  Equipment,
  ISODate,
  Package,
  PaymentMethod,
} from "@/lib/types";
import {
  calculatePrice,
  getCancellationResult,
  getPackageRemaining,
  isSlotFree,
} from "./engine";
import {
  minutesToTime,
  timeToMinutes,
  toISODate,
  todayISO,
} from "@/lib/mock/date-utils";

export interface CreateBookingInput {
  courtId: string;
  date: ISODate;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  coachId?: string | null;
  equipment?: Array<{ equipmentId: string; quantity: number }>;
  packageId?: string | null;
  source?: BookingSource;
  notes?: string;
  paid?: boolean;
  paymentMethod?: PaymentMethod;
}

export type CreateBookingResult =
  | { ok: true; booking: Booking; customer: Customer }
  | { ok: false; error: string };

export function createBooking(input: CreateBookingInput): CreateBookingResult {
  return updateDatabase((db) => {
    const court = db.courts.find((item) => item.id === input.courtId);
    if (!court) return { ok: false, error: "زمین انتخاب‌شده پیدا نشد." } as const;

    const phone = input.customerPhone.replace(/\D/g, "");
    if (phone.length < 10) {
      return { ok: false, error: "شماره موبایل معتبر نیست." } as const;
    }

    let customer = db.customers.find(
      (item) => item.phone.replace(/\D/g, "") === phone,
    );

    if (customer?.blocked) {
      return {
        ok: false,
        error: "حساب شما مسدود است؛ برای پیگیری با پذیرش باشگاه تماس بگیرید.",
      } as const;
    }

    if (
      !isSlotFree({
        courtId: input.courtId,
        date: input.date,
        startTime: input.startTime,
        bookings: db.bookings,
      })
    ) {
      return {
        ok: false,
        error: "این سانس همین حالا رزرو شد؛ لطفاً زمان دیگری انتخاب کنید.",
      } as const;
    }

    if (!customer) {
      customer = {
        id: createId("customer"),
        name: input.customerName.trim() || `مهمان ${phone.slice(-4)}`,
        phone,
        email: input.customerEmail ?? null,
        joinedAt: todayISO(),
        credit: 0,
        notes: "",
        blocked: false,
        blockedReason: null,
      };
      db.customers.push(customer);
    }

    const packageInfo = input.packageId
      ? db.packages.find((pkg) => pkg.id === input.packageId)
      : undefined;

    let customerPackage: CustomerPackage | undefined;
    if (input.packageId) {
      customerPackage = db.customerPackages.find(
        (item) =>
          item.customerId === customer.id &&
          item.packageId === input.packageId &&
          getPackageRemaining(item) > 0,
      );
      if (!customerPackage || !packageInfo) {
        return {
          ok: false,
          error: "اعتبار پکیج کافی نیست.",
        } as const;
      }
    }

    const coach = input.coachId
      ? db.coaches.find((item) => item.id === input.coachId) ?? null
      : null;

    const equipmentLines: Array<{ equipment: Equipment; quantity: number }> = [];
    for (const line of input.equipment ?? []) {
      const item = db.equipment.find((eq) => eq.id === line.equipmentId);
      if (!item || line.quantity <= 0) continue;
      if (line.quantity > item.stock) {
        return {
          ok: false,
          error: `موجودی «${item.name}» کافی نیست.`,
        } as const;
      }
      equipmentLines.push({ equipment: item, quantity: line.quantity });
    }

    const breakdown = calculatePrice({
      court,
      date: input.date,
      startTime: input.startTime,
      coach,
      equipment: equipmentLines,
      pricingRules: db.pricingRules,
      packageDiscountPercent: packageInfo?.discountPercent ?? 0,
    });

    const duration = siteConfig.booking.slotMinutes;
    const start = timeToMinutes(input.startTime);

    const booking: Booking = {
      id: createId("booking"),
      courtId: court.id,
      customerId: customer.id,
      customerName: customer.name,
      date: input.date,
      startTime: input.startTime,
      endTime: minutesToTime(start + duration),
      status: "confirmed",
      source: input.source ?? "online",
      coachId: coach?.id ?? null,
      equipment: equipmentLines.map((line) => ({
        equipmentId: line.equipment.id,
        quantity: line.quantity,
        pickedUp: false,
        returned: false,
      })),
      packageId: packageInfo?.id ?? null,
      blockReason: null,
      notes: input.notes?.trim() ?? "",
      subtotal: breakdown.subtotal,
      coachTotal: breakdown.coachTotal,
      equipmentTotal: breakdown.equipmentTotal,
      discount: breakdown.discount,
      total: breakdown.total,
      paid: input.paid ?? true,
      paymentMethod:
        input.paymentMethod ?? (packageInfo ? "package" : "online"),
      confirmationCode: createConfirmationCode(),
      reviewed: false,
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      cancellationPolicy: null,
    };

    if (customerPackage) customerPackage.sessionsUsed += 1;
    db.bookings.push(booking);

    return { ok: true, booking, customer } as const;
  });
}

export type CancelMode = "customer" | "admin" | "rain";

export type CancelResult =
  | {
      ok: true;
      refund: number;
      packageRefunded: boolean;
      policy: CancellationPolicy;
    }
  | { ok: false; error: string };

export function cancelBooking(
  bookingId: string,
  mode: CancelMode = "customer",
  now = new Date(),
): CancelResult {
  return updateDatabase((db) => {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { ok: false, error: "رزرو پیدا نشد." } as const;
    if (booking.status !== "confirmed") {
      return {
        ok: false,
        error: "فقط رزروهای تأییدشده قابل لغو هستند.",
      } as const;
    }

    let policy: CancellationPolicy;
    let refund = 0;
    let packageRefund = false;

    if (mode === "customer") {
      const result = getCancellationResult(booking, now);
      if (!result.allowed) return { ok: false, error: result.message } as const;
      policy = result.policy === "late" ? "late" : "free";
      refund = result.refund;
      packageRefund = result.packageSessionRefund;
    } else {
      policy = mode === "rain" ? "rain" : "admin";
      refund = booking.packageId ? 0 : booking.total;
      packageRefund = Boolean(booking.packageId);
    }

    booking.status = "cancelled";
    booking.cancelledAt = now.toISOString();
    booking.cancellationPolicy = policy;
    booking.paid = false;

    if (booking.packageId && packageRefund && booking.customerId) {
      const customerPackage = db.customerPackages.find(
        (item) =>
          item.customerId === booking.customerId &&
          item.packageId === booking.packageId &&
          item.sessionsUsed > 0,
      );
      if (customerPackage) customerPackage.sessionsUsed -= 1;
    }

    if (refund > 0 && booking.customerId) {
      const customer = db.customers.find(
        (item) => item.id === booking.customerId,
      );
      if (customer) customer.credit += refund;
    }

    return {
      ok: true,
      refund,
      packageRefunded: packageRefund,
      policy,
    } as const;
  });
}

export interface RainCancelSummary {
  count: number;
  refund: number;
  packageSessions: number;
}

export function cancelOutdoorBookingsForRain(
  from: ISODate,
  to: ISODate,
): RainCancelSummary {
  return updateDatabase((db) => {
    const outdoorCourts = new Set(
      db.courts
        .filter((court) => court.environment === "outdoor")
        .map((court) => court.id),
    );

    const affected = db.bookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        outdoorCourts.has(booking.courtId) &&
        booking.date >= from &&
        booking.date <= to,
    );

    let refund = 0;
    let packageSessions = 0;
    const now = new Date().toISOString();

    for (const booking of affected) {
      booking.status = "cancelled";
      booking.cancelledAt = now;
      booking.cancellationPolicy = "rain";
      booking.paid = false;

      if (booking.packageId && booking.customerId) {
        const customerPackage = db.customerPackages.find(
          (item) =>
            item.customerId === booking.customerId &&
            item.packageId === booking.packageId &&
            item.sessionsUsed > 0,
        );
        if (customerPackage) {
          customerPackage.sessionsUsed -= 1;
          packageSessions += 1;
        }
      } else {
        refund += booking.total;
        if (booking.customerId) {
          const customer = db.customers.find(
            (item) => item.id === booking.customerId,
          );
          if (customer) customer.credit += booking.total;
        }
      }
    }

    return { count: affected.length, refund, packageSessions };
  });
}

export function moveBooking(
  bookingId: string,
  target: { courtId: string; date: ISODate; startTime: string },
): { ok: true } | { ok: false; error: string } {
  return updateDatabase((db) => {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { ok: false, error: "رزرو پیدا نشد." } as const;
    if (booking.status === "blocked") {
      return {
        ok: false,
        error: "سانس مسدودشده را نمی‌توان جابه‌جا کرد.",
      } as const;
    }

    const court = db.courts.find((item) => item.id === target.courtId);
    if (!court) return { ok: false, error: "زمین مقصد پیدا نشد." } as const;

    const duration =
      timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);

    if (
      !isSlotFree({
        courtId: target.courtId,
        date: target.date,
        startTime: target.startTime,
        bookings: db.bookings,
        ignoreBookingId: bookingId,
        durationMinutes: duration,
      })
    ) {
      return {
        ok: false,
        error: "زمان مقصد اشغال است؛ زمان یا زمین دیگری انتخاب کنید.",
      } as const;
    }

    const coach = booking.coachId
      ? db.coaches.find((item) => item.id === booking.coachId) ?? null
      : null;

    const equipmentLines = booking.equipment
      .map((line) => {
        const equipment = db.equipment.find(
          (item) => item.id === line.equipmentId,
        );
        return equipment ? { equipment, quantity: line.quantity } : null;
      })
      .filter(
        (line): line is { equipment: Equipment; quantity: number } =>
          line !== null,
      );

    const pricingPackage = booking.packageId
      ? db.packages.find((pkg) => pkg.id === booking.packageId)
      : undefined;

    const breakdown = calculatePrice({
      court,
      date: target.date,
      startTime: target.startTime,
      durationMinutes: duration,
      coach,
      equipment: equipmentLines,
      pricingRules: db.pricingRules,
      packageDiscountPercent: pricingPackage?.discountPercent ?? 0,
    });

    booking.courtId = target.courtId;
    booking.date = target.date;
    booking.startTime = target.startTime;
    booking.endTime = minutesToTime(
      timeToMinutes(target.startTime) + duration,
    );
    booking.subtotal = breakdown.subtotal;
    booking.coachTotal = breakdown.coachTotal;
    booking.equipmentTotal = breakdown.equipmentTotal;
    booking.discount = breakdown.discount;
    booking.total = breakdown.total;

    return { ok: true } as const;
  });
}

export function setBookingStatus(
  bookingId: string,
  status: "confirmed" | "completed" | "no-show",
): { ok: true } | { ok: false; error: string } {
  return updateDatabase((db) => {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { ok: false, error: "رزرو پیدا نشد." } as const;
    if (booking.status === "blocked") {
      return {
        ok: false,
        error: "رزرو مسدود قابل تغییر وضعیت نیست.",
      } as const;
    }
    booking.status = status;
    return { ok: true } as const;
  });
}

export function setEquipmentState(
  bookingId: string,
  equipmentId: string,
  patch: { pickedUp?: boolean; returned?: boolean },
) {
  return updateDatabase((db) => {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return null;
    const line = booking.equipment.find(
      (item) => item.equipmentId === equipmentId,
    );
    if (!line) return null;
    Object.assign(line, patch);
    return booking;
  });
}

export interface CustomerPackageView {
  record: CustomerPackage;
  packageInfo: Package;
  remaining: number;
}

export function getCustomerPackageViews(
  customerId: string,
): CustomerPackageView[] {
  const db = getDatabase();

  return db.customerPackages
    .filter((item) => item.customerId === customerId)
    .map((record) => {
      const packageInfo = db.packages.find(
        (pkg) => pkg.id === record.packageId,
      );
      if (!packageInfo) return null;
      return {
        record,
        packageInfo,
        remaining: getPackageRemaining(record),
      };
    })
    .filter((item): item is CustomerPackageView => item !== null);
}

export function joinWaitlist(input: {
  customerId: string;
  customerName: string;
  courtId: string;
  date: ISODate;
  startTime: string;
  note?: string;
}): { ok: true } | { ok: false; error: string } {
  return updateDatabase((db) => {
    const duplicate = db.waitlist.some(
      (entry) =>
        entry.customerId === input.customerId &&
        entry.courtId === input.courtId &&
        entry.date === input.date &&
        entry.startTime === input.startTime &&
        (entry.status === "waiting" || entry.status === "offered"),
    );
    if (duplicate) {
      return {
        ok: false,
        error: "قبلاً برای این سانس در لیست انتظار هستید.",
      } as const;
    }

    const court = db.courts.find((item) => item.id === input.courtId);
    if (!court) return { ok: false, error: "زمین پیدا نشد." } as const;

    db.waitlist.unshift({
      id: createId("wait"),
      courtId: input.courtId,
      customerId: input.customerId,
      customerName: input.customerName,
      date: input.date,
      startTime: input.startTime,
      endTime: minutesToTime(
        timeToMinutes(input.startTime) + siteConfig.booking.slotMinutes,
      ),
      status: "waiting",
      createdAt: new Date().toISOString(),
      note: input.note?.trim() ?? "",
    });

    return { ok: true } as const;
  });
}

export function getRebookDate(booking: Booking): string | null {
  const db = getDatabase();
  const duration =
    timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
  const start = todayISO();

  for (let offset = 0; offset < siteConfig.booking.maxAdvanceDays; offset += 1) {
    const date = new Date(`${start}T00:00:00`);
    date.setDate(date.getDate() + offset);
    const iso = toISODate(date);

    if (
      isSlotFree({
        courtId: booking.courtId,
        date: iso,
        startTime: booking.startTime,
        bookings: db.bookings,
        durationMinutes: duration,
      })
    ) {
      return iso;
    }
  }

  return null;
}
