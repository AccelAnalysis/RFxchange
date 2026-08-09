"use client";

import Link from "next/link";

import { useI18n } from "@/src/components/i18n/I18nProvider";

import styles from "./error.module.css";

interface ApplicationErrorBoundaryProps {
  readonly error: Error & Readonly<{ digest?: string }>;
  readonly reset: () => void;
}

/**
 * Root recovery boundary for unexpected render failures, including protected-route dependency
 * failures. The copy remains generic because public and authenticated routes share this boundary.
 * Server details stay in secured logs; UI exposes only an optional opaque Next.js support digest.
 */
export default function ApplicationErrorBoundary({
  error,
  reset,
}: ApplicationErrorBoundaryProps) {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="recovery-title">
        <p className={styles.eyebrow}>{t("recovery.eyebrow")}</p>
        <h1 id="recovery-title">{t("recovery.title")}</h1>
        <p className={styles.lede}>{t("recovery.lede")}</p>
        <p className={styles.supporting}>{t("recovery.supporting")}</p>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={reset}>
            {t("recovery.retry")}
          </button>
          <Link className={styles.secondary} href="/">
            {t("recovery.home")}
          </Link>
        </div>
        {error.digest ? (
          <p className={styles.reference}>
            {t("recovery.supportReference", { reference: error.digest })}
          </p>
        ) : null}
      </section>
    </main>
  );
}
