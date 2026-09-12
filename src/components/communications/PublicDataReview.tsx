"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicEnrichmentRun } from "@/functions/src/application/public-enrichment";
import styles from "./ServiceSettings.module.css";
export function PublicDataReview({ organizationId, admin = false }: { organizationId: string; admin?: boolean }) {
  const [runs, setRuns] = useState<PublicEnrichmentRun[]>([]);
  const [uei, setUei] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const url = `${admin ? "/api/admin/public-enrichment" : "/api/organization-enrichment/public-data"}?organizationId=${encodeURIComponent(organizationId)}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      setRuns(body.runs);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, [url]);
  async function submit(runId?: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commandId: crypto.randomUUID(), uei: uei || null, reason, ...(runId ? { action: "review", runId } : {}) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      if (runId) setRuns(current => current.map(run => run.id === runId ? { ...run, reviewStatus: "reviewed" } : run));
      else { setRuns(current => [body.run, ...current.filter(run => run.id !== body.run.id)]); setMessage("Check complete. Review the source findings below."); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Public data could not be checked."); } finally { setBusy(false); }
  }
  return <section className={styles.panel}>{!admin && <Link href="/organization-profile">Back to your organization</Link>}<h1>Public business data</h1>
    <p>Review what public sources report about your organization. Findings do not change your profile or establish verification.</p>
    {admin && <label>Reason for the next check or review<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}/></label>}
    <form onSubmit={event => { event.preventDefault(); void submit(); }}><label>UEI, if your organization has one<input maxLength={12} pattern="[A-Z0-9]{12}" value={uei} onChange={event => setUei(event.target.value.toUpperCase())}/></label><p>A UEI helps identify the correct government registration and award history.</p><button disabled={busy || (admin && !reason.trim())}>Check public sources</button></form>
    <p role="status">{message}</p>
    {runs.map(run => <section key={run.id}><h2>Check from {new Date(run.startedAt).toLocaleDateString()}</h2>
      <p>{!run.completedAt ? "Check in progress" : run.reviewStatus === "reviewed" ? "Reviewed" : "Ready to review"}</p>
      {run.sourceResults?.map(source => <div key={source.source}><h3>{source.source === "sam" ? "SAM.gov" : "USAspending.gov"}</h3>
        <p>{source.status === "unavailable" ? "This source is unavailable. Your organization setup can continue." : source.status === "no-match" ? "No matching record found." : source.status === "skipped" ? "Enter a UEI to check award history." : "Source findings"}</p>
        <ul>{source.findings.map((finding, i) => <li key={`${finding.field}-${i}`}>{finding.value} · <a href={finding.sourceReference} target="_blank" rel="noreferrer">View source</a></li>)}</ul>
      </div>)}
      {run.conflicts?.length > 0 && <p>Some findings differ from your organization information. Review the sources before changing your profile.</p>}
      {run.completedAt && run.reviewStatus !== "reviewed" && <button disabled={busy || (admin && !reason.trim())} onClick={() => void submit(run.id)}>Mark reviewed</button>}
    </section>)}
  </section>;
}
