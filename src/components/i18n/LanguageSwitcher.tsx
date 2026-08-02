"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  localeCookieMaxAge,
  localeCookieName,
  localeLabels,
  supportedLocales,
  type Locale,
} from "@/src/i18n/config";

import { useI18n } from "./I18nProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: Locale) {
    document.cookie = [
      `${localeCookieName}=${encodeURIComponent(nextLocale)}`,
      "Path=/",
      `Max-Age=${localeCookieMaxAge}`,
      "SameSite=Lax",
    ].join("; ");

    document.documentElement.lang = nextLocale;

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>{t("common.languageSelector.label")}</span>
      <select
        aria-label={t("common.languageSelector.label")}
        className={styles.select}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        value={locale}
      >
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {localeLabels[supportedLocale]}
          </option>
        ))}
      </select>
      <span aria-live="polite" className={styles.status}>
        {isPending ? t("common.languageSelector.saving") : ""}
      </span>
    </label>
  );
}
