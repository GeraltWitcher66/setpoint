import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-20">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <Logo className="size-14 rounded-3xl" />
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
          ۴۰۴
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">صفحه پیدا نشد</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است.
        </p>
        <Link
          href="/"
          className="mt-7 rounded-full bg-brand-strong px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
