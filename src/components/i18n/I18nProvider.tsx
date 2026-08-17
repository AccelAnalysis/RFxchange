"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  mobileExchangeLocaleCatalog,
  mobileExchangeRecordActionLabel,
} from "@/src/application/participant/mobile-exchange-locale";
import type { Locale } from "@/src/i18n/config";
import type { Dictionary } from "@/src/i18n/get-dictionary";

type TranslationValues = Readonly<Record<string, string | number>>;

type I18nContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  t: (key: string, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readMessage(dictionary: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dictionary);
}

function interpolate(message: string, values?: TranslationValues): string {
  if (!values) return message;
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (token, key: string) => {
    const value = values[key];
    return value === undefined ? token : String(value);
  });
}

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dictionary,
      t: (key, values) => {
        const message = readMessage(dictionary, key);
        const mobileMessage = key.startsWith("mobileExchange.")
          ? readMessage(mobileExchangeLocaleCatalog(locale), key.slice("mobileExchange.".length))
          : mobileExchangeRecordActionLabel(locale, key);
        const resolved = typeof message === "string" ? message : mobileMessage;

        if (typeof resolved !== "string") {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`Missing translation string: ${key}`);
          }
          return key;
        }

        return interpolate(resolved, values);
      },
    }),
    [dictionary, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider.");
  return context;
}
