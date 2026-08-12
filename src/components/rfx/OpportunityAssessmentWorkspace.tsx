"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OpportunityPursuitWorkspace, ParticipantOpportunityPursuit } from "../../application/rfx/opportunity-pursuit-service";
import type { EngagementTerm, EstimatedValue, StructuredDuration } from "../../domain/rfx/model";
import type { ParticipantGapStatus, PursuitAssessment, PursuitAssessmentState, PursuitDecision } from "../../domain/rfx/pursuit";
import type { Locale } from "../../i18n/config";
import { currencyValueFromMinorUnits, formatCurrency, formatDate, formatNumber } from "../../i18n/format";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import { useI18n } from "../i18n/I18nProvider";
import { StatusPill } from "../ui";
import styles from "./OpportunityAssessmentWorkspace.module.css";

const dimensions = ["fit", "eligibility", "capacity", "economics", "geography", "gaps"] as const;
const states: readonly PursuitAssessmentState[] = ["not-reviewed", "acceptable", "concern", "blocking", "needs-confirmation"];
const gapStatuses: readonly ParticipantGapStatus[] = ["open", "acknowledged", "deferred"];
const durationUnits: Readonly<Record<StructuredDuration["unit"], string>> = Object.freeze({ days: "day", weeks: "week", months: "month", years: "year" });
type Translate = ReturnType<typeof useI18n>["t"];

function emptyAssessment(): PursuitAssessment {
  const item = () => ({ state: "not-reviewed" as const, note: "" });
  return { fit: item(), eligibility: item(), capacity: item(), economics: item(), geography: item(), gaps: item() };
}

function durationLabel(duration: StructuredDuration, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "unit", unit: durationUnits[duration.unit], unitDisplay: "long" }).format(duration.value);
}

function estimatedValueLabel(value: EstimatedValue, locale: Locale, t: Translate): string {
  if (value.mode === "not-disclosed") return t("rfxWorkspace.pursuitFormat.valueNotDisclosed");
  if (value.mode === "exact") return formatCurrency(locale, currencyValueFromMinorUnits(locale, value.amountMinor, value.currency), value.currency);
  return t("rfxWorkspace.pursuitFormat.valueRange", {
    minimum: formatCurrency(locale, currencyValueFromMinorUnits(locale, value.minimumMinor, value.currency), value.currency),
    maximum: formatCurrency(locale, currencyValueFromMinorUnits(locale, value.maximumMinor, value.currency), value.currency),
  });
}

function engagementTermLabel(term: EngagementTerm, locale: Locale, t: Translate): string {
  if (term.mode === "ongoing") return t("rfxWorkspace.pursuitFormat.termOngoing");
  if (term.mode === "milestone-based") return t("rfxWorkspace.pursuitFormat.termMilestoneBased");
  if (term.mode === "fixed") return durationLabel(term.duration, locale);
  return t(`rfxWorkspace.pursuitFormat.${term.optionCount === 1 ? "termFixedWithOption" : "termFixedWithOptions"}`, {
    base: durationLabel(term.baseDuration, locale),
    count: formatNumber(locale, term.optionCount),
    option: durationLabel(term.optionDuration, locale),
  });
}

