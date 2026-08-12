"use client";

import type {
  ResponderOpportunityPayload,
  RfxPublicationAudience,
} from "../../domain/rfx/publication";
import { useI18n } from "../i18n/I18nProvider";

import styles from "../../../app/opportunities/[reference]/page.module.css";

export function PublicOpportunityView({
  opportunity,
}: Readonly<{
  opportunity: Readonly<{
    reference: string;
    audience: RfxPublicationAudience;
    digest: string;
    payload: ResponderOpportunityPayload;
  }>;
}>) {
  const { t } = useI18n();
  const { payload } = opportunity;
  return (
    <>
      <section className={styles.hero} aria-labelledby="opportunity-title" data-publication-digest={opportunity.digest}>
        <div className={styles.context}>
          <p className={styles.eyebrow}>{t("rfxWorkspace.publicOpportunity")}</p>
          <p className={styles.availability}>{t("rfxWorkspace.publishedState")}</p>
          <h1 id="opportunity-title">{payload.title}</h1>
          <p className={styles.summary}>{payload.summary}</p>
          {opportunity.audience === "public" ? (
            <form action="/api/acquisition/start" method="post">
              <input type="hidden" name="opportunityReference" value={opportunity.reference} />
              <button type="submit">{t("rfxWorkspace.continueOpportunity")}</button>
            </form>
          ) : null}
          <p className={styles.joinNote}>{t("rfxWorkspace.shareAuthorityBoundary")}</p>
        </div>
        <aside className={styles.details} aria-label={t("rfxWorkspace.publicOpportunityDetails")}>
          <span>{t("rfxWorkspace.issuedBy")}</span>
          <strong>{payload.issuerDisplayName}</strong>
          <span>{t("rfxWorkspace.geography")}</span>
          <strong>{payload.localities.map((item) => item.label).join(", ")}</strong>
          <span>{t("rfxWorkspace.responseDeadline")}</span>
          <strong>{payload.timing.responseDeadline ?? t("rfxWorkspace.notDisclosed")}</strong>
          <span>{t("rfxWorkspace.responderRequirements")}</span>
          <ul>{payload.requirements.map((item, index) => <li key={`${item.title}:${index}`}>{item.title}</li>)}</ul>
          <small>{t("rfxWorkspace.authoritativePublication")}</small>
        </aside>
      </section>
      <section className={styles.boundary} aria-labelledby="public-boundary-title">
        <p className={styles.eyebrow}>{t("rfxWorkspace.publicBoundary")}</p>
        <h2 id="public-boundary-title">{t("rfxWorkspace.publicBoundaryTitle")}</h2>
        <p>{t("rfxWorkspace.publicBoundaryBody")}</p>
        <div className={styles.publicationDetails}>
          <section>
            <h3>{t("rfxWorkspace.responseStructure")}</h3>
            <ol>{payload.responseSections.map((item, index) => <li key={`${item.title}:${index}`}><strong>{item.title}</strong><span>{item.instructions}</span></li>)}</ol>
          </section>
          <section>
            <h3>{t("rfxWorkspace.evaluationMethod")}</h3>
            <p>{payload.evaluation.methodLabel ?? t("rfxWorkspace.notDisclosed")}</p>
            <ul>{payload.evaluation.factors.map((item, index) => <li key={`${item.title}:${index}`}>{item.title}{item.weightBasisPoints === null ? "" : ` — ${item.weightBasisPoints / 100}%`}</li>)}</ul>
          </section>
        </div>
      </section>
    </>
  );
}
