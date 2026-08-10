"use client";

import { useI18n } from "@/src/components/i18n/I18nProvider";

import styles from "./error.module.css";

export default function ApplicationLoading() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.card} role="status" aria-live="polite" aria-labelledby="loading-title">
        <span className={styles.statusMark} aria-hidden="true" />
        <p className={styles.eyebrow}>{t("recovery.loadingEyebrow")}</p>
        <h1 id="loading-title">{t("recovery.loadingTitle")}</h1>
        <p className={styles.lede}>{t("recovery.loadingBody")}</p>
      </section>
    </main>
  );
}
