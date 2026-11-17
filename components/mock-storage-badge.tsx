"use client";

import { formatNumber } from "@/lib/currency";
import { useDatabase } from "@/lib/data/use-database";

export function MockStorageBadge() {
  const database = useDatabase();
  const bookingCount = database.bookings.filter(
    (booking) => booking.status !== "blocked",
  ).length;

  return (
    <p className="mt-4 flex items-center gap-2 text-[11px] leading-6 text-muted">
      <span className="size-1.5 shrink-0 rounded-full bg-brand" />
      داده‌های نمایشی در حافظهٔ همین مرورگر ذخیره شده‌اند —{" "}
      {formatNumber(bookingCount)} رزرو و {formatNumber(database.reviews.length)} نظر.
    </p>
  );
}
