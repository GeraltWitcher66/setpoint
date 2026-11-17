import type {
  BlockReason,
  BookingSource,
  BookingStatus,
  ClassLevel,
  CoachLevel,
  CourtSurface,
  EquipmentCategory,
  PaymentMethod,
  WaitlistStatus,
} from "@/lib/types";

export const bookingStatusLabels: Record<BookingStatus, string> = {
  confirmed: "تأییدشده",
  completed: "انجام‌شده",
  "no-show": "غیبت",
  cancelled: "لغوشده",
  blocked: "مسدود",
};

export const bookingStatusStyles: Record<BookingStatus, string> = {
  confirmed: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  "no-show": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
  blocked: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
};

export const sourceLabels: Record<BookingSource, string> = {
  online: "آنلاین",
  "walk-in": "حضوری",
  phone: "تلفنی",
  admin: "مدیر",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  online: "آنلاین",
  cash: "نقدی",
  package: "پکیج",
};

export const blockReasonLabels: Record<BlockReason, string> = {
  maintenance: "تعمیر و نگهداری",
  tournament: "مسابقه",
  rain: "باران",
  other: "سایر",
};

export const waitlistStatusLabels: Record<WaitlistStatus, string> = {
  waiting: "در انتظار",
  offered: "پیشنهاد شده",
  converted: "تبدیل به رزرو",
  expired: "منقضی",
};

export const surfaceLabels: Record<CourtSurface, string> = {
  hard: "هارد",
  clay: "خاک رس",
  artificial: "چمن مصنوعی",
};

export const coachLevelLabels: Record<CoachLevel, string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
  pro: "حرفه‌ای",
};

export const classLevelLabels: Record<ClassLevel, string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  racket: "راکت",
  ball: "توپ",
  machine: "دستگاه",
  accessory: "لوازم",
};
