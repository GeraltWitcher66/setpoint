"use client";

import {
  CalendarCheck,
  ChevronLeft,
  FileText,
  LogOut,
  Plus,
  Star,
  Ticket,
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
  ProgressBar,
  Select,
  Tabs,
  Textarea,
  cx,
} from "@/components/ui";
import { siteConfig } from "@/config/site";
import { setSession, useSession } from "@/lib/auth";
import { useDatabase } from "@/lib/data/use-database";
import { getCustomerById, getCourtById, getCoachById, getBookings, getWaitlist, addReview, patchWaitlistEntry } from "@/lib/data/store";
import {
  cancelBooking,
  getCustomerPackageViews,
  getRebookDate,
  joinWaitlist,
} from "@/lib/booking/actions";
import { getCancellationResult } from "@/lib/booking/engine";
import { formatPrice } from "@/lib/currency";
import { addDays, formatShortDate, todayISO } from "@/lib/mock/date-utils";
import { printInvoice } from "@/lib/invoice";
import {
  bookingStatusLabels,
  bookingStatusStyles,
  paymentMethodLabels,
  waitlistStatusLabels,
} from "@/lib/labels";
import type { Booking } from "@/lib/types";

const tabs = [
  { id: "upcoming", label: "رزروهای آینده", icon: <CalendarCheck className="size-3.5" /> },
  { id: "past", label: "گذشته", icon: <FileText className="size-3.5" /> },
  { id: "packages", label: "پکیج‌ها", icon: <Ticket className="size-3.5" /> },
  { id: "waitlist", label: "لیست انتظار", icon: <Plus className="size-3.5" /> },
];

