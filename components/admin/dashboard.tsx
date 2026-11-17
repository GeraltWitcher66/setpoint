"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, ProgressBar, StatCard } from "@/components/ui";
import { useDatabase } from "@/lib/data/use-database";
import {
  getDailyRevenue,
  getDemandHeatmap,
  getMonthRevenue,
  getOccupancyRate,
  getRevenueBreakdown,
  getTodayBookings,
  getTodayRevenue,
  getWeekRevenue,
  heatmapHours,
} from "@/lib/admin/stats";
import { formatNumber, formatPrice } from "@/lib/currency";
import { formatShortDate, todayISO, weekdayLabels } from "@/lib/mock/date-utils";
import { bookingStatusLabels } from "@/lib/labels";

const weekOrder = [6, 0, 1, 2, 3, 4, 5];

export function AdminDashboard() {
  const database = useDatabase();
  const today = todayISO();
  const todayBookings = getTodayBookings(database.bookings, today).filter(
    (booking) => booking.status !== "blocked",
  );

  const occupancy = getOccupancyRate(database.courts, database.bookings, today);
  const todayRevenue = getTodayRevenue(database.bookings, today);
  const weekRevenue = getWeekRevenue(database.bookings, today);
  const monthRevenue = getMonthRevenue(database.bookings, today);
  const daily = getDailyRevenue(database.bookings, 14, today);
  const heatmap = getDemandHeatmap(database.bookings);
  const breakdown = getRevenueBreakdown(database.bookings);
  const maxHeat = Math.max(1, ...heatmap.map((cell) => cell.count));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="رزروهای امروز"
          value={`${formatNumber(todayBookings.length)} رزرو`}
          hint={`${formatNumber(todayBookings.filter((booking) => booking.status === "confirmed").length)} تأییدشده`}
        />
        <StatCard
          label="درصد پر بودن امروز"
          value={`${formatNumber(occupancy)}٪`}
          hint={`${database.courts.length} زمین فعال`}
        />
        <StatCard label="درآمد امروز" value={formatPrice(todayRevenue)} hint={`هفته: ${formatPrice(weekRevenue)}`} />
        <StatCard label="درآمد ۳۰ روز" value={formatPrice(monthRevenue)} hint={`تجهیزات: ${formatPrice(breakdown.equipment)}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold">درآمد ۱۴ روز گذشته</h2>
              <p className="mt-0.5 text-[11px] text-muted">مجموع رزروهای تأییدشده و انجام‌شده</p>
            </div>
            <span className="text-xs font-bold text-brand">{formatPrice(daily.reduce((sum, day) => sum + day.revenue, 0))}</span>
          </div>
          <div className="mt-4 h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatPrice(Number(value)), "درآمد"]}
                />
                <Bar dataKey="revenue" fill="#16764b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-extrabold">درآمد به تفکیک خدمت</h2>
          <div className="mt-3 space-y-2.5 text-xs">
            {[
              ["اجاره زمین", breakdown.courts],
              ["جلسات مربی", breakdown.coaching],
              ["اجاره تجهیزات", breakdown.equipment],
              ["تخفیف‌ها", -breakdown.discounts],
            ].map(([label, amount]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-muted">{label}</span>
                <span className="font-bold">{formatPrice(Number(amount))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line pt-2.5 text-sm">
              <span className="font-bold">جمع کل</span>
              <span className="font-black text-brand">{formatPrice(breakdown.total)}</span>
            </div>
          </div>

          <h3 className="mt-5 text-xs font-extrabold">درصد پر بودن هر زمین (امروز)</h3>
          <div className="mt-3 space-y-3">
            {database.courts.map((court) => {
              const rate = getOccupancyRate([court], database.bookings, today);
              return (
                <div key={court.id}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold">{court.name}</span>
                    <span className="text-muted">{formatNumber(rate)}٪</span>
                  </div>
                  <ProgressBar value={rate} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold">ساعت‌های پرتقاضا</h2>
              <p className="mt-0.5 text-[11px] text-muted">تعداد رزروها بر اساس روز هفته و ساعت شروع</p>
            </div>
            <span className="text-[10px] text-muted">کمتر → بیشتر</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[54px_repeat(16,1fr)] gap-1" dir="ltr">
                <span />
                {heatmapHours.map((hour) => (
                  <span key={hour} className="text-center text-[8px] text-muted">
                    {hour}
                  </span>
                ))}
                {weekOrder.map((weekday) => (
                  <div key={weekday} className="contents">
                    <span className="flex items-center text-[10px] text-muted" dir="rtl">
                      {weekdayLabels[weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6]}
                    </span>
                    {heatmapHours.map((hour) => {
                      const cell = heatmap.find(
                        (item) => item.weekday === weekday && item.hour === hour,
                      );
                      const intensity = (cell?.count ?? 0) / maxHeat;
                      return (
                        <div
                          key={`${weekday}-${hour}`}
                          title={`${weekdayLabels[weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6]} ${hour}:00 — ${cell?.count ?? 0} رزرو`}
                          className="aspect-square rounded-[4px] border border-line/40"
                          style={{
                            backgroundColor:
                              intensity === 0
                                ? "var(--surface-2)"
                                : `color-mix(in srgb, #16764b ${Math.round(intensity * 90)}%, var(--surface-2))`,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-extrabold">رزروهای امروز</h2>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {todayBookings.length === 0 ? (
              <p className="text-xs text-muted">امروز رزروی ثبت نشده است.</p>
            ) : (
              todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-surface-2/40 px-3 py-2 text-[11px]"
                >
                  <div>
                    <p className="font-bold">{booking.customerName}</p>
                    <p className="text-muted">
                      {formatShortDate(booking.date)} · {booking.startTime} ·{" "}
                      {database.courts.find((court) => court.id === booking.courtId)?.name}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-brand">
                    {bookingStatusLabels[booking.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
