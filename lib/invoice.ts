import { siteConfig } from "@/config/site";
import type { Booking, Court, Coach } from "@/lib/types";
import { formatFullDate } from "@/lib/mock/date-utils";
import { formatNumber, formatPrice } from "@/lib/currency";
import { paymentMethodLabels, sourceLabels } from "@/lib/labels";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens a printable invoice in a new tab. The browser print dialog also
 * offers "Save as PDF", so the invoice can be downloaded or printed.
 */
export function printInvoice(
  booking: Booking,
  court: Court | undefined,
  coach: Coach | undefined,
): boolean {
  const rows: Array<[string, string]> = [
    ["کد رزرو", booking.confirmationCode],
    ["تاریخ", formatFullDate(booking.date)],
    ["ساعت", `${booking.startTime} تا ${booking.endTime}`],
    ["زمین", court?.name ?? "—"],
    ["مربی", coach?.name ?? "—"],
    ["روش پرداخت", booking.paymentMethod ? paymentMethodLabels[booking.paymentMethod] : "—"],
    ["منبع رزرو", sourceLabels[booking.source]],
  ];

  const lines = [
    ["اجاره زمین", booking.subtotal - booking.coachTotal - booking.equipmentTotal],
    ["مربی", booking.coachTotal],
    ["تجهیزات", booking.equipmentTotal],
  ].filter(([, amount]) => Number(amount) > 0);

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاکتور ${escapeHtml(booking.confirmationCode)}</title>
<style>
  body { font-family: Tahoma, "Segoe UI", sans-serif; color: #0a1a11; margin: 0; padding: 32px; }
  .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #d9e5d3; border-radius: 18px; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #52665a; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0b3f2a; padding-bottom: 16px; margin-bottom: 20px; }
  .badge { background: #d9ff3f; color: #17260a; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 8px 0; border-bottom: 1px dashed #e2eadf; }
  td:first-child { color: #52665a; width: 40%; }
  .total { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 2px solid #0b3f2a; font-weight: 700; font-size: 16px; }
  .footer { margin-top: 28px; font-size: 11px; color: #52665a; text-align: center; }
  @media print { body { padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${escapeHtml(siteConfig.brand.name)} — فاکتور رزرو</h1>
        <div class="muted">${escapeHtml(siteConfig.club.address)}</div>
        <div class="muted">${escapeHtml(siteConfig.club.phone)}</div>
      </div>
      <span class="badge">${escapeHtml(booking.confirmationCode)}</span>
    </div>
    <table>
      ${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}
      <tr><td>مشتری</td><td>${escapeHtml(booking.customerName)}</td></tr>
      ${lines.map(([label, amount]) => `<tr><td>${escapeHtml(String(label))}</td><td>${formatNumber(Number(amount))} تومان</td></tr>`).join("")}
      ${
        booking.discount > 0
          ? `<tr><td>تخفیف</td><td>− ${formatPrice(booking.discount)}</td></tr>`
          : ""
      }
    </table>
    <div class="total"><span>مبلغ قابل پرداخت</span><span>${formatPrice(booking.total)}</span></div>
    <div class="footer">
      این فاکتور به‌صورت نمایشی صادر شده است. ${escapeHtml(siteConfig.brand.name)} — ${escapeHtml(siteConfig.club.city)}
    </div>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=820,height=900");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
