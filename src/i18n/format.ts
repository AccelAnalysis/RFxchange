import type { Locale } from "./config";

export function formatDate(
  locale: Locale,
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(
  locale: Locale,
  value: number,
  currency: string,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
): string {
  return new Intl.NumberFormat(locale, {
    ...options,
    style: "currency",
    currency,
  }).format(value);
}

export function currencyValueFromMinorUnits(
  locale: Locale,
  amountMinor: number,
  currency: string,
): number {
  const exponent = new Intl.NumberFormat(locale, { style: "currency", currency })
    .resolvedOptions().maximumFractionDigits ?? 2;
  return amountMinor / (10 ** exponent);
}

export function formatPercent(
  locale: Locale,
  value: number,
  options?: Omit<Intl.NumberFormatOptions, "style">,
): string {
  return new Intl.NumberFormat(locale, {
    ...options,
    style: "percent",
  }).format(value);
}

export function formatRelativeTime(
  locale: Locale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options: Intl.RelativeTimeFormatOptions = { numeric: "auto" },
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}
