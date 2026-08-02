import { cookies, headers } from "next/headers";

import {
  localeCookieName,
  resolveLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./get-dictionary";

export async function getRequestLocale(): Promise<Locale> {
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
}

export async function getRequestDictionary(): Promise<{
  locale: Locale;
  dictionary: Dictionary;
}> {
  const locale = await getRequestLocale();

  return {
    locale,
    dictionary: getDictionary(locale),
  };
}
