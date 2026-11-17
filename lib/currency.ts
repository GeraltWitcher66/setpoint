import { siteConfig } from "@/config/site";

/** Converts a Toman amount into the configured display currency. */
export function toDisplayAmount(toman: number): number {
  return toman / siteConfig.currency.tomanPerUnit;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

/** Formats a Toman amount in the configured currency, e.g. «۴۸۰٬۰۰۰ تومان». */
export function formatPrice(toman: number): string {
  const { currency } = siteConfig;
  const value = toDisplayAmount(toman);
  const amount = new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: currency.fractionDigits,
    maximumFractionDigits: currency.fractionDigits,
  }).format(value);

  return `${amount} ${currency.label}`;
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}٪`;
}
