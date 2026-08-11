"use client";

import { useI18n } from "../i18n/I18nProvider";

import styles from "./ParticipantContentLoading.module.css";

export type ParticipantLoadingTarget =
  | "intelligence"
  | "resources"
  | "referrals"
  | "account"
  | "quick-start"
  | "provider-application"
  | "exchange-entry";

const COPY_KEYS = Object.freeze({
  intelligence: Object.freeze({
    title: "participantNavigation.loadingIntelligenceTitle" as const,
    body: "participantNavigation.loadingIntelligenceBody" as const,
  }),
  resources: Object.freeze({
    title: "participantNavigation.loadingResourcesTitle" as const,
    body: "participantNavigation.loadingResourcesBody" as const,
  }),
  referrals: Object.freeze({
    title: "participantNavigation.loadingReferralsTitle" as const,
    body: "participantNavigation.loadingReferralsBody" as const,
  }),
  account: Object.freeze({
    title: "participantNavigation.loadingAccountTitle" as const,
    body: "participantNavigation.loadingAccountBody" as const,
  }),
  "quick-start": Object.freeze({
    title: "participantNavigation.loadingQuickStartTitle" as const,
    body: "participantNavigation.loadingQuickStartBody" as const,
  }),
  "provider-application": Object.freeze({
    title: "participantNavigation.loadingProviderTitle" as const,
    body: "participantNavigation.loadingProviderBody" as const,
  }),
  "exchange-entry": Object.freeze({
    title: "participantNavigation.loadingExchangeTitle" as const,
    body: "participantNavigation.loadingExchangeBody" as const,
  }),
});

/** A route-segment fallback that replaces only the pending content region, never the Exchange shell. */
export function ParticipantContentLoading({
  target,
}: Readonly<{ target: ParticipantLoadingTarget }>) {
  const { t } = useI18n();
  const copy = COPY_KEYS[target];
  const title = t(copy.title);

  return (
    <main
      className={styles.region}
      data-participant-content-loading={target}
      aria-label={title}
    >
      <section
        className={styles.status}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-atomic="true"
      >
        <span className={styles.spinner} aria-hidden="true" />
        <div>
          <p className={styles.eyebrow}>{t("participantNavigation.loadingEyebrow")}</p>
          <h1>{title}</h1>
          <p className={styles.body}>{t(copy.body)}</p>
        </div>
      </section>
    </main>
  );
}
