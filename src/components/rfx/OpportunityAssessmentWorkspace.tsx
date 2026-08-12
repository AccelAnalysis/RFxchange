"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OpportunityPursuitWorkspace } from "../../application/rfx/opportunity-pursuit-service";
import type { PursuitAssessment, PursuitAssessmentState, PursuitDecision } from "../../domain/rfx/pursuit";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import { useI18n } from "../i18n/I18nProvider";
import { StatusPill } from "../ui";
import styles from "./OpportunityAssessmentWorkspace.module.css";

const dimensions = ["fit", "eligibility", "capacity", "economics", "geography", "gaps"] as const;
const states: readonly PursuitAssessmentState[] = ["not-reviewed", "acceptable", "concern", "blocking", "needs-confirmation"];

function emptyAssessment(): PursuitAssessment {
  const item = () => ({ state: "not-reviewed" as const, note: "" });
  return { fit: item(), eligibility: item(), capacity: item(), economics: item(), geography: item(), gaps: item() };
}

export function OpportunityAssessmentWorkspace({ workspace, returnHref }: Readonly<{ workspace: OpportunityPursuitWorkspace; returnHref: string }>) {
  const { t } = useI18n();
  const router = useRouter();
  const [assessment, setAssessment] = useState<PursuitAssessment>(workspace.pursuit?.assessment ?? emptyAssessment());
  const [decision, setDecision] = useState<PursuitDecision>(workspace.pursuit?.decision ?? "watch");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(workspace.stale ? t("rfxWorkspace.discovery.pursuit.stale") : null);
  const explanation = workspace.explanation;

  function changeDimension(key: typeof dimensions[number], patch: Partial<PursuitAssessment[typeof key]>) {
    setAssessment((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  async function save(nextDecision: PursuitDecision) {
    setBusy(true); setNotice(null); setDecision(nextDecision);
    try {
      const response = await fetch("/api/opportunities/pursuit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commandId: crypto.randomUUID(), reference: explanation.opportunityReference, expectedVersion: workspace.pursuit?.version ?? null, expectedFitSnapshotId: workspace.fitSnapshotId, decision: nextDecision, assessment }) });
      if (!response.ok) throw new Error("save-failed");
      setNotice(t(`rfxWorkspace.discovery.pursuit.saved.${nextDecision}`));
      router.refresh();
    } catch { setNotice(t("rfxWorkspace.discovery.pursuit.error")); }
    finally { setBusy(false); }
  }

  return <ParticipantShell activeItem="opportunities-rfx">
    <OperationalWorkspace ariaLabel={t("rfxWorkspace.discovery.pursuit.ariaLabel")} className={styles.workspace}>
      <div data-opportunity-assessment-reference={explanation.opportunityReference}>
      <header className={styles.header}>
        <div><span>{t("rfxWorkspace.discovery.pursuit.eyebrow")}</span><h1>{t("rfxWorkspace.discovery.pursuit.title")}</h1><p>{t("rfxWorkspace.discovery.pursuit.intro")}</p></div>
        <Link href={returnHref}>{t("rfxWorkspace.discovery.pursuit.back")}</Link>
      </header>
      <section className={styles.truth} role="note"><strong>{t("rfxWorkspace.discovery.pursuit.boundaryTitle")}</strong><span>{t("rfxWorkspace.discovery.pursuit.boundaryBody")}</span></section>
      <div className={styles.attribution} aria-label={t("rfxWorkspace.discovery.pursuit.attributionLabel")}>
        {explanation.attribution.map((item) => <StatusPill key={item} tone={item === "potential-match" ? "positive" : "neutral"}>{t(`rfxWorkspace.discovery.pursuit.attribution.${item}`)}</StatusPill>)}
      </div>
      <section className={styles.facts}><h2>{t("rfxWorkspace.discovery.pursuit.facts")}</h2><dl><div><dt>{t("rfxWorkspace.discovery.pursuit.deadline")}</dt><dd>{explanation.publishedFacts.deadline}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.value")}</dt><dd>{explanation.publishedFacts.valueSummary}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.term")}</dt><dd>{explanation.publishedFacts.termSummary}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.location")}</dt><dd>{explanation.publishedFacts.locationSummary || t("rfxWorkspace.discovery.pursuit.noLocation")}</dd></div></dl></section>
      <section className={styles.requirements}><h2>{t("rfxWorkspace.discovery.pursuit.why")}</h2><div className={styles.table} role="table" aria-label={t("rfxWorkspace.discovery.pursuit.observations")}>
        {explanation.requirementObservations.map((item) => <article key={item.reference} role="row"><div><strong>{item.title}</strong><span>{item.level}</span></div><p>{item.description}</p><p><b>{t(`rfxWorkspace.discovery.pursuit.observation.${item.state}`)}</b>{item.alignedOrganizationCapabilities.length ? ` — ${item.alignedOrganizationCapabilities.join(", ")}` : ""}</p>{item.teamCoverageAllowed ? <small>{t("rfxWorkspace.discovery.pursuit.teamCoverage")}</small> : null}</article>)}
      </div></section>
      <section className={styles.gaps}><h2>{t("rfxWorkspace.discovery.pursuit.gaps")}</h2>{explanation.gaps.length ? <ul>{explanation.gaps.map((gap) => <li key={gap.reference}>{gap.title}: {t(`rfxWorkspace.discovery.pursuit.gapKind.${gap.kind}`)}</li>)}</ul> : <p>{t("rfxWorkspace.discovery.pursuit.noGaps")}</p>}</section>
      <section className={styles.assessment}><h2>{t("rfxWorkspace.discovery.pursuit.assessment")}</h2>{dimensions.map((key) => <fieldset key={key}><legend>{t(`rfxWorkspace.discovery.pursuit.dimension.${key}`)}</legend><label>{t("rfxWorkspace.discovery.pursuit.status")}<select value={assessment[key].state} onChange={(event) => changeDimension(key, { state: event.target.value as PursuitAssessmentState })}>{states.map((state) => <option key={state} value={state}>{t(`rfxWorkspace.discovery.pursuit.state.${state}`)}</option>)}</select></label><label>{t("rfxWorkspace.discovery.pursuit.note")}<textarea value={assessment[key].note} maxLength={600} onChange={(event) => changeDimension(key, { note: event.target.value })} /></label></fieldset>)}</section>
      <footer className={styles.actions}><div><span>{t("rfxWorkspace.discovery.pursuit.current")} <strong>{t(`rfxWorkspace.discovery.pursuit.${decision}`)}</strong></span>{notice ? <p role="status">{notice}</p> : null}{!workspace.canManage ? <p role="note">{t("rfxWorkspace.discovery.pursuit.managementUnavailable")}</p> : null}</div><div><button type="button" disabled={busy || !workspace.canManage} onClick={() => save("watch")}>{t("rfxWorkspace.discovery.pursuit.watch")}</button><button type="button" disabled={busy || !workspace.canManage} onClick={() => save("decline")}>{t("rfxWorkspace.discovery.pursuit.decline")}</button><button type="button" disabled={busy || !workspace.canManage} data-opportunity-pursue onClick={() => save("pursue")}>{t("rfxWorkspace.discovery.pursuit.pursue")}</button></div><small>{t("rfxWorkspace.discovery.pursuit.responseUnavailable")}</small></footer>
      </div>
    </OperationalWorkspace>
  </ParticipantShell>;
}
