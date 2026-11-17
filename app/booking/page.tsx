import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/wizard";

export const metadata = {
  title: "رزرو آنلاین | ست‌پوینت",
};

function BookingFallback() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 text-center text-sm text-muted">
      در حال بارگذاری جدول رزرو…
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingWizard />
    </Suspense>
  );
}
