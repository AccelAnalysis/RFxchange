"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/src/components/i18n/I18nProvider";
import type { PublicEnrichmentRun } from "@/functions/src/application/public-enrichment";
import styles from "./ServiceSettings.module.css";
export function PublicDataReview({ organizationId, admin = false }: { organizationId: string; admin?: boolean }) {
  const { dictionary, locale, t } = useI18n();
  const { common, data: copy } = dictionary.interface.services;
  const [loaded, setLoaded] = useState(false);
  const [runs, setRuns] = useState<PublicEnrichmentRun[]>([]);
  const [uei, setUei] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [disposition, setDisposition] = useState("retain-current");
  const [reason, setReason] = useState("");
  const url = `${admin ? "/api/admin/public-enrichment" : "/api/organization-enrichment/public-data"}?organizationId=${encodeURIComponent(organizationId)}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(common.loadError);
      setRuns(body.runs); setLoaded(true);
    }).catch(() => { if (!controller.signal.aborted) setMessage(common.loadError); });
    return () => controller.abort();
  }, [url, common.loadError]);
  async function submit(runId?: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commandId: crypto.randomUUID(), uei: uei || null, reason, ...(runId ? { action: "review", runId, ...(admin ? { disposition, expectedReviewVersion: runs.find(r => r.id === runId)?.reviewVersion ?? 0 } : {}) } : {}) }) });
      const body = await response.json(); if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
      if (runId) setRuns(current => current.map(run => run.id === runId ? { ...run, reviewStatus: "reviewed", ...(admin ? { reviewDisposition: disposition as PublicEnrichmentRun["reviewDisposition"], reviewReason: reason, reviewVersion: (run.reviewVersion ?? 0) + 1 } : {}) } : run));
      else { setRuns(current => [body.run, ...current.filter(run => run.id !== body.run.id)]); setLoaded(true); setMessage(copy.checked); }
    } catch (error) { setMessage(error instanceof Error && !(error instanceof TypeError) ? error.message : common.saveError); } finally { setBusy(false); }
  }
  return <section className={styles.panel}>{!admin && <Link href="/organization-profile">{common.back}</Link>}{admin ? <h2>{copy.title}</h2> : <h1>{copy.title}</h1>}
    <p>{copy.intro}</p>
    {admin && <label>{copy.reason}<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}/></label>}
    {admin && <label>Review disposition<select value={disposition} onChange={e => setDisposition(e.target.value)}><option value="retain-current">Keep current organization information</option><option value="dismiss-source">Dismiss source findings</option><option value="request-correction">Request an organization correction</option></select></label>}
    <form onSubmit={event => { event.preventDefault(); void submit(); }}><label>{copy.uei}<input maxLength={12} pattern="[A-Z0-9]{12}" value={uei} onChange={event => setUei(event.target.value.toUpperCase())}/></label><p>{copy.ueiHelp}</p><button disabled={busy || (admin && !reason.trim())}>{busy ? copy.checking : copy.check}</button></form>
    <p role="status">{message}</p>
    {!loaded && !message ? <p role="status">{common.loading}</p> : loaded && runs.length === 0 ? <p>{copy.empty}</p> : null}
    {runs.map(run => <details className={styles.run} key={run.id}><summary>{t("interface.services.data.runTitle", { date: new Date(run.startedAt).toLocaleDateString(locale) })}</summary>
      <p>{!run.completedAt ? copy.inProgress : run.reviewStatus === "reviewed" ? copy.reviewed : copy.ready}</p>
      {run.sourceResults?.map(source => <div key={source.source}><h3>{source.source === "sam" ? "SAM.gov" : "USAspending.gov"}</h3>
        <p>{source.status === "unavailable" ? copy.unavailable : source.status === "no-match" ? copy.noMatch : source.status === "skipped" ? copy.skipped : copy.findings}</p>
        <ul>{source.findings.map((finding, i) => <li key={`${finding.field}-${i}`}>{finding.value} · <a href={finding.sourceReference} target="_blank" rel="noreferrer">{copy.source}</a></li>)}</ul>
      </div>)}
      {run.conflicts?.length > 0 && <><p>{copy.conflicts}</p><ul>{run.conflicts.map((c, i) => <li key={i}>{c.field}: {c.currentValue} → {c.proposedValue} ({c.source})</li>)}</ul></>}
      {run.reviewDisposition && <p>{run.reviewDisposition}{admin && run.reviewReason ? `: ${run.reviewReason}` : ""}</p>}
      {run.reviewDisposition === "request-correction" && <Link href={admin ? `/admin/organizations/${encodeURIComponent(organizationId)}` : "/organization-profile"}>Review organization information</Link>}
      {run.completedAt && run.reviewStatus !== "reviewed" && <button className={styles.secondary} disabled={busy || (admin && !reason.trim())} onClick={() => void submit(run.id)}>{copy.markReviewed}</button>}
    </details>)}
  </section>;
}
