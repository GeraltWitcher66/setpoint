"use client";

import {
  CloudRain,
  Download,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  cx,
} from "@/components/ui";
import { siteConfig } from "@/config/site";
import { useDatabase } from "@/lib/data/use-database";
import {
  createBooking,
  cancelBooking,
  cancelOutdoorBookingsForRain,
  setBookingStatus,
  setEquipmentState,
} from "@/lib/booking/actions";
import { exportBookingsToExcel } from "@/lib/export";
import { formatPrice } from "@/lib/currency";
import { addDays, formatShortDate, todayISO } from "@/lib/mock/date-utils";
import {
  blockReasonLabels,
  bookingStatusLabels,
  bookingStatusStyles,
  sourceLabels,
} from "@/lib/labels";
import type { Booking } from "@/lib/types";

const statusFilters = [
  { value: "all", label: "همه" },
  { value: "confirmed", label: "تأییدشده" },
  { value: "completed", label: "انجام‌شده" },
  { value: "no-show", label: "غیبت" },
  { value: "cancelled", label: "لغوشده" },
  { value: "blocked", label: "مسدود" },
];

export function AdminBookings() {
  const database = useDatabase();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [equipmentTarget, setEquipmentTarget] = useState<Booking | null>(null);
  const [rainFrom, setRainFrom] = useState(todayISO());
  const [rainTo, setRainTo] = useState(addDays(todayISO(), 7));
  const [rainResult, setRainResult] = useState<string | null>(null);
  const [manual, setManual] = useState({
    name: "",
    phone: "",
    courtId: database.courts[0]?.id ?? "",
    date: todayISO(),
    startTime: "18:00",
    coachId: "",
    source: "walk-in" as "walk-in" | "phone",
    notes: "",
  });

  const filtered = useMemo(() => {
    const term = search.trim();
    return [...database.bookings]
      .filter((booking) => {
        if (status !== "all" && booking.status !== status) return false;
        if (!term) return true;
        return (
          booking.customerName.includes(term) ||
          booking.confirmationCode.toLowerCase().includes(term.toLowerCase()) ||
          booking.customerId?.includes(term)
        );
      })
      .sort((a, b) =>
        a.date === b.date
          ? b.startTime.localeCompare(a.startTime)
          : b.date.localeCompare(a.date),
      );
  }, [database.bookings, status, search]);

  const equipmentBooking = equipmentTarget
    ? database.bookings.find((booking) => booking.id === equipmentTarget.id) ?? null
    : null;

  const today = todayISO();

  function submitManual() {
    const response = createBooking({
      courtId: manual.courtId,
      date: manual.date,
      startTime: manual.startTime,
      customerName: manual.name,
      customerPhone: manual.phone,
      coachId: manual.coachId || null,
      source: manual.source,
      notes: manual.notes,
      paid: true,
      paymentMethod: "cash",
    });

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setError(null);
    setMessage(`رزرو دستی با کد ${response.booking.confirmationCode} ثبت شد.`);
    setManualOpen(false);
    setManual((current) => ({ ...current, name: "", phone: "", notes: "" }));
  }

  function runRainCancel() {
    if (
      !window.confirm(
        `همهٔ رزروهای تأییدشدهٔ زمین‌های روباز از ${rainFrom} تا ${rainTo} لغو شوند؟`,
      )
    ) {
      return;
    }

    const summary = cancelOutdoorBookingsForRain(rainFrom, rainTo);
    setRainResult(
      `${summary.count} رزرو لغو شد؛ ${formatPrice(summary.refund)} به اعتبار مشتری‌ها برگشت` +
        (summary.packageSessions > 0 ? ` و ${summary.packageSessions} سانس پکیج بازگردانده شد.` : "."),
    );
    setMessage(null);
  }

  return (
    <div className="space-y-5">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold">لیست رزروها</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {filtered.length} رزرو · امروز {formatShortDate(today)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => exportBookingsToExcel(filtered, database.courts, database.coaches)}>
                <Download className="size-3.5" /> خروجی اکسل
              </Button>
              <Button size="sm" onClick={() => setManualOpen(true)}>
                <Plus className="size-3.5" /> رزرو دستی
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="relative min-w-44 flex-1">
              <Search className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجوی نام یا کد رزرو…"
                className="pr-9"
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-32">
              {statusFilters.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </div>

          <div className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-right text-[11px]">
              <thead className="sticky top-0 bg-surface-2 text-[10px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">کد</th>
                  <th className="px-3 py-2 font-semibold">مشتری</th>
                  <th className="px-3 py-2 font-semibold">زمین</th>
                  <th className="px-3 py-2 font-semibold">تاریخ</th>
                  <th className="px-3 py-2 font-semibold">وضعیت</th>
                  <th className="px-3 py-2 font-semibold">مبلغ</th>
                  <th className="px-3 py-2 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const court = database.courts.find((item) => item.id === booking.courtId);
                  return (
                    <tr key={booking.id} className="border-t border-line/60 align-top">
                      <td className="px-3 py-2 font-mono text-[10px]" dir="ltr">{booking.confirmationCode}</td>
                      <td className="px-3 py-2">
                        <p className="font-bold">{booking.customerName}</p>
                        <p className="text-[10px] text-muted">{sourceLabels[booking.source]}</p>
                      </td>
                      <td className="px-3 py-2">{court?.name ?? "—"}</td>
                      <td className="px-3 py-2">
                        <p>{formatShortDate(booking.date)}</p>
                        <p className="text-[10px] text-muted" dir="ltr">{booking.startTime}–{booking.endTime}</p>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={bookingStatusStyles[booking.status]}>
                          {booking.status === "blocked" && booking.blockReason
                            ? blockReasonLabels[booking.blockReason]
                            : bookingStatusLabels[booking.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-bold">{formatPrice(booking.total)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {booking.status === "confirmed" ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => {
                                const response = setBookingStatus(booking.id, "completed");
                                setMessage(response.ok ? "رزرو به‌عنوان انجام‌شده علامت خورد." : response.error);
                              }}>
                                انجام‌شده
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const response = setBookingStatus(booking.id, "no-show");
                                setMessage(response.ok ? "غیبت ثبت شد." : response.error);
                              }}>
                                غیبت
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => {
                                if (!window.confirm("این رزرو با بازگشت کامل مبلغ لغو شود؟")) return;
                                const response = cancelBooking(booking.id, "admin");
                                setMessage(response.ok ? "رزرو لغو و مبلغ به اعتبار مشتری برگشت." : response.error);
                              }}>
                                لغو
                              </Button>
                            </>
                          ) : null}
                          {booking.equipment.length > 0 ? (
                            <Button size="sm" variant="secondary" onClick={() => setEquipmentTarget(booking)}>
                              <Wrench className="size-3" /> تجهیزات
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand">
              <CloudRain className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold">لغو گروهی باران</h2>
              <p className="text-[10px] text-muted">فقط زمین‌های روباز</p>
            </div>
          </div>
          <Field label="از تاریخ">
            <Input type="date" value={rainFrom} onChange={(event) => setRainFrom(event.target.value)} />
          </Field>
          <Field label="تا تاریخ">
            <Input type="date" value={rainTo} onChange={(event) => setRainTo(event.target.value)} />
          </Field>
          <Button variant="danger" className="w-full" onClick={runRainCancel}>
            لغو سانس‌های روباز و بازگشت اعتبار
          </Button>
          {rainResult ? <Alert tone="success">{rainResult}</Alert> : null}
          <p className="text-[10px] leading-5 text-muted">
            مبلغ رزروها به اعتبار مشتری اضافه می‌شود و سانس‌های پکیجی به اعتبار پکیج برمی‌گردند.
          </p>
        </Card>
      </div>

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="ثبت رزرو دستی"
        wide
        footer={<Button onClick={submitManual}>ثبت رزرو</Button>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام مشتری">
            <Input value={manual.name} onChange={(event) => setManual((current) => ({ ...current, name: event.target.value }))} placeholder="مثلاً امیر حسینی" />
          </Field>
          <Field label="شمارهٔ موبایل">
            <Input value={manual.phone} onChange={(event) => setManual((current) => ({ ...current, phone: event.target.value }))} placeholder="0912…" dir="ltr" />
          </Field>
          <Field label="زمین">
            <Select value={manual.courtId} onChange={(event) => setManual((current) => ({ ...current, courtId: event.target.value }))}>
              {database.courts.map((court) => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="تاریخ">
            <Input type="date" value={manual.date} min={todayISO()} max={addDays(todayISO(), siteConfig.booking.maxAdvanceDays)} onChange={(event) => setManual((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field label="ساعت شروع">
            <Select value={manual.startTime} onChange={(event) => setManual((current) => ({ ...current, startTime: event.target.value }))}>
              {Array.from({ length: 15 }, (_, index) => `${String(8 + index).padStart(2, "0")}:00`).map((time) => (
                <option key={time} value={time} dir="ltr">{time}</option>
              ))}
            </Select>
          </Field>
          <Field label="مربی (اختیاری)">
            <Select value={manual.coachId} onChange={(event) => setManual((current) => ({ ...current, coachId: event.target.value }))}>
              <option value="">بدون مربی</option>
              {database.coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>{coach.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="نوع رزرو">
            <Select value={manual.source} onChange={(event) => setManual((current) => ({ ...current, source: event.target.value as "walk-in" | "phone" }))}>
              <option value="walk-in">حضوری</option>
              <option value="phone">تلفنی</option>
            </Select>
          </Field>
          <Field label="یادداشت">
            <Textarea rows={2} value={manual.notes} onChange={(event) => setManual((current) => ({ ...current, notes: event.target.value }))} />
          </Field>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <p className="text-[10px] text-muted">پرداخت رزرو دستی نقدی و پرداخت‌شده ثبت می‌شود.</p>
      </Modal>

      <Modal
        open={Boolean(equipmentBooking)}
        onClose={() => setEquipmentTarget(null)}
        title="تحویل و بازگشت تجهیزات"
      >
        {equipmentBooking ? (
          <div className="space-y-2">
            {equipmentBooking.equipment.length === 0 ? (
              <p className="text-xs text-muted">تجهیزاتی برای این رزرو ثبت نشده است.</p>
            ) : (
              equipmentBooking.equipment.map((line) => {
                const item = database.equipment.find((equipment) => equipment.id === line.equipmentId);
                return (
                  <div key={line.equipmentId} className={cx("rounded-xl border border-line p-3 text-xs")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{item?.name} × {line.quantity}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={line.pickedUp ? "primary" : "secondary"}
                          onClick={() => setEquipmentState(equipmentBooking.id, line.equipmentId, { pickedUp: !line.pickedUp })}
                        >
                          {line.pickedUp ? "تحویل شده" : "تحویل"}
                        </Button>
                        <Button
                          size="sm"
                          variant={line.returned ? "primary" : "secondary"}
                          onClick={() => setEquipmentState(equipmentBooking.id, line.equipmentId, { returned: !line.returned })}
                        >
                          {line.returned ? "بازگشته" : "بازگشت"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
