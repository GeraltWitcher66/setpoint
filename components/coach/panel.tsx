"use client";

import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  LogOut,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  Textarea,
} from "@/components/ui";
import { siteConfig } from "@/config/site";
import { setSession, useSession } from "@/lib/auth";
import { useDatabase } from "@/lib/data/use-database";
import { getCoachByEmail, getCourtById, getCustomerById } from "@/lib/data/store";
import { updateDatabase } from "@/lib/mock/db";
import { createId } from "@/lib/id";
import { formatPrice } from "@/lib/currency";
import {
  addDays,
  formatShortDate,
  todayISO,
  weekdayLabels,
} from "@/lib/mock/date-utils";
import { bookingStatusLabels, bookingStatusStyles } from "@/lib/labels";
import type { Customer } from "@/lib/types";

const tabs = [
  { id: "sessions", label: "جلسات من", icon: <CalendarDays className="size-3.5" /> },
  { id: "hours", label: "ساعت کاری", icon: <CalendarClock className="size-3.5" /> },
  { id: "timeoff", label: "مرخصی", icon: <CalendarClock className="size-3.5" /> },
  { id: "students", label: "شاگردان", icon: <BookOpen className="size-3.5" /> },
];

export function CoachPanel() {
  const session = useSession();
  const database = useDatabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("sessions");
  const [message, setMessage] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<Customer | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const coach = session?.coachId
    ? database.coaches.find((item) => item.id === session.coachId)
    : undefined;

  function login() {
    const found = getCoachByEmail(email.trim());
    if (!found || password !== siteConfig.demoAccounts.coach.password) {
      setError("ایمیل یا رمز عبور اشتباه است. از اکانت دمو استفاده کنید.");
      return;
    }

    const current = database.coaches.find((item) => item.id === found.id);
    if (!current?.active) {
      setError("این مربی غیرفعال است.");
      return;
    }

    setError(null);
    setSession({ role: "coach", coachId: found.id, name: found.name });
  }

  const bookings = useMemo(
    () =>
      coach
        ? database.bookings.filter(
            (booking) =>
              booking.coachId === coach.id && booking.status !== "blocked",
          )
        : [],
    [coach, database.bookings],
  );

  const upcoming = bookings
    .filter((booking) => booking.date >= todayISO() && booking.status === "confirmed")
    .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
  const past = bookings
    .filter((booking) => booking.date < todayISO() || booking.status !== "confirmed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const classes = coach
    ? database.groupClasses.filter((item) => item.coachId === coach.id)
    : [];

  const studentIds = coach
    ? Array.from(
        new Set([
          ...bookings.map((booking) => booking.customerId).filter((id): id is string => Boolean(id)),
          ...classes.flatMap((item) => item.enrolledCustomerIds),
        ]),
      )
    : [];

  const students = studentIds
    .map((id) => getCustomerById(id))
    .filter((customer): customer is Customer => Boolean(customer));

  if (!session || !coach) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-14">
        <Card>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مربی
          </p>
          <h1 className="mt-1 text-2xl font-black">ورود مربی</h1>
          <p className="mt-2 text-xs leading-6 text-muted">
            برنامهٔ جلسات، ساعت کاری، مرخصی و یادداشت پیشرفت شاگردان.
          </p>

          <div className="mt-5 space-y-3">
            <Field label="ایمیل">
              <Input value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" type="email" placeholder="coach@demo.test" />
            </Field>
            <Field label="رمز عبور">
              <Input value={password} onChange={(event) => setPassword(event.target.value)} dir="ltr" type="password" placeholder="password" />
            </Field>
            <Button className="w-full" onClick={login}>ورود به پنل</Button>
            {error ? <Alert tone="error">{error}</Alert> : null}
          </div>

          <div className="mt-5 rounded-2xl bg-surface-2/70 p-3 text-[11px] leading-6 text-muted">
            <p className="font-bold text-foreground">اکانت دمو</p>
            <p dir="ltr" className="mt-1">coach@demo.test · password</p>
            <Link href="/" className="mt-2 inline-flex font-bold text-brand">
              بازگشت به سایت ←
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  function addWeeklyHour(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weekday = Number(data.get("weekday")) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const startTime = String(data.get("start"));
    const endTime = String(data.get("end"));

    if (startTime >= endTime) {
      setMessage("ساعت پایان باید بعد از شروع باشد.");
      return;
    }

    updateDatabase((db) => {
      const target = db.coaches.find((item) => item.id === coach!.id);
      if (!target) return;
      const exists = target.weeklyHours.some(
        (block) =>
          block.weekday === weekday &&
          block.startTime === startTime &&
          block.endTime === endTime,
      );
      if (!exists) target.weeklyHours.push({ weekday, startTime, endTime });
    });

    setMessage("ساعت کاری اضافه شد.");
  }

  function addTimeOff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const from = String(data.get("from"));
    const to = String(data.get("to"));

    if (from > to) {
      setMessage("بازهٔ مرخصی معتبر نیست.");
      return;
    }

    updateDatabase((db) => {
      const target = db.coaches.find((item) => item.id === coach!.id);
      if (!target) return;
      target.timeOff.push({
        id: createId("timeoff"),
        from,
        to,
        reason: String(data.get("reason")) || "مرخصی",
      });
    });

    setMessage("مرخصی ثبت شد.");
  }

  function saveNote() {
    if (!noteTarget) return;
    if (!noteText.trim()) {
      setNoteError("متن یادداشت خالی است.");
      return;
    }

    updateDatabase((db) => {
      db.studentNotes.push({
        id: createId("note"),
        coachId: coach!.id,
        customerId: noteTarget.id,
        note: noteText.trim(),
        date: todayISO(),
      });
    });

    setNoteTarget(null);
    setNoteText("");
    setNoteError(null);
    setMessage("یادداشت پیشرفت ثبت شد.");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مربی
          </p>
          <h1 className="mt-1 text-2xl font-black">{coach.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {coach.specialties.join(" · ")} · {formatPrice(coach.pricePerSession)} / جلسه
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSession(null)}>
          <LogOut className="size-3.5" /> خروج
        </Button>
      </div>

      {message ? <div className="mt-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="mt-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      <div className="mt-5">
        {tab === "sessions" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h2 className="text-sm font-extrabold">جلسات آینده</h2>
              <div className="mt-3 space-y-2">
                {upcoming.length === 0 ? (
                  <EmptyState title="جلسه‌ای در پیش نیست" description="رزروهای شما از پنل مشتری ثبت می‌شوند." />
                ) : (
                  upcoming.map((booking) => (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 text-[11px]">
                      <div>
                        <p className="font-bold">{booking.customerName}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {formatShortDate(booking.date)} · {booking.startTime} تا {booking.endTime} · {getCourtById(booking.courtId)?.name}
                        </p>
                      </div>
                      <Badge className={bookingStatusStyles[booking.status]}>{bookingStatusLabels[booking.status]}</Badge>
                    </div>
                  ))
                )}
              </div>

              <h2 className="mt-6 text-sm font-extrabold">جلسات گذشته</h2>
              <div className="mt-3 space-y-2">
                {past.slice(0, 8).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-2 rounded-xl border border-line/70 px-3 py-2 text-[11px]">
                    <span>
                      {booking.customerName} · {formatShortDate(booking.date)} · {booking.startTime}
                    </span>
                    <Badge className={bookingStatusStyles[booking.status]}>{bookingStatusLabels[booking.status]}</Badge>
                  </div>
                ))}
                {past.length === 0 ? <p className="text-xs text-muted">سابقه‌ای ثبت نشده.</p> : null}
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-extrabold">کلاس‌های گروهی</h2>
              <div className="mt-3 space-y-3">
                {classes.map((groupClass) => (
                  <div key={groupClass.id} className="rounded-xl border border-line p-3">
                    <p className="text-xs font-bold">{groupClass.name}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {groupClass.weekdays.map((day) => weekdayLabels[day]).join(" / ")} · {groupClass.startTime} · {groupClass.durationMinutes} دقیقه
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {groupClass.enrolledCustomerIds.length} شاگرد از {groupClass.capacity} ظرفیت
                    </p>
                  </div>
                ))}
                {classes.length === 0 ? <p className="text-xs text-muted">کلاسی به شما اختصاص ندارد.</p> : null}
              </div>
            </Card>
          </div>
        ) : null}

        {tab === "hours" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h2 className="text-sm font-extrabold">ساعت کاری هفتگی</h2>
              <div className="mt-3 space-y-2">
                {coach.weeklyHours.map((block, index) => (
                  <div key={`${block.weekday}-${block.startTime}-${index}`} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-[11px]">
                    <span className="font-semibold">
                      {weekdayLabels[block.weekday]} · <span dir="ltr">{block.startTime} – {block.endTime}</span>
                    </span>
                    <button
                      type="button"
                      aria-label="حذف ساعت کاری"
                      onClick={() => {
                        updateDatabase((db) => {
                          const target = db.coaches.find((item) => item.id === coach!.id);
                          if (!target) return;
                          target.weeklyHours = target.weeklyHours.filter((_, position) => position !== index);
                        });
                        setMessage("ساعت کاری حذف شد.");
                      }}
                      className="rounded-full p-1.5 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-extrabold">افزودن بازهٔ کاری</h2>
              <form onSubmit={addWeeklyHour} className="mt-3 space-y-3">
                <Field label="روز هفته">
                  <Select name="weekday" defaultValue="6">
                    {[6, 0, 1, 2, 3, 4, 5].map((day) => (
                      <option key={day} value={day}>
                        {weekdayLabels[day as 0 | 1 | 2 | 3 | 4 | 5 | 6]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="از">
                    <Input name="start" type="time" defaultValue="16:00" />
                  </Field>
                  <Field label="تا">
                    <Input name="end" type="time" defaultValue="20:00" />
                  </Field>
                </div>
                <Button type="submit" size="sm">
                  <Plus className="size-3.5" /> افزودن
                </Button>
              </form>
            </Card>
          </div>
        ) : null}

        {tab === "timeoff" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h2 className="text-sm font-extrabold">مرخصی‌ها</h2>
              <div className="mt-3 space-y-2">
                {coach.timeOff.length === 0 ? (
                  <p className="text-xs text-muted">مرخصی ثبت نشده است.</p>
                ) : (
                  coach.timeOff.map((range) => (
                    <div key={range.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-[11px]">
                      <span>
                        {formatShortDate(range.from)} تا {formatShortDate(range.to)} · {range.reason}
                      </span>
                      <button
                        type="button"
                        aria-label="حذف مرخصی"
                        onClick={() => {
                          updateDatabase((db) => {
                            const target = db.coaches.find((item) => item.id === coach!.id);
                            if (!target) return;
                            target.timeOff = target.timeOff.filter((item) => item.id !== range.id);
                          });
                          setMessage("مرخصی حذف شد.");
                        }}
                        className="rounded-full p-1.5 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-extrabold">ثبت مرخصی جدید</h2>
              <form onSubmit={addTimeOff} className="mt-3 space-y-3">
                <Field label="از تاریخ">
                  <Input name="from" type="date" defaultValue={addDays(todayISO(), 1)} />
                </Field>
                <Field label="تا تاریخ">
                  <Input name="to" type="date" defaultValue={addDays(todayISO(), 2)} />
                </Field>
                <Field label="دلیل">
                  <Input name="reason" placeholder="مرخصی شخصی" />
                </Field>
                <Button type="submit" size="sm">ثبت مرخصی</Button>
              </form>
            </Card>
          </div>
        ) : null}

        {tab === "students" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {students.length === 0 ? (
              <EmptyState title="شاگردی ثبت نشده" description="بعد از اولین جلسه یا ثبت‌نام در کلاس، شاگردان اینجا نمایش داده می‌شوند." />
            ) : (
              students.map((student) => {
                const notes = database.studentNotes.filter(
                  (note) => note.coachId === coach.id && note.customerId === student.id,
                );
                const sessions = bookings.filter((booking) => booking.customerId === student.id).length;
                return (
                  <Card key={student.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold">{student.name}</h3>
                        <p className="mt-0.5 text-[10px] text-muted" dir="ltr">{student.phone}</p>
                        <p className="mt-1 text-[10px] text-muted">{sessions} جلسه با شما</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setNoteTarget(student)}>
                        <NotebookPen className="size-3" /> یادداشت
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {notes.length === 0 ? (
                        <p className="text-[10px] text-muted">یادداشت پیشرفتی ثبت نشده.</p>
                      ) : (
                        notes.map((note) => (
                          <div key={note.id} className="rounded-xl bg-surface-2/60 px-3 py-2 text-[10px] leading-5">
                            <p>{note.note}</p>
                            <p className="mt-1 text-[9px] text-muted">{formatShortDate(note.date)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title={`یادداشت پیشرفت ${noteTarget?.name ?? ""}`}
        footer={<Button onClick={saveNote}>ذخیره یادداشت</Button>}
      >
        <Field label="متن یادداشت">
          <Textarea rows={4} value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="مثلاً سرویس دوم بهتر شده؛ روی حرکت پا کار کنیم." />
        </Field>
        {noteError ? <Alert tone="error">{noteError}</Alert> : null}
      </Modal>
    </div>
  );
}
