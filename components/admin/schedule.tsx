"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, cx } from "@/components/ui";
import { moveBooking } from "@/lib/booking/actions";
import { useDatabase } from "@/lib/data/use-database";
import { formatShortDate, addDays, todayISO, weekdayLabels } from "@/lib/mock/date-utils";
import { bookingStatusLabels } from "@/lib/labels";
import type { Booking } from "@/lib/types";

const hours = Array.from({ length: 16 }, (_, index) => `${String(7 + index).padStart(2, "0")}:00`);

function startOfIranianWeek(iso: string): string {
  const day = new Date(`${iso}T00:00:00`).getDay();
  const diff = (day - 6 + 7) % 7;
  return addDays(iso, -diff);
}

export function AdminSchedule() {
  const database = useDatabase();
  const [mode, setMode] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(todayISO());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekStart = startOfIranianWeek(anchor);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const courts = database.courts;

  function bookingsFor(courtId: string, date: string): Booking[] {
    return database.bookings
      .filter(
        (booking) =>
          booking.courtId === courtId &&
          booking.date === date &&
          booking.status !== "cancelled",
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function handleDrop(bookingId: string, courtId: string, date: string, startTime?: string) {
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (!booking) return;

    const response = moveBooking(bookingId, {
      courtId,
      date,
      startTime: startTime ?? booking.startTime,
    });

    if (!response.ok) {
      setError(response.error);
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(`رزرو ${booking.customerName} با موفقیت جابه‌جا شد.`);
  }

  function onDropCell(
    event: React.DragEvent,
    courtId: string,
    date: string,
    startTime?: string,
  ) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/bookingId");
    if (id) handleDrop(id, courtId, date, startTime);
  }

  function nav(direction: -1 | 1) {
    setAnchor((current) => addDays(current, direction * (mode === "day" ? 1 : 7)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold">جدول زمین‌ها</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            رزرو را با کشیدن و رها کردن به زمین یا روز دیگر منتقل کن.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-surface p-1">
            {(["day", "week"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold",
                  mode === item ? "bg-brand-strong text-white" : "text-muted",
                )}
              >
                {item === "day" ? "روزانه" : "هفتگی"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" onClick={() => nav(1)} aria-label="بعدی">
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAnchor(todayISO())}>
              امروز
            </Button>
            <Button size="sm" variant="secondary" onClick={() => nav(-1)} aria-label="قبلی">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {mode === "day" ? (
        <Card className="overflow-x-auto p-3">
          <div className="min-w-[760px]">
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(${courts.length}, minmax(0, 1fr))` }}>
              <span />
              {courts.map((court) => (
                <div key={court.id} className="px-2 pb-2 text-center text-[10px] font-bold">
                  {court.name}
                </div>
              ))}

              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="flex items-center justify-end pl-2 text-[10px] text-muted" dir="ltr">
                    {hour}
                  </div>
                  {courts.map((court) => {
                    const cellBookings = bookingsFor(court.id, anchor).filter(
                      (booking) => booking.startTime === hour,
                    );
                    return (
                      <div
                        key={`${court.id}-${hour}`}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => onDropCell(event, court.id, anchor, hour)}
                        className="min-h-11 border-b border-l border-line/50 p-1 last:border-l-0"
                      >
                        {cellBookings.map((booking) => (
                          <BookingChip key={booking.id} booking={booking} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-3">
          <div className="min-w-[820px]">
            <div className="grid" style={{ gridTemplateColumns: `130px repeat(7, minmax(0, 1fr))` }}>
              <span />
              {days.map((day) => (
                <div key={day} className="px-1 pb-2 text-center">
                  <p className="text-[10px] text-muted">
                    {weekdayLabels[new Date(`${day}T00:00:00`).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6]}
                  </p>
                  <p className="text-[11px] font-bold">{formatShortDate(day)}</p>
                </div>
              ))}

              {courts.map((court) => (
                <div key={court.id} className="contents">
                  <div className="flex items-center border-t border-line/60 py-2 pl-2 text-[10px] font-bold">
                    {court.name}
                  </div>
                  {days.map((day) => (
                    <div
                      key={`${court.id}-${day}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => onDropCell(event, court.id, day)}
                      className="min-h-24 space-y-1 border-t border-l border-line/60 p-1"
                    >
                      {bookingsFor(court.id, day).map((booking) => (
                        <BookingChip key={booking.id} booking={booking} />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-brand" /> تأییدشده</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> انجام‌شده</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-400" /> مسدود</span>
      </div>
    </div>
  );
}

function BookingChip({ booking }: { booking: Booking }) {
  const colors: Record<string, string> = {
    confirmed: "border-brand/30 bg-brand/10 text-brand",
    completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    blocked: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    "no-show": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };

  return (
    <div
      draggable={booking.status !== "blocked"}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/bookingId", booking.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cx(
        "cursor-grab rounded-lg border px-1.5 py-1 text-[9px] leading-4 active:cursor-grabbing",
        colors[booking.status] ?? "border-line bg-surface text-muted",
      )}
      title={`${booking.customerName} · ${booking.startTime}-${booking.endTime} · ${bookingStatusLabels[booking.status]}`}
    >
      <p className="truncate font-bold">{booking.customerName}</p>
      <p className="truncate opacity-80">{booking.startTime}–{booking.endTime}</p>
      {booking.status === "blocked" ? <Badge className="mt-1 px-1 py-0 text-[8px]">مسدود</Badge> : null}
    </div>
  );
}
