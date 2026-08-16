"use client";

import Link from "next/link";

import type { OpportunityPursuitError } from "../../application/rfx/opportunity-pursuit-service";
import { useI18n } from "../i18n/I18nProvider";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./OpportunityAssessmentWorkspace.module.css";

export function OpportunityAssessmentUnavailable({ errorCode, returnHref, retryHref }: Readonly<{
  errorCode: OpportunityPursuitError["code"];
  returnHref: string;
  retryHref: string;
}>) {
  const { t } = useI18n();
  const dependencyUnavailable = errorCode === "dependency-unavailable";
  return <ParticipantShell activeItem="opportunities-rfx">
    <OperationalWorkspace ariaLabel={t("rfxWorkspace.pursuitUnavailable.ariaLabel")} className={styles.workspace}>
      <section className={styles.unavailable} data-opportunity-assessment-unavailable={errorCode}>
        <h1>{t(`rfxWorkspace.pursuitUnavailable.${dependencyUnavailable ? "dependencyTitle" : "title"}`)}</h1>
        <p>{t(`rfxWorkspace.pursuitUnavailable.${dependencyUnavailable ? "dependencyBody" : "body"}`)}</p>
        <nav className={styles.unavailableActions} aria-label={t("rfxWorkspace.pursuitUnavailable.actionsLabel")}>
          <Link href={returnHref}>{t("rfxWorkspace.pursuitUnavailable.back")}</Link>
          {dependencyUnavailable ? <Link href={retryHref}>{t("rfxWorkspace.pursuitUnavailable.retry")}</Link> : null}
        </nav>
      </section>
    </OperationalWorkspace>
  </ParticipantShell>;
}
