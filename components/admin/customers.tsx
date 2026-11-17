"use client";

import { History, Search, UserCog } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import { useDatabase } from "@/lib/data/use-database";
import { patchCustomer } from "@/lib/data/store";
import { formatPrice } from "@/lib/currency";
import { formatShortDate, todayISO } from "@/lib/mock/date-utils";
import { bookingStatusLabels } from "@/lib/labels";
import type { Customer } from "@/lib/types";

export function AdminCustomers() {
  const database = useDatabase();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim();
    return database.customers
      .filter(
        (customer) =>
          !term ||
          customer.name.includes(term) ||
          customer.phone.includes(term) ||
          customer.email?.includes(term),
      )
      .map((customer) => {
        const bookings = database.bookings.filter(
          (booking) => booking.customerId === customer.id,
        );
        const spent = bookings
          .filter(
            (booking) =>
              booking.status === "completed" || booking.status === "confirmed",
          )
          .reduce((sum, booking) => sum + booking.total, 0);
        const last = [...bookings].sort((a, b) =>
          b.date.localeCompare(a.date),
        )[0];
        return { customer, count: bookings.length, spent, last };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [database, search]);

  const history = historyCustomer
    ? database.bookings
        .filter((booking) => booking.customerId === historyCustomer.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-4">
      {message ? <Alert tone="success">{message}</Alert> : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold">مشتری‌ها</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {database.customers.length} مشتری ثبت‌شده
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجوی نام یا شماره…"
              className="pr-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-right text-[11px]">
            <thead className="bg-surface-2 text-[10px] text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">مشتری</th>
                <th className="px-3 py-2 font-semibold">شماره</th>
                <th className="px-3 py-2 font-semibold">رزروها</th>
                <th className="px-3 py-2 font-semibold">مجموع خرید</th>
                <th className="px-3 py-2 font-semibold">اعتبار</th>
                <th className="px-3 py-2 font-semibold">وضعیت</th>
                <th className="px-3 py-2 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, count, spent, last }) => (
                <tr key={customer.id} className="border-t border-line/60">
                  <td className="px-3 py-2">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-[10px] text-muted">عضو از {formatShortDate(customer.joinedAt)}</p>
                  </td>
                  <td className="px-3 py-2" dir="ltr">{customer.phone}</td>
                  <td className="px-3 py-2">
                    {count}
                    {last ? <span className="block text-[9px] text-muted">آخرین: {formatShortDate(last.date)}</span> : null}
                  </td>
                  <td className="px-3 py-2 font-semibold">{formatPrice(spent)}</td>
                  <td className="px-3 py-2">{formatPrice(customer.credit)}</td>
                  <td className="px-3 py-2">
                    {customer.blocked ? (
                      <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300">مسدود</Badge>
                    ) : (
                      <Badge className="border-brand/20 bg-brand/5 text-brand">فعال</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(customer)}>
                        <UserCog className="size-3" /> ویرایش
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryCustomer(customer)}>
                        <History className="size-3" /> سابقه
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="ویرایش مشتری">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              patchCustomer(editing.id, {
                notes: String(data.get("notes")),
                credit: Number(data.get("credit")),
                blocked: String(data.get("blocked")) === "true",
                blockedReason:
                  String(data.get("blocked")) === "true"
                    ? String(data.get("reason")) || "مسدود توسط مدیر"
                    : null,
              });
              setMessage(`اطلاعات ${editing.name} ذخیره شد.`);
              setEditing(null);
            }}
            className="space-y-3"
          >
            <div>
              <p className="text-sm font-bold">{editing.name}</p>
              <p className="text-[11px] text-muted" dir="ltr">{editing.phone}</p>
            </div>
            <Field label="اعتبار (تومان)">
              <Input name="credit" type="number" step="10000" defaultValue={editing.credit} dir="ltr" />
            </Field>
            <Field label="یادداشت پذیرش">
              <Textarea name="notes" rows={3} defaultValue={editing.notes} placeholder="ترجیحات مشتری، هشدارها…" />
            </Field>
            <Field label="وضعیت حساب">
              <Select name="blocked" defaultValue={String(editing.blocked)}>
                <option value="false">فعال</option>
                <option value="true">مسدود</option>
              </Select>
            </Field>
            <Field label="دلیل مسدودی">
              <Input name="reason" defaultValue={editing.blockedReason ?? ""} placeholder="مثلاً بدهی پرداخت‌نشده" />
            </Field>
            <Button type="submit">ذخیره تغییرات</Button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(historyCustomer)}
        onClose={() => setHistoryCustomer(null)}
        title={`سابقهٔ ${historyCustomer?.name ?? ""}`}
        wide
      >
        {history.length === 0 ? (
          <EmptyState title="سابقه‌ای ثبت نشده" />
        ) : (
          <div className="space-y-2">
            {history.map((booking) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-[11px]">
                <div>
                  <p className="font-bold">
                    {database.courts.find((court) => court.id === booking.courtId)?.name}
                  </p>
                  <p className="text-[10px] text-muted">
                    {formatShortDate(booking.date)} · {booking.startTime} تا {booking.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{bookingStatusLabels[booking.status]}</Badge>
                  <span className="font-semibold">{formatPrice(booking.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <p className="text-[10px] text-muted">آخرین به‌روزرسانی داده‌ها: {formatShortDate(todayISO())}</p>
    </div>
  );
}
