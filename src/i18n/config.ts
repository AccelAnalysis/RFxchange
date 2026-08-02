export const supportedLocales = ["en-US", "es", "fr", "it", "de"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en-US";
export const localeCookieName = "rfx-locale";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export const localeLabels: Readonly<Record<Locale, string>> = Object.freeze({
  "en-US": "English (US)",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  de: "Deutsch",
});

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  if (!value) {
    return defaultLocale;
  }

  if (isLocale(value)) {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("es")) {
    return "es";
  }

  if (normalized.startsWith("fr")) {
    return "fr";
  }

  if (normalized.startsWith("it")) {
    return "it";
  }

  if (normalized.startsWith("de")) {
    return "de";
  }

  if (normalized.startsWith("en")) {
    return "en-US";
  }

  return defaultLocale;
}