export function OpportunityAssessmentWorkspace({ workspace, returnHref }: Readonly<{ workspace: OpportunityPursuitWorkspace; returnHref: string }>) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [assessment, setAssessment] = useState<PursuitAssessment>(workspace.pursuit?.assessment ?? emptyAssessment());
  const [currentPursuit, setCurrentPursuit] = useState<ParticipantOpportunityPursuit | null>(workspace.pursuit);
  const [gapResolutions, setGapResolutions] = useState<Readonly<Record<string, ParticipantGapStatus>>>(() => Object.freeze(Object.fromEntries(workspace.gaps.filter((gap) => gap.current).map((gap) => [gap.reference, gap.status as ParticipantGapStatus]))));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(workspace.stale ? t("rfxWorkspace.discovery.pursuit.stale") : null);
  const explanation = workspace.explanation;

  function changeDimension(key: typeof dimensions[number], patch: Partial<PursuitAssessment[typeof key]>) {
    setAssessment((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  async function save(nextDecision: PursuitDecision) {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/opportunities/pursuit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commandId: crypto.randomUUID(), reference: explanation.opportunityReference, expectedVersion: currentPursuit?.version ?? null, expectedFitSnapshotId: workspace.fitSnapshotId, decision: nextDecision, assessment, gapResolutions }) });
      if (!response.ok) throw new Error("save-failed");
      const result = await response.json() as Readonly<{ pursuit?: ParticipantOpportunityPursuit }>;
      if (!result.pursuit || result.pursuit.decision !== nextDecision) throw new Error("save-result-invalid");
      setCurrentPursuit(result.pursuit);
      setAssessment(result.pursuit.assessment);
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
      <section className={styles.facts}><h2>{t("rfxWorkspace.discovery.pursuit.facts")}</h2><dl><div><dt>{t("rfxWorkspace.discovery.pursuit.deadline")}</dt><dd>{explanation.publishedFacts.deadline ? formatDate(locale, explanation.publishedFacts.deadline, { dateStyle: "medium", timeZone: "UTC" }) : "—"}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.value")}</dt><dd>{estimatedValueLabel(explanation.publishedFacts.estimatedValue, locale, t)}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.term")}</dt><dd>{engagementTermLabel(explanation.publishedFacts.engagementTerm, locale, t)}</dd></div><div><dt>{t("rfxWorkspace.discovery.pursuit.location")}</dt><dd>{explanation.publishedFacts.locationSummary || t("rfxWorkspace.discovery.pursuit.noLocation")}</dd></div><div data-opportunity-geography-observation={explanation.geographyObservation}><dt>{t("rfxWorkspace.pursuitGeography.label")}</dt><dd>{t(`rfxWorkspace.pursuitGeography.${explanation.geographyObservation}`)}</dd></div></dl></section>
      <section className={styles.requirements}><h2>{t("rfxWorkspace.discovery.pursuit.why")}</h2><div className={styles.table} role="list" aria-label={t("rfxWorkspace.discovery.pursuit.observations")}>
        {explanation.requirementObservations.map((item) => <article key={item.reference} role="listitem"><div><strong>{item.title}</strong><span>{t(`rfxWorkspace.${item.level}`)}</span></div><p>{item.description}</p><p><b>{t(`rfxWorkspace.discovery.pursuit.observation.${item.state}`)}</b>{item.alignedOrganizationCapabilities.length ? ` — ${item.alignedOrganizationCapabilities.join(", ")}` : ""}</p>{item.teamCoverageAllowed ? <small>{t("rfxWorkspace.discovery.pursuit.teamCoverage")}</small> : null}</article>)}
      </div></section>
      <section className={styles.gaps}><h2>{t("rfxWorkspace.discovery.pursuit.gaps")}</h2>{workspace.gaps.length ? <ul className={styles.gapList}>{workspace.gaps.map((gap) => <li key={gap.reference} data-opportunity-gap-reference={gap.reference} data-opportunity-gap-status={gap.status}><div><strong>{gap.title}</strong><span>{t(`rfxWorkspace.discovery.pursuit.gapKind.${gap.kind}`)}</span></div>{gap.current && workspace.canManage ? <label>{t("rfxWorkspace.pursuitGapStatus.label")}<select value={gapResolutions[gap.reference] ?? "open"} onChange={(event) => setGapResolutions((current) => Object.freeze({ ...current, [gap.reference]: event.target.value as ParticipantGapStatus }))}>{gapStatuses.map((status) => <option key={status} value={status}>{t(`rfxWorkspace.pursuitGapStatus.${status}`)}</option>)}</select></label> : <span>{t(`rfxWorkspace.pursuitGapStatus.${gap.status}`)}</span>}</li>)}</ul> : <p>{t("rfxWorkspace.discovery.pursuit.noGaps")}</p>}</section>
      <section className={styles.assessment}><h2>{t("rfxWorkspace.discovery.pursuit.assessment")}</h2>{dimensions.map((key) => <fieldset key={key}><legend>{t(`rfxWorkspace.discovery.pursuit.dimension.${key}`)}</legend><label>{t("rfxWorkspace.discovery.pursuit.status")}<select value={assessment[key].state} onChange={(event) => changeDimension(key, { state: event.target.value as PursuitAssessmentState })}>{states.map((state) => <option key={state} value={state}>{t(`rfxWorkspace.discovery.pursuit.state.${state}`)}</option>)}</select></label><label>{t("rfxWorkspace.discovery.pursuit.note")}<textarea value={assessment[key].note} maxLength={600} onChange={(event) => changeDimension(key, { note: event.target.value })} /></label></fieldset>)}</section>
      <footer className={styles.actions}><div><span>{t("rfxWorkspace.discovery.pursuit.current")} <strong>{currentPursuit ? t(`rfxWorkspace.discovery.pursuit.${currentPursuit.decision}`) : t("rfxWorkspace.pursuitFormat.undecided")}</strong></span>{notice ? <p role="status">{notice}</p> : null}{!workspace.canManage ? <p role="note">{t("rfxWorkspace.discovery.pursuit.managementUnavailable")}</p> : null}</div><div><button type="button" disabled={busy || !workspace.canManage} onClick={() => save("watch")}>{t("rfxWorkspace.discovery.pursuit.watch")}</button><button type="button" disabled={busy || !workspace.canManage} onClick={() => save("decline")}>{t("rfxWorkspace.discovery.pursuit.decline")}</button><button type="button" disabled={busy || !workspace.canManage} data-opportunity-pursue onClick={() => save("pursue")}>{t("rfxWorkspace.discovery.pursuit.pursue")}</button></div><small>{t("rfxWorkspace.discovery.pursuit.responseUnavailable")}</small></footer>
      </div>
    </OperationalWorkspace>
  </ParticipantShell>;
}
