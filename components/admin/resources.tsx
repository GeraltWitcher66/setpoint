"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { updateDatabase } from "@/lib/mock/db";
import { useDatabase } from "@/lib/data/use-database";
import { createId } from "@/lib/id";
import { formatPrice } from "@/lib/currency";
import { coachLevelLabels } from "@/lib/labels";
import { todayISO } from "@/lib/mock/date-utils";

const sections = [
  { id: "courts", label: "زمین‌ها" },
  { id: "coaches", label: "مربی‌ها" },
  { id: "classes", label: "کلاس‌ها" },
  { id: "equipment", label: "تجهیزات" },
  { id: "packages", label: "پکیج‌ها" },
  { id: "pricing", label: "قوانین قیمت" },
  { id: "holidays", label: "تعطیلات" },
];

export function AdminResources() {
  const database = useDatabase();
  const [section, setSection] = useState("courts");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={
              section === item.id
                ? "shrink-0 rounded-full bg-brand-strong px-3.5 py-2 text-xs font-bold text-white"
                : "shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-bold text-muted"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}

      {section === "courts" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {database.courts.map((court) => (
            <Card key={court.id}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateDatabase((db) => {
                    const target = db.courts.find((item) => item.id === court.id);
                    if (!target) return;
                    target.name = String(data.get("name"));
                    target.basePricePerHour = Number(data.get("base"));
                    target.peakPricePerHour = Number(data.get("peak"));
                    target.status = String(data.get("status")) as "active" | "maintenance";
                  });
                  setMessage(`${court.name} به‌روزرسانی شد.`);
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{court.name}</h3>
                  <Badge className={court.status === "active" ? "border-brand/20 bg-brand/5 text-brand" : "border-amber-500/30 bg-amber-500/10 text-amber-700"}>
                    {court.status === "active" ? "فعال" : "در تعمیر"}
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="نام زمین">
                    <Input name="name" defaultValue={court.name} />
                  </Field>
                  <Field label="وضعیت">
                    <Select name="status" defaultValue={court.status}>
                      <option value="active">فعال</option>
                      <option value="maintenance">تعمیر</option>
                    </Select>
                  </Field>
                  <Field label="قیمت پایه (تومان)">
                    <Input name="base" type="number" step="10000" defaultValue={court.basePricePerHour} dir="ltr" />
                  </Field>
                  <Field label="قیمت پیک (تومان)">
                    <Input name="peak" type="number" step="10000" defaultValue={court.peakPricePerHour} dir="ltr" />
                  </Field>
                </div>
                <Button size="sm" type="submit">ذخیره</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "coaches" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {database.coaches.map((coach) => (
            <Card key={coach.id}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateDatabase((db) => {
                    const target = db.coaches.find((item) => item.id === coach.id);
                    if (!target) return;
                    target.name = String(data.get("name"));
                    target.pricePerSession = Number(data.get("price"));
                    target.active = String(data.get("active")) === "true";
                  });
                  setMessage(`${coach.name} به‌روزرسانی شد.`);
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{coach.name}</h3>
                  <Badge>{coachLevelLabels[coach.level]}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="نام">
                    <Input name="name" defaultValue={coach.name} />
                  </Field>
                  <Field label="قیمت جلسه (تومان)">
                    <Input name="price" type="number" step="10000" defaultValue={coach.pricePerSession} dir="ltr" />
                  </Field>
                  <Field label="فعال">
                    <Select name="active" defaultValue={String(coach.active)}>
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </Select>
                  </Field>
                </div>
                <p className="text-[10px] text-muted">{coach.email}</p>
                <Button size="sm" type="submit">ذخیره</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "classes" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {database.groupClasses.map((groupClass) => (
            <Card key={groupClass.id}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateDatabase((db) => {
                    const target = db.groupClasses.find((item) => item.id === groupClass.id);
                    if (!target) return;
                    target.name = String(data.get("name"));
                    target.pricePerSession = Number(data.get("price"));
                    target.capacity = Number(data.get("capacity"));
                  });
                  setMessage(`${groupClass.name} به‌روزرسانی شد.`);
                }}
                className="space-y-3"
              >
                <h3 className="text-sm font-extrabold">{groupClass.name}</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="نام کلاس">
                    <Input name="name" defaultValue={groupClass.name} />
                  </Field>
                  <Field label="قیمت جلسه">
                    <Input name="price" type="number" step="10000" defaultValue={groupClass.pricePerSession} dir="ltr" />
                  </Field>
                  <Field label="ظرفیت">
                    <Input name="capacity" type="number" defaultValue={groupClass.capacity} dir="ltr" />
                  </Field>
                </div>
                <p className="text-[10px] text-muted">
                  {groupClass.enrolledCustomerIds.length} شاگرد ثبت‌نام‌شده · {formatPrice(groupClass.pricePerSession)}
                </p>
                <Button size="sm" type="submit">ذخیره</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "equipment" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {database.equipment.map((item) => (
            <Card key={item.id}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateDatabase((db) => {
                    const target = db.equipment.find((equipment) => equipment.id === item.id);
                    if (!target) return;
                    target.stock = Number(data.get("stock"));
                    target.pricePerSession = Number(data.get("price"));
                  });
                  setMessage(`موجودی ${item.name} به‌روزرسانی شد.`);
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{item.name}</h3>
                  <Badge>{formatPrice(item.pricePerSession)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={`موجودی (${item.unitLabel})`}>
                    <Input name="stock" type="number" defaultValue={item.stock} dir="ltr" />
                  </Field>
                  <Field label="قیمت هر سانس">
                    <Input name="price" type="number" step="1000" defaultValue={item.pricePerSession} dir="ltr" />
                  </Field>
                </div>
                <Button size="sm" type="submit">ذخیره</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "packages" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {database.packages.map((pkg) => (
            <Card key={pkg.id}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateDatabase((db) => {
                    const target = db.packages.find((item) => item.id === pkg.id);
                    if (!target) return;
                    target.price = Number(data.get("price"));
                    target.sessions = Number(data.get("sessions"));
                    target.discountPercent = Number(data.get("discount"));
                  });
                  setMessage(`${pkg.name} به‌روزرسانی شد.`);
                }}
                className="space-y-3"
              >
                <h3 className="text-sm font-extrabold">{pkg.name}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="قیمت">
                    <Input name="price" type="number" step="50000" defaultValue={pkg.price} dir="ltr" />
                  </Field>
                  <Field label="تعداد جلسه">
                    <Input name="sessions" type="number" defaultValue={pkg.sessions} dir="ltr" />
                  </Field>
                  <Field label="تخفیف (٪)">
                    <Input name="discount" type="number" defaultValue={pkg.discountPercent} dir="ltr" />
                  </Field>
                </div>
                <Button size="sm" type="submit">ذخیره</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "pricing" ? (
        <div className="space-y-3">
          <Card>
            <h3 className="text-sm font-extrabold">قوانین قیمت و ساعت پیک</h3>
            <p className="mt-1 text-[11px] text-muted">
              هر قانون یک بازهٔ زمانی و ضریب دارد؛ اگر ساعت شروع رزرو داخل بازه باشد قیمت پیک اعمال می‌شود.
            </p>
            <div className="mt-3 space-y-3">
              {database.pricingRules.map((rule) => (
                <form
                  key={rule.id}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    updateDatabase((db) => {
                      const target = db.pricingRules.find((item) => item.id === rule.id);
                      if (!target) return;
                      target.startTime = String(data.get("start"));
                      target.endTime = String(data.get("end"));
                      target.multiplier = Number(data.get("multiplier"));
                      target.active = String(data.get("active")) === "true";
                    });
                    setMessage(`${rule.name} به‌روزرسانی شد.`);
                  }}
                  className="grid items-end gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]"
                >
                  <div>
                    <p className="text-xs font-bold">{rule.name}</p>
                    <p className="text-[10px] text-muted">{rule.days.map((day) => ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"][day]).join("، ")}</p>
                  </div>
                  <Field label="شروع">
                    <Input name="start" defaultValue={rule.startTime} dir="ltr" />
                  </Field>
                  <Field label="پایان">
                    <Input name="end" defaultValue={rule.endTime} dir="ltr" />
                  </Field>
                  <Field label="ضریب">
                    <Input name="multiplier" type="number" step="0.05" defaultValue={rule.multiplier} dir="ltr" />
                  </Field>
                  <Field label="فعال">
                    <Select name="active" defaultValue={String(rule.active)}>
                      <option value="true">بله</option>
                      <option value="false">خیر</option>
                    </Select>
                  </Field>
                  <Button size="sm" type="submit">ذخیره</Button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {section === "holidays" ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <h3 className="text-sm font-extrabold">تعطیلات و رویدادها</h3>
            <div className="mt-3 space-y-2">
              {database.holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-xs">
                  <div>
                    <p className="font-bold">{holiday.name}</p>
                    <p className="text-[10px] text-muted">{holiday.date} · {holiday.closed ? "تعطیل کامل" : "رویداد"}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => {
                      updateDatabase((db) => {
                        db.holidays = db.holidays.filter((item) => item.id !== holiday.id);
                      });
                      setMessage("تعطیلات حذف شد.");
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
            <h3 className="text-sm font-extrabold">افزودن تعطیلی</h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                updateDatabase((db) => {
                  db.holidays.push({
                    id: createId("holiday"),
                    date: String(data.get("date")) || todayISO(),
                    name: String(data.get("name")) || "تعطیلی",
                    closed: String(data.get("closed")) === "true",
                  });
                });
                setMessage("تعطیلی اضافه شد.");
              }}
              className="mt-3 space-y-3"
            >
              <Field label="عنوان">
                <Input name="name" placeholder="مثلاً تعطیلات رسمی" required />
              </Field>
              <Field label="تاریخ">
                <Input name="date" type="date" defaultValue={todayISO()} required />
              </Field>
              <Field label="نوع">
                <Select name="closed" defaultValue="true">
                  <option value="true">تعطیل کامل</option>
                  <option value="false">رویداد (باز است)</option>
                </Select>
              </Field>
              <Button size="sm" type="submit">افزودن</Button>
            </form>
          </Card>
        </div>
      ) : null}

      <p className="text-[10px] text-muted">
        تغییرات بلافاصله در جدول رزرو، قیمت‌گذاری و پنل‌های دیگر اعمال می‌شوند.
      </p>
    </div>
  );
}
