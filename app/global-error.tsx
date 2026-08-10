"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import de from "@/src/i18n/messages/recovery/de.json";
import enUs from "@/src/i18n/messages/recovery/en-US.json";
import es from "@/src/i18n/messages/recovery/es.json";
import fr from "@/src/i18n/messages/recovery/fr.json";
import it from "@/src/i18n/messages/recovery/it.json";

import styles from "./error.module.css";

const dictionaries = { "en-US": enUs, es, fr, it, de } as const;
type RecoveryLocale = keyof typeof dictionaries;

function browserLocale(): RecoveryLocale {
  const language = navigator.language.toLowerCase();
  if (language.startsWith("es")) return "es";
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("it")) return "it";
  if (language.startsWith("de")) return "de";
  return "en-US";
}

function subscribe() {
  return () => undefined;
}

interface GlobalApplicationErrorProps {
  readonly error: Error & Readonly<{ digest?: string }>;
  readonly reset: () => void;
}

export default function GlobalApplicationError({ error, reset }: GlobalApplicationErrorProps) {
  const locale = useSyncExternalStore(subscribe, browserLocale, () => "en-US" as const);
  const copy = dictionaries[locale];

  return (
    <html lang={locale}>
      <body className={styles.globalBody}>
        <main className={styles.page}>
          <section className={styles.card} role="alert" aria-labelledby="global-error-title">
            <p className={styles.eyebrow}>{copy.globalEyebrow}</p>
            <h1 id="global-error-title">{copy.globalTitle}</h1>
            <p className={styles.lede}>{copy.globalBody}</p>
            <div className={styles.actions}>
              <button className={styles.primary} type="button" onClick={reset}>
                {copy.retry}
              </button>
              <Link className={styles.secondary} href="/">
                {copy.home}
              </Link>
            </div>
            {error.digest ? (
              <p className={styles.reference}>
                {copy.supportReference.replace("{reference}", error.digest)}
              </p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
