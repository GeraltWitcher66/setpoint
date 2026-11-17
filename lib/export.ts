import * as XLSX from "xlsx";
import type { Booking, Coach, Court } from "@/lib/types";
import { todayISO } from "@/lib/mock/date-utils";
import { bookingStatusLabels, paymentMethodLabels, sourceLabels } from "@/lib/labels";

export function exportBookingsToExcel(
  bookings: Booking[],
  courts: Court[],
  coaches: Coach[],
): void {
  const rows = bookings.map((booking) => {
    const court = courts.find((item) => item.id === booking.courtId);
    const coach = coaches.find((item) => item.id === booking.coachId);

    return {
      "کد رزرو": booking.confirmationCode,
      تاریخ: booking.date,
      "ساعت شروع": booking.startTime,
      "ساعت پایان": booking.endTime,
      زمین: court?.name ?? booking.courtId,
      مشتری: booking.customerName,
      وضعیت: bookingStatusLabels[booking.status],
      منبع: sourceLabels[booking.source],
      مربی: coach?.name ?? "—",
      "مبلغ کل (تومان)": booking.total,
      تخفیف: booking.discount,
      "روش پرداخت": booking.paymentMethod
        ? paymentMethodLabels[booking.paymentMethod]
        : "—",
      یادداشت: booking.notes,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "رزروها");
  XLSX.writeFile(workbook, `setpoint-bookings-${todayISO()}.xlsx`);
}
