import { describe, expect, it } from "vitest";
import type {
  Booking,
  Coach,
  Court,
  Holiday,
  PricingRule,
} from "@/lib/types";
import {
  calculatePrice,
  getCancellationResult,
  getDaySchedule,
  isCoachAvailable,
} from "./engine";

const court: Court = {
  id: "court-1",
  name: "زمین تست",
  surface: "hard",
  environment: "indoor",
  hasLights: true,
  basePricePerHour: 400_000,
  peakPricePerHour: 500_000,
  image: "",
  amenities: [],
  status: "active",
  sortOrder: 1,
  description: "",
};

const rules: PricingRule[] = [
  {
    id: "evening",
    name: "پیک عصر",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "17:00",
    endTime: "22:00",
    multiplier: 1.25,
    active: true,
  },
];

const holidays: Holiday[] = [
  { id: "h1", date: "2026-03-12", name: "تعطیل", closed: true },
];

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    courtId: "court-1",
    customerId: "c1",
    customerName: "مشتری",
    date: "2026-03-10",
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
    source: "online",
    coachId: null,
    equipment: [],
    packageId: null,
    blockReason: null,
    notes: "",
    subtotal: 400_000,
    coachTotal: 0,
    equipmentTotal: 0,
    discount: 0,
    total: 400_000,
    paid: true,
    paymentMethod: "online",
    confirmationCode: "SP-1",
    reviewed: false,
    createdAt: "2026-03-01T10:00:00.000Z",
    cancelledAt: null,
    cancellationPolicy: null,
    ...overrides,
  };
}

const now = new Date("2026-03-01T09:00:00");

describe("getDaySchedule", () => {
  it("generates one slot per hour between opening and closing", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-03-10",
      bookings: [],
      holidays,
      pricingRules: rules,
      now,
    });

    expect(schedule.slots).toHaveLength(16);
    expect(schedule.slots[0].startTime).toBe("07:00");
    expect(schedule.slots.at(-1)?.endTime).toBe("23:00");
    expect(schedule.slots.every((slot) => slot.state === "available")).toBe(true);
  });

  it("marks overlapping reservations as booked", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-03-10",
      bookings: [booking()],
      holidays,
      pricingRules: rules,
      now,
    });

    const slot = schedule.slots.find((item) => item.startTime === "10:00");
    expect(slot?.state).toBe("booked");
    expect(slot?.bookingId).toBe("b1");
  });

  it("closes the whole day for a holiday", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-03-12",
      bookings: [],
      holidays,
      pricingRules: rules,
      now,
    });

    expect(schedule.closed).toBe(true);
    expect(schedule.slots.every((slot) => slot.state === "closed")).toBe(true);
  });

  it("marks past dates as unavailable", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-02-01",
      bookings: [],
      holidays,
      pricingRules: rules,
      now,
    });

    expect(schedule.slots.every((slot) => slot.state === "past")).toBe(true);
  });

  it("applies the lead time for today", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-03-01",
      bookings: [],
      holidays,
      pricingRules: rules,
      now,
    });

    const nine = schedule.slots.find((slot) => slot.startTime === "09:00");
    const twelve = schedule.slots.find((slot) => slot.startTime === "12:00");
    expect(nine?.state).toBe("past");
    expect(twelve?.state).toBe("available");
  });

  it("uses the peak price for evening slots", () => {
    const schedule = getDaySchedule({
      court,
      date: "2026-03-10",
      bookings: [],
      holidays,
      pricingRules: rules,
      now,
    });

    expect(schedule.slots.find((slot) => slot.startTime === "18:00")?.price).toBe(
      500_000,
    );
    expect(schedule.slots.find((slot) => slot.startTime === "18:00")?.peak).toBe(
      true,
    );
    expect(schedule.slots.find((slot) => slot.startTime === "09:00")?.price).toBe(
      400_000,
    );
  });
});

describe("calculatePrice", () => {
  it("adds coach, equipment and package discount", () => {
    const coach = {
      id: "coach-1",
      pricePerSession: 700_000,
    } as Coach;

    const breakdown = calculatePrice({
      court,
      date: "2026-03-10",
      startTime: "18:00",
      coach,
      equipment: [
        {
          equipment: {
            id: "eq-1",
            name: "راکت",
            category: "racket",
            pricePerSession: 50_000,
            stock: 2,
            unitLabel: "عدد",
            description: "",
          },
          quantity: 2,
        },
      ],
      pricingRules: rules,
      packageDiscountPercent: 8,
    });

    expect(breakdown.peak).toBe(true);
    expect(breakdown.courtTotal).toBe(500_000);
    expect(breakdown.coachTotal).toBe(700_000);
    expect(breakdown.equipmentTotal).toBe(100_000);
    expect(breakdown.subtotal).toBe(1_300_000);
    expect(breakdown.discount).toBe(104_000);
    expect(breakdown.total).toBe(1_196_000);
  });
});

describe("getCancellationResult", () => {
  it("refunds everything more than 24 hours before the session", () => {
    const result = getCancellationResult(
      booking({ date: "2026-03-10", startTime: "10:00" }),
      new Date("2026-03-08T10:00:00"),
    );

    expect(result.policy).toBe("free");
    expect(result.refund).toBe(400_000);
    expect(result.fee).toBe(0);
  });

  it("charges a late fee inside 24 hours", () => {
    const result = getCancellationResult(
      booking({ date: "2026-03-10", startTime: "10:00" }),
      new Date("2026-03-09T20:00:00"),
    );

    expect(result.policy).toBe("late");
    expect(result.fee).toBe(200_000);
    expect(result.refund).toBe(200_000);
  });

  it("returns a package session only for free cancellations", () => {
    const free = getCancellationResult(
      booking({ packageId: "pkg-10" }),
      new Date("2026-03-08T10:00:00"),
    );
    const late = getCancellationResult(
      booking({ packageId: "pkg-10" }),
      new Date("2026-03-09T20:00:00"),
    );

    expect(free.packageSessionRefund).toBe(true);
    expect(late.packageSessionRefund).toBe(false);
  });
});

describe("isCoachAvailable", () => {
  const coach = {
    id: "coach-1",
    active: true,
    timeOff: [
      { id: "t1", from: "2026-03-15", to: "2026-03-16", reason: "مرخصی" },
    ],
    weeklyHours: [
      { weekday: 2 as const, startTime: "16:00", endTime: "20:00" },
    ],
  } as Coach;

  it("accepts a slot inside the working hours", () => {
    // 2026-03-10 is a Tuesday (weekday 2).
    expect(isCoachAvailable(coach, "2026-03-10", "17:00", "18:00")).toBe(true);
  });

  it("rejects slots outside the working hours", () => {
    expect(isCoachAvailable(coach, "2026-03-10", "10:00", "11:00")).toBe(false);
  });

  it("rejects days off", () => {
    expect(isCoachAvailable(coach, "2026-03-16", "17:00", "18:00")).toBe(false);
  });
});
