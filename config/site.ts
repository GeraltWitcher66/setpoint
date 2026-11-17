export type CurrencyCode = "IRT" | "AED" | "TRY";

export interface CurrencySetting {
  code: CurrencyCode;
  /** Label shown next to prices. */
  label: string;
  /** How many Toman one unit of this currency is worth. */
  tomanPerUnit: number;
  fractionDigits: number;
}

/**
 * Everything specific to this club lives here so a new client
 * (padel, squash, futsal…) only needs to edit this file.
 * Prices in the demo data are stored in Toman and converted
 * through `currency.tomanPerUnit` at display time.
 */
export const siteConfig = {
  brand: {
    name: "ست‌پوینت",
    latinName: "SetPoint",
    tagline: "باشگاه تنیس",
  },
  club: {
    city: "تهران",
    address: "تهران، خیابان ولیعصر، انتهای پارک ورزشی، باشگاه ست‌پوینت",
    phone: "۰۲۱-۸۸۷۶۵۴۳۲",
    email: "hello@setpoint.demo",
    timezone: "Asia/Tehran",
  },
  theme: {
    primary: "#16764b",
    accent: "#d9ff3f",
  },
  courtCount: 4,
  currency: {
    code: "IRT",
    label: "تومان",
    tomanPerUnit: 1,
    fractionDigits: 0,
  } satisfies CurrencySetting,
  booking: {
    openTime: "07:00",
    closeTime: "23:00",
    slotMinutes: 60,
    maxAdvanceDays: 14,
    minLeadMinutes: 60,
    smsCodeLength: 4,
    cancellation: {
      freeUntilHours: 24,
      lateFeePercent: 50,
    },
  },
  demoAccounts: {
    customer: { phone: "09120000000", code: "1234", name: "سارا احمدی" },
    admin: { email: "admin@demo.test", password: "password", name: "مدیر باشگاه" },
    coach: { email: "coach@demo.test", password: "password", name: "آرش رضایی" },
  },
};

export type SiteConfig = typeof siteConfig;
