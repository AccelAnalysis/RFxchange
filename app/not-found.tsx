"use client";

import Link from "next/link";

import { useI18n } from "@/src/components/i18n/I18nProvider";

import styles from "./error.module.css";

export default function ApplicationNotFound() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="not-found-title">
        <p className={styles.eyebrow}>{t("recovery.notFoundEyebrow")}</p>
        <h1 id="not-found-title">{t("recovery.notFoundTitle")}</h1>
        <p className={styles.lede}>{t("recovery.notFoundBody")}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            {t("recovery.home")}
          </Link>
        </div>
      </section>
    </main>
  );
}
