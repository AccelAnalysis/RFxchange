import { cookies, headers } from "next/headers";
import { cache } from "react";

import {
  localeCookieName,
  resolveLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./get-dictionary";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const persistedLocale = cookieStore.get(localeCookieName)?.value;

  if (persistedLocale) {
    return resolveLocale(persistedLocale);
  }

  const headerStore = await headers();
  const preferredLanguage = headerStore
    .get("accept-language")
    ?.split(",", 1)[0];

  return resolveLocale(preferredLanguage);
});

export const getRequestDictionary = cache(async (): Promise<{
  locale: Locale;
  dictionary: Dictionary;
}> => {
  const locale = await getRequestLocale();

  return {
    locale,
    dictionary: getDictionary(locale),
  };
});