export function AccountPanel() {
  const session = useSession();
  const database = useDatabase();
  const [phone, setPhone] = useState(siteConfig.demoAccounts.customer.phone);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState("upcoming");
  const [message, setMessage] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [waitCourt, setWaitCourt] = useState(database.courts[0]?.id ?? "");
  const [waitDate, setWaitDate] = useState(addDays(todayISO(), 1));
  const [waitTime, setWaitTime] = useState("18:00");
  const [waitError, setWaitError] = useState<string | null>(null);

  const customer = session?.customerId ? getCustomerById(session.customerId) : undefined;
  const upcoming = useMemo(
    () =>
      customer
        ? getBookings({ customerId: customer.id, from: todayISO(), status: ["confirmed"] })
        : [],
    [customer, database],
  );
  const past = useMemo(
    () =>
      customer
        ? getBookings({ customerId: customer.id, to: todayISO(), status: ["completed", "no-show", "cancelled"] })
        : [],
    [customer, database],
  );
  const packageViews = customer ? getCustomerPackageViews(customer.id) : [];
  const waitlist = customer
    ? getWaitlist().filter((entry) => entry.customerId === customer.id)
    : [];

  function login() {
    const normalized = phone.replace(/\D/g, "");
    const existing = database.customers.find(
      (item) => item.phone.replace(/\D/g, "") === normalized,
    );

    if (!existing) {
      setLoginError("این شماره در داده‌های دمو نیست. شمارهٔ ۰۹۱۲۰۰۰۰۰۰۰ را امتحان کنید.");
      return;
    }

    if (code.trim() !== siteConfig.demoAccounts.customer.code) {
      setLoginError("کد تأیید اشتباه است. کد نمایشی: ۱۲۳۴");
      return;
    }

    if (existing.blocked) {
      setLoginError("حساب شما مسدود شده است؛ با پذیرش باشگاه تماس بگیرید.");
      return;
    }

    setLoginError(null);
    setSession({ role: "customer", name: existing.name, customerId: existing.id });
  }

  function confirmCancel() {
    if (!cancelTarget) return;
    const response = cancelBooking(cancelTarget.id, "customer");
    setCancelTarget(null);

    if (!response.ok) {
      setMessage(response.error);
      return;
    }

    const parts = [
      response.policy === "free" ? "لغو رایگان انجام شد." : "لغو دیرهنگام انجام شد.",
      response.refund > 0 ? `${formatPrice(response.refund)} به اعتبار شما اضافه شد.` : "",
      response.packageRefunded ? "سانس پکیج برگشت." : "",
    ].filter(Boolean);

    setMessage(parts.join(" "));
  }

  function submitReview() {
    if (!reviewTarget || !customer) return;
    if (!comment.trim()) {
      setReviewError("لطفاً متن نظر را بنویسید.");
      return;
    }

    addReview({
      id: `review-${Date.now()}`,
      bookingId: reviewTarget.id,
      customerId: customer.id,
      customerName: customer.name,
      courtId: reviewTarget.courtId,
      coachId: reviewTarget.coachId,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    });

    setReviewTarget(null);
    setComment("");
    setRating(5);
    setReviewError(null);
    setMessage("نظر شما ثبت شد. ممنون!");
  }

  function submitWaitlist() {
    if (!customer) return;
    const response = joinWaitlist({
      customerId: customer.id,
      customerName: customer.name,
      courtId: waitCourt,
      date: waitDate,
      startTime: waitTime,
      note: "",
    });

    if (!response.ok) {
      setWaitError(response.error);
      return;
    }

    setWaitError(null);
    setMessage("درخواست شما به لیست انتظار اضافه شد.");
  }

  if (!session || !customer) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-14">
        <Card>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مشتری
          </p>
          <h1 className="mt-1 text-2xl font-black">ورود با موبایل</h1>
          <p className="mt-2 text-xs leading-6 text-muted">
            با شمارهٔ موبایل و کد پیامکی وارد شوید. این ورود نمایشی است.
          </p>

          <div className="mt-5 space-y-3">
            <Field label="شمارهٔ موبایل">
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                dir="ltr"
                inputMode="tel"
                placeholder="09120000000"
              />
            </Field>

            {!codeSent ? (
              <Button className="w-full" onClick={() => setCodeSent(true)}>
                دریافت کد تأیید
              </Button>
            ) : (
              <>
                <Alert tone="info">
                  کد نمایشی: <b>۱۲۳۴</b>
                </Alert>
                <Field label="کد تأیید">
                  <Input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                  />
                </Field>
                <Button className="w-full" onClick={login}>
                  ورود به پنل
                </Button>
              </>
            )}

            {loginError ? <Alert tone="error">{loginError}</Alert> : null}
          </div>

          <div className="mt-5 rounded-2xl bg-surface-2/70 p-3 text-[11px] leading-6 text-muted">
            <p className="font-bold text-foreground">اکانت دمو</p>
            <p dir="ltr" className="mt-1">09120000000 · 1234</p>
            <Link href="/booking/" className="mt-2 inline-flex font-bold text-brand">
              بدون حساب رزرو کن ←
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            پنل مشتری
          </p>
          <h1 className="mt-1 text-2xl font-black">سلام {customer.name} 👋</h1>
          <p className="mt-1 text-xs text-muted">
            اعتبار: <b className="text-foreground">{formatPrice(customer.credit)}</b>
            {customer.blocked ? " · حساب مسدود" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/booking/"
            className="rounded-full bg-brand-strong px-4 py-2.5 text-xs font-bold text-white"
          >
            رزرو جدید
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSession(null);
              setCodeSent(false);
              setCode("");
            }}
          >
            <LogOut className="size-3.5" /> خروج
          </Button>
        </div>
      </div>

      {message ? (
        <div className="mt-4">
          <Alert tone="success">{message}</Alert>
        </div>
      ) : null}

      <div className="mt-6">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        {tab === "upcoming" ? (
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState
                title="رزرو آینده‌ای نداری"
                description="از جدول رزرو یک سانس انتخاب کن."
                action={<Link href="/booking/" className="text-xs font-bold text-brand">رزرو آنلاین ←</Link>}
              />
            ) : (
              upcoming.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onCancel={() => setCancelTarget(booking)}
                  onInvoice={() => printInvoice(booking, getCourtById(booking.courtId), getCoachById(booking.coachId ?? "") ?? undefined)}
                  rebook={getRebookDate(booking)}
                />
              ))
            )}
          </div>
        ) : null}

        {tab === "past" ? (
          <div className="space-y-3">
            {past.length === 0 ? (
              <EmptyState title="سابقه‌ای ثبت نشده" description="بعد از بازی، فاکتور و ثبت نظر اینجا فعال می‌شود." />
            ) : (
              past.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onInvoice={() => printInvoice(booking, getCourtById(booking.courtId), getCoachById(booking.coachId ?? "") ?? undefined)}
                  onReview={
                    booking.status === "completed" && !booking.reviewed
                      ? () => setReviewTarget(booking)
                      : undefined
                  }
                  rebook={getRebookDate(booking)}
                />
              ))
            )}
          </div>
        ) : null}

        {tab === "packages" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {packageViews.length === 0 ? (
              <EmptyState title="پکیج فعالی نداری" description="پکیج‌ها را از صفحهٔ اصلی یا پذیرش باشگاه تهیه کن." />
            ) : (
              packageViews.map((view) => {
                const used = view.record.sessionsTotal - view.remaining;
                return (
                  <Card key={view.record.id}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold">{view.packageInfo.name}</h3>
                      <Badge className="border-brand/20 bg-brand/5 text-brand">{view.remaining} سانس</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {used} از {view.record.sessionsTotal} جلسه استفاده شده · تا {formatShortDate(view.record.expiresAt)}
                    </p>
                    <div className="mt-3">
                      <ProgressBar value={(used / view.record.sessionsTotal) * 100} />
                    </div>
                    <p className="mt-3 text-xs font-bold text-brand">
                      ارزش هر جلسه: {formatPrice(Math.round(view.packageInfo.price / view.packageInfo.sessions))}
                    </p>
                  </Card>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "waitlist" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-3">
              {waitlist.length === 0 ? (
                <EmptyState title="در لیست انتظار نیستی" description="برای سانس‌های پر، از فرم روبه‌رو درخواست بده." />
              ) : (
                waitlist.map((entry) => {
                  const court = getCourtById(entry.courtId);
                  return (
                    <Card key={entry.id} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">{court?.name}</p>
                          <p className="mt-1 text-[11px] text-muted">
                            {formatShortDate(entry.date)} · {entry.startTime} تا {entry.endTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{waitlistStatusLabels[entry.status]}</Badge>
                          {entry.status === "waiting" || entry.status === "offered" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                patchWaitlistEntry(entry.id, { status: "expired" });
                                setMessage("درخواست از لیست انتظار حذف شد.");
                              }}
                            >
                              لغو
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <Card className="space-y-3">
              <h3 className="text-sm font-extrabold">درخواست سانس در لیست انتظار</h3>
              <Field label="زمین">
                <Select value={waitCourt} onChange={(event) => setWaitCourt(event.target.value)}>
                  {database.courts.map((court) => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="تاریخ">
                <Input type="date" value={waitDate} min={todayISO()} max={addDays(todayISO(), 13)} onChange={(event) => setWaitDate(event.target.value)} />
              </Field>
              <Field label="ساعت شروع">
                <Select value={waitTime} onChange={(event) => setWaitTime(event.target.value)}>
                  {["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map((time) => (
                    <option key={time} value={time} dir="ltr">{time}</option>
                  ))}
                </Select>
              </Field>
              {waitError ? <Alert tone="error">{waitError}</Alert> : null}
              <Button className="w-full" onClick={submitWaitlist}>افزودن به لیست انتظار</Button>
              <p className="text-[10px] leading-5 text-muted">
                اگر سانس آزاد شود، پذیرش برای شما پیام می‌فرستد.
              </p>
            </Card>
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="لغو رزرو"
        footer={
          <>
            <Button variant="danger" onClick={confirmCancel}>لغو رزرو</Button>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>بی‌خیال</Button>
          </>
        }
      >
        {cancelTarget ? (
          <div className="space-y-3 text-xs leading-6">
            <p>
              رزرو {formatShortDate(cancelTarget.date)} ساعت {cancelTarget.startTime} را لغو می‌کنی؟
            </p>
            {(() => {
              const result = getCancellationResult(cancelTarget);
              return (
                <Alert tone={result.policy === "free" ? "success" : "warning"}>
                  {result.message}
                  {result.refund > 0 ? (
                    <span className="mt-1 block">مبلغ برگشتی: {formatPrice(result.refund)}</span>
                  ) : null}
                </Alert>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title="ثبت نظر"
        footer={<Button onClick={submitReview}>ثبت نظر</Button>}
      >
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-bold">امتیاز</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" aria-label={`${value} ستاره`} onClick={() => setRating(value)}>
                  <Star className={cx("size-7", value <= rating ? "fill-amber-400 text-amber-400" : "text-line")} />
                </button>
              ))}
            </div>
          </div>
          <Field label="نظر تو">
            <Textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="از زمین و مربی چطور بود؟" />
          </Field>
          {reviewError ? <Alert tone="error">{reviewError}</Alert> : null}
        </div>
      </Modal>
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  onReview,
  onInvoice,
  rebook,
}: {
  booking: Booking;
  onCancel?: () => void;
  onReview?: () => void;
  onInvoice?: () => void;
  rebook?: string | null;
}) {
  const court = getCourtById(booking.courtId);
  const coach = getCoachById(booking.coachId ?? "");

  return (
    <Card className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold">{court?.name ?? "زمین"}</h3>
            <Badge className={bookingStatusStyles[booking.status]}>
              {bookingStatusLabels[booking.status]}
            </Badge>
            {booking.packageId ? <Badge>پکیج</Badge> : null}
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {formatShortDate(booking.date)} · {booking.startTime} تا {booking.endTime}
            {coach ? ` · مربی ${coach.name}` : ""}
            {booking.paymentMethod ? ` · ${paymentMethodLabels[booking.paymentMethod]}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            کد رزرو: <span className="font-bold text-foreground">{booking.confirmationCode}</span> · {formatPrice(booking.total)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {onInvoice ? (
            <Button size="sm" variant="secondary" onClick={onInvoice}>
              <FileText className="size-3.5" /> فاکتور
            </Button>
          ) : null}
          {onReview ? (
            <Button size="sm" variant="accent" onClick={onReview}>
              <Star className="size-3.5" /> ثبت نظر
            </Button>
          ) : null}
          {rebook ? (
            <Link
              href={`/booking/?courtId=${booking.courtId}&date=${rebook}&startTime=${booking.startTime}${booking.coachId ? `&coachId=${booking.coachId}` : ""}`}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold transition-colors hover:border-brand hover:text-brand"
            >
              <ChevronLeft className="size-3.5" /> رزرو دوباره
            </Link>
          ) : null}
          {onCancel ? (
            <Button size="sm" variant="danger" onClick={onCancel}>
              لغو
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
