"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, ProgressBar, cx } from "@/components/ui";
import { siteConfig } from "@/config/site";
import {
  findCustomerByPhone,
  getCoaches,
  getCourts,
  getEquipment,
  getPackages,
} from "@/lib/data/store";
import { useDatabase } from "@/lib/data/use-database";
import {
  calculatePrice,
  getDaySchedule,
  getPackageRemaining,
  isCoachAvailable,
} from "@/lib/booking/engine";
import { createBooking } from "@/lib/booking/actions";
import { formatPrice } from "@/lib/currency";
import {
  addDays,
  formatShortDate,
  minutesToTime,
  timeToMinutes,
  todayISO,
  weekdayLabels,
} from "@/lib/mock/date-utils";
import { coachLevelLabels } from "@/lib/labels";
import type { Booking, CustomerPackage, Package } from "@/lib/types";

type PackageOption = {
  record: CustomerPackage;
  info: Package;
  remaining: number;
};

const steps = [
  { id: 1, label: "زمین و زمان" },
  { id: 2, label: "مربی" },
  { id: 3, label: "تجهیزات" },
  { id: 4, label: "تأیید موبایل" },
  { id: 5, label: "پرداخت" },
];

export function BookingWizard() {
  const params = useSearchParams();
  const database = useDatabase();
  const courts = getCourts();
  const coaches = getCoaches();
  const equipmentItems = getEquipment();
  const packages = getPackages();

  const today = todayISO();
  const initialDate = params.get("date") ?? today;
  const initialCourt = params.get("courtId") ?? courts[0]?.id ?? "";
  const initialCoach = params.get("coachId") ?? "";
  const initialTime = params.get("startTime") ?? "";

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(initialDate);
  const [courtId, setCourtId] = useState(initialCourt);
  const [slot, setSlot] = useState<{
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(() =>
    initialTime && initialCourt
      ? {
          courtId: initialCourt,
          date: initialDate,
          startTime: initialTime,
          endTime: minutesToTime(
            timeToMinutes(initialTime) + siteConfig.booking.slotMinutes,
          ),
        }
      : null,
  );
  const [coachId, setCoachId] = useState<string | null>(initialCoach || null);
  const [equipment, setEquipment] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<Booking | null>(null);

  const dates = useMemo(
    () => Array.from({ length: siteConfig.booking.maxAdvanceDays }, (_, index) => addDays(today, index)),
    [today],
  );

  const customer = phone ? findCustomerByPhone(phone) : undefined;
  const customerPackages = useMemo<PackageOption[]>(() => {
    if (!customer) return [];
    return database.customerPackages
      .filter(
        (item) =>
          item.customerId === customer.id && getPackageRemaining(item) > 0,
      )
      .map<PackageOption | null>((item) => {
        const info = packages.find((pkg) => pkg.id === item.packageId);
        return info
          ? { record: item, info, remaining: getPackageRemaining(item) }
          : null;
      })
      .filter((item): item is PackageOption => item !== null);
  }, [customer, database.customerPackages, packages]);

  const activePackage = customerPackages.find((item) => item.record.packageId === selectedPackage);
  const coach = coaches.find((item) => item.id === coachId) ?? null;
  const court = courts.find((item) => item.id === courtId) ?? courts[0];

  const equipmentSelection = equipmentItems
    .map((item) => ({ equipment: item, quantity: equipment[item.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  const breakdown = court
    ? calculatePrice({
        court,
        date: slot?.date ?? date,
        startTime: slot?.startTime ?? "09:00",
        coach,
        equipment: equipmentSelection,
        pricingRules: database.pricingRules,
        packageDiscountPercent: activePackage?.info.discountPercent ?? 0,
      })
    : null;

  const timeLabel = slot ? `${slot.startTime} تا ${slot.endTime}` : "—";

  function chooseSlot(nextCourtId: string, nextDate: string, startTime: string, endTime: string) {
    setCourtId(nextCourtId);
    setDate(nextDate);
    setSlot({ courtId: nextCourtId, date: nextDate, startTime, endTime });
    setCoachId(null);
    setError(null);
    setStep(2);
  }

  function goNext() {
    setError(null);

    if (step === 2 && coachId) {
      if (!slot) return;
      if (!isCoachAvailable(coach!, slot.date, slot.startTime, slot.endTime)) {
        setError("این مربی در این ساعت در دسترس نیست؛ زمان یا مربی دیگری انتخاب کنید.");
        return;
      }
    }

    if (step === 4) {
      if (!verified) {
        setError("ابتدا شمارهٔ موبایل را با کد تأیید کنید.");
        return;
      }
    }

    setStep((current) => Math.min(5, current + 1));
  }

  function sendCode() {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("شمارهٔ موبایل معتبر وارد کنید.");
      return;
    }
    setError(null);
    setCodeSent(true);
  }

  function verifyCode() {
    if (code.trim() !== siteConfig.demoAccounts.customer.code) {
      setError("کد تأیید اشتباه است. کد نمایشی: ۱۲۳۴");
      return;
    }
    setVerified(true);
    setError(null);
    setStep(5);
  }

  function pay() {
    if (!slot || !court) {
      setError("زمان رزرو انتخاب نشده است.");
      return;
    }

    setPaying(true);
    setError(null);

    window.setTimeout(() => {
      const response = createBooking({
        courtId: slot.courtId,
        date: slot.date,
        startTime: slot.startTime,
        customerName: name,
        customerPhone: phone,
        coachId,
        equipment: equipmentSelection.map((line) => ({
          equipmentId: line.equipment.id,
          quantity: line.quantity,
        })),
        packageId: activePackage?.record.packageId ?? null,
        source: "online",
        paid: true,
        paymentMethod: activePackage ? "package" : "online",
      });

      setPaying(false);

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setResult(response.booking);
    }, 900);
  }

  if (result) {
    const bookedCourt = courts.find((item) => item.id === result.courtId);
    const bookedCoach = coaches.find((item) => item.id === result.coachId);

    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-ink">
              <Check className="size-8" />
            </span>
            <h1 className="mt-4 text-2xl font-black">رزرو ثبت شد!</h1>
            <p className="mt-2 text-sm text-muted">
              کد رزرو شما <span className="font-black text-brand">{result.confirmationCode}</span> است.
            </p>

            <dl className="mt-6 space-y-2 rounded-2xl border border-line bg-surface-2/50 p-4 text-xs">
              {[
                ["زمین", bookedCourt?.name ?? "—"],
                ["تاریخ", formatShortDate(result.date)],
                ["ساعت", `${result.startTime} تا ${result.endTime}`],
                ["مربی", bookedCoach?.name ?? "بدون مربی"],
                ["مبلغ", formatPrice(result.total)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-bold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/account/" className="rounded-full bg-brand-strong px-5 py-2.5 text-xs font-bold text-white">
                مشاهده در پنل من
              </Link>
              <Link href="/booking/" className="rounded-full border border-line px-5 py-2.5 text-xs font-bold">
                رزرو جدید
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">رزرو آنلاین</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">زمین و ساعتت را انتخاب کن</h1>
        </div>
        <div className="text-xs text-muted">سانس‌ها ۶۰ دقیقه‌ای هستند</div>
      </div>

      <div className="mt-6 flex gap-2">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id < step) setStep(item.id);
            }}
            className={cx(
              "flex-1 rounded-xl border px-2 py-2 text-[10px] font-bold transition-colors sm:text-xs",
              step === item.id
                ? "border-brand bg-brand/10 text-brand"
                : step > item.id
                  ? "border-line bg-surface text-foreground"
                  : "border-line bg-surface text-muted",
            )}
          >
            {step > item.id ? "✓" : item.id} · {item.label}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <ProgressBar value={(step / 5) * 100} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
          className="mt-6"
        >
          {step === 1 ? (
            <div className="space-y-5">
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {dates.map((item) => {
                  const active = item === date;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setDate(item);
                        setSlot(null);
                      }}
                      className={cx(
                        "w-[74px] shrink-0 rounded-2xl border px-2 py-2.5 text-center transition-colors",
                        active
                          ? "border-brand bg-brand-strong text-white"
                          : "border-line bg-surface text-muted hover:border-brand",
                      )}
                    >
                      <span className="block text-[10px] font-semibold">
                        {
                          weekdayLabels[
                            new Date(`${item}T00:00:00`).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
                          ]
                        }
                      </span>
                      <span className="mt-1 block text-sm font-black">{formatShortDate(item)}</span>
                    </button>
                  );
                })}
              </div>

              {!court ? (
                <Alert tone="error">هیچ زمینی ثبت نشده است.</Alert>
              ) : (
                <div className="space-y-4">
                  {courts.map((item) => {
                    const schedule = getDaySchedule({
                      court: item,
                      date,
                      bookings: database.bookings,
                      holidays: database.holidays,
                      pricingRules: database.pricingRules,
                    });
                    return (
                      <Card key={item.id} className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h2 className="text-sm font-extrabold">{item.name}</h2>
                            <p className="mt-1 text-[11px] text-muted">
                              {item.environment === "indoor" ? "سرپوشیده" : "روباز"} · پایه {formatPrice(item.basePricePerHour)} / ساعت
                              {item.hasLights ? " · نورافکن" : ""}
                            </p>
                          </div>
                          {schedule.closed ? (
                            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              {schedule.reason ?? "تعطیل"}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
                          {schedule.slots.map((daySlot) => {
                            const selected =
                              slot?.courtId === item.id &&
                              slot.date === date &&
                              slot.startTime === daySlot.startTime;
                            const disabled = daySlot.state !== "available";
                            return (
                              <button
                                key={daySlot.startTime}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  chooseSlot(item.id, date, daySlot.startTime, daySlot.endTime)
                                }
                                className={cx(
                                  "rounded-xl border px-1 py-2 text-center transition-colors",
                                  selected
                                    ? "border-brand bg-brand-strong text-white"
                                    : disabled
                                      ? "cursor-not-allowed border-line/60 bg-surface-2/40 text-muted/60"
                                      : "border-line bg-surface hover:border-brand hover:text-brand",
                                )}
                              >
                                <span className="block text-xs font-bold" dir="ltr">
                                  {daySlot.startTime}
                                </span>
                                <span className="mt-0.5 block text-[9px]">
                                  {daySlot.state === "available"
                                    ? `${formatPrice(daySlot.price).replace(" تومان", "")}${daySlot.peak ? " ⚡" : ""}`
                                    : daySlot.state === "booked"
                                      ? "پر"
                                      : daySlot.state === "blocked"
                                        ? "مسدود"
                                        : daySlot.state === "past"
                                          ? "گذشته"
                                          : daySlot.state === "closed"
                                            ? "تعطیل"
                                            : "تعمیر"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {slot ? (
                <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 text-xs">
                  <p className="font-bold text-brand">
                    انتخاب شما: {courts.find((item) => item.id === slot.courtId)?.name} · {formatShortDate(slot.date)} · {timeLabel}
                  </p>
                  <Button className="mt-3" size="sm" onClick={() => setStep(2)}>
                    ادامه
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-xs text-muted">
                  {court?.name} · {formatShortDate(slot?.date ?? date)} · {timeLabel}
                </p>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCoachId(null)}
                  className={cx(
                    "rounded-2xl border p-4 text-right transition-colors",
                    coachId === null ? "border-brand bg-brand/5" : "border-line bg-surface hover:border-brand",
                  )}
                >
                  <p className="text-sm font-bold">بدون مربی</p>
                  <p className="mt-1 text-[11px] text-muted">فقط زمین را رزرو می‌کنم.</p>
                </button>

                {coaches.map((item) => {
                  const available = slot ? isCoachAvailable(item, slot.date, slot.startTime, slot.endTime) : false;
                  const active = coachId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!available}
                      onClick={() => setCoachId(item.id)}
                      className={cx(
                        "rounded-2xl border p-4 text-right transition-colors",
                        active
                          ? "border-brand bg-brand/5"
                          : available
                            ? "border-line bg-surface hover:border-brand"
                            : "cursor-not-allowed border-line/60 bg-surface-2/40 opacity-60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">{item.name}</p>
                        <Badge>{coachLevelLabels[item.level]}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{item.specialties.join(" · ")}</p>
                      <p className="mt-2 text-xs font-bold text-brand">
                        {formatPrice(item.pricePerSession)}
                        {!available ? <span className="font-medium text-muted"> · در این ساعت نیست</span> : null}
                      </p>
                    </button>
                  );
                })}
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}
              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ChevronRight className="size-4" /> مرحله قبل
                </Button>
                <Button onClick={goNext}>
                  ادامه <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-xs text-muted">
                  تجهیزات اختیاری است و هزینهٔ آن به همین سانس اضافه می‌شود.
                </p>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                {equipmentItems.map((item) => {
                  const quantity = equipment[item.id] ?? 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="mt-1 text-[11px] text-muted">
                          {formatPrice(item.pricePerSession)} · موجودی {item.stock} {item.unitLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`کاهش ${item.name}`}
                          onClick={() => setEquipment((current) => ({ ...current, [item.id]: Math.max(0, quantity - 1) }))}
                          className="grid size-8 place-items-center rounded-full border border-line text-muted"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-black">{quantity}</span>
                        <button
                          type="button"
                          aria-label={`افزایش ${item.name}`}
                          onClick={() => setEquipment((current) => ({ ...current, [item.id]: Math.min(item.stock, quantity + 1) }))}
                          className="grid size-8 place-items-center rounded-full border border-line text-muted"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ChevronRight className="size-4" /> مرحله قبل
                </Button>
                <Button onClick={goNext}>
                  ادامه <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <Card className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="نام و نام خانوادگی">
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً سارا احمدی" />
                  </Field>
                  <Field label="شمارهٔ موبایل" hint="کد تأیید برای همین شماره پیامک می‌شود (شبیه‌سازی).">
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0912…" inputMode="tel" dir="ltr" />
                  </Field>
                </div>

                {!codeSent ? (
                  <Button onClick={sendCode}>ارسال کد تأیید</Button>
                ) : (
                  <div className="space-y-3">
                    <Alert tone="info">کد نمایشی این دمو: <span className="font-black">۱۲۳۴</span></Alert>
                    <div className="flex flex-wrap items-end gap-2">
                      <Field label="کد تأیید" className="flex-1">
                        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="۱۲۳۴" inputMode="numeric" dir="ltr" maxLength={4} />
                      </Field>
                      <Button onClick={verifyCode}>
                        <ShieldCheck className="size-4" /> تأیید
                      </Button>
                    </div>
                    {verified ? <Alert tone="success">شمارهٔ شما تأیید شد.</Alert> : null}
                  </div>
                )}
              </Card>

              {error ? <Alert tone="error">{error}</Alert> : null}
              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  <ChevronRight className="size-4" /> مرحله قبل
                </Button>
                <Button onClick={goNext} disabled={!verified}>
                  ادامه <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <Card className="space-y-3">
                <h2 className="text-sm font-extrabold">خلاصهٔ رزرو</h2>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted">زمین</span><span className="font-bold">{court?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted">تاریخ</span><span className="font-bold">{formatShortDate(slot?.date ?? date)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">ساعت</span><span className="font-bold" dir="ltr">{timeLabel}</span></div>
                  <div className="flex justify-between"><span className="text-muted">مربی</span><span className="font-bold">{coach?.name ?? "بدون مربی"}</span></div>
                  <div className="flex justify-between"><span className="text-muted">مشتری</span><span className="font-bold">{name || "—"}</span></div>
                </div>

                {breakdown ? (
                  <div className="border-t border-line pt-3 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-muted">اجاره زمین {breakdown.peak ? "(ساعت پیک)" : ""}</span>
                      <span>{formatPrice(breakdown.courtTotal)}</span>
                    </div>
                    {breakdown.coachTotal > 0 ? (
                      <div className="flex justify-between py-1"><span className="text-muted">مربی</span><span>{formatPrice(breakdown.coachTotal)}</span></div>
                    ) : null}
                    {breakdown.equipmentLines.map((line) => (
                      <div key={line.label} className="flex justify-between py-1"><span className="text-muted">{line.label}</span><span>{formatPrice(line.amount)}</span></div>
                    ))}
                    {breakdown.discount > 0 ? (
                      <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400"><span>تخفیف پکیج</span><span>− {formatPrice(breakdown.discount)}</span></div>
                    ) : null}
                    <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-black"><span>مبلغ قابل پرداخت</span><span>{formatPrice(breakdown.total)}</span></div>
                  </div>
                ) : null}
              </Card>

              <Card className="space-y-4">
                {customerPackages.length > 0 ? (
                  <div>
                    <h2 className="text-sm font-extrabold">اعتبار پکیج</h2>
                    <p className="mt-1 text-[11px] text-muted">می‌توانی این سانس را از اعتبار پکیج کم کنی.</p>
                    <div className="mt-2 space-y-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-xs">
                        <input type="radio" name="package" checked={selectedPackage === null} onChange={() => setSelectedPackage(null)} />
                        پرداخت اینترنتی
                      </label>
                      {customerPackages.map((item) => (
                        <label key={item.record.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-line p-3 text-xs">
                          <input type="radio" name="package" checked={selectedPackage === item.record.packageId} onChange={() => setSelectedPackage(item.record.packageId)} />
                          <span>
                            <span className="block font-bold">{item.info.name}</span>
                            <span className="mt-0.5 block text-[11px] text-muted">{item.remaining} سانس باقی‌مانده · {item.info.discountPercent}٪ تخفیف</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h2 className="text-sm font-extrabold">پرداخت شبیه‌سازی‌شده</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <CalendarDays className="size-3.5" /> این پرداخت واقعی نیست و فقط برای نمایش است.
                  </p>
                  <Button className="mt-3 w-full" disabled={paying} onClick={pay}>
                    {paying ? "در حال پرداخت…" : "پرداخت و ثبت رزرو"}
                  </Button>
                  <p className="mt-2 text-center text-[10px] text-muted">
                    با ثبت رزرو، قوانین لغو باشگاه را می‌پذیرید: تا {siteConfig.booking.cancellation.freeUntilHours} ساعت قبل رایگان.
                  </p>
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}
                <Button variant="ghost" className="w-full" onClick={() => setStep(4)}>
                  <ChevronRight className="size-4" /> مرحله قبل
                </Button>
              </Card>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 text-center">
        <Link href="/" className="text-xs font-bold text-muted hover:text-foreground">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
