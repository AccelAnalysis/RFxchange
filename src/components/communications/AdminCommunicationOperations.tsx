"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canCloseCommunicationJob, type CommunicationOperationAction } from "@/src/domain/communications/operations";
import styles from "./ServiceSettings.module.css";
type Row = { id: string; version: number; [key: string]: unknown };
type Snapshot = { sampledAt: string; windowLimit: number; counts: Record<string, number>; jobs: Row[]; callbacks: Row[]; holds: Row[] };
export function AdminCommunicationOperations() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [userId, setUserId] = useState("");
  async function refresh(signal?: AbortSignal) {
    const response = await fetch("/api/admin/communication-operations", { signal });
    if (!response.ok) throw new Error("Operations access is unavailable.");
    setSnapshot(await response.json());
  }
  useEffect(() => { const controller = new AbortController(); void fetch("/api/admin/communication-operations", { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error("unavailable"); setSnapshot(await response.json()); }).catch(() => { if (!controller.signal.aborted) setMessage("Operations could not be loaded."); }); return () => controller.abort(); }, []);
  async function act(action: CommunicationOperationAction, targetId: string, expectedVersion: number) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/communication-operations", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ commandId: crypto.randomUUID(), action, targetId, expectedVersion, reason }) });
      if (!response.ok) throw new Error(response.status === 409 ? "The record changed. Refresh before trying again." : "The action could not be completed with your current access.");
      await refresh(); setReason(""); setMessage("Action recorded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action unavailable."); } finally { setBusy(false); }
  }
  const disabled = busy || !reason.trim();
  return <section className={styles.panel}><Link href="/admin/communications">Communications</Link><h1>Delivery operations</h1>
    <p>Review delivery exceptions, process stored delivery updates and place an account on a communication hold. A released hold still requires the recipient’s current consent and channel permission.</p>
    <button className={styles.secondary} disabled={busy} onClick={() => void refresh().catch(() => setMessage("Refresh unavailable."))}>Refresh</button>
    <p role="status">{message}</p>
    {!snapshot ? (!message && <p>Loading operations…</p>) : <>
      <p>Latest {snapshot.windowLimit} jobs and callbacks. Counts for these records are a recent window, not lifetime totals.</p>
      <ul><li>Recent jobs: {snapshot.counts.recentJobs}</li><li>Recent jobs needing attention: {snapshot.counts.recentJobsNeedingAttention}</li>
        <li>Recent unprocessed delivery updates: {snapshot.counts.recentUnprocessedCallbacks}</li><li>Accounts needing evaluation attention: {snapshot.counts.enrollmentsNeedingAttention}</li></ul>
      <label>Reason for the next action<textarea maxLength={1000} value={reason} onChange={e => setReason(e.target.value)}/></label>
      <h2>Account holds</h2><form onSubmit={e => { e.preventDefault(); const existing = snapshot.holds.find(h => h.id === userId.trim()); void act("hold", userId.trim(), existing?.version ?? 0); }}>
        <label>Account ID<input required maxLength={128} value={userId} onChange={e => setUserId(e.target.value)}/></label><button disabled={disabled}>Place communication hold</button></form>
      {snapshot.holds.filter(h => h.held).map(h => <details key={h.id}><summary>{h.id}</summary><p>Communication hold is active.</p><button disabled={disabled} onClick={() => void act("release-hold", h.id, h.version)}>Release this hold</button></details>)}
      <h2>Delivery jobs</h2>{snapshot.jobs.length === 0 && <p>No delivery jobs have been recorded.</p>}
      {snapshot.jobs.map(job => <details key={job.id}><summary>{String(job.journey)} · {String(job.status)} · {String(job.channel)}</summary><p>Account: {String(job.userId)}</p><p>Delivery: {String(job.deliveryStatus ?? "No delivery update")}</p><p>{String(job.reason ?? "")}</p>
        {canCloseCommunicationJob(job.status) && <button disabled={disabled} onClick={() => void act("close-job", job.id, job.version)}>Close without resending</button>}</details>)}
      <h2>Stored delivery updates</h2>{snapshot.callbacks.length === 0 && <p>No delivery updates have been recorded.</p>}
      {snapshot.callbacks.map(callback => <details key={callback.id}><summary>{String(callback.type)} · {String(callback.status ?? (callback.processed ? "Processed" : "Pending"))}</summary>
        {!callback.processed && <button disabled={disabled} onClick={() => void act("reconcile-callback", callback.id, callback.version)}>Process stored update</button>}</details>)}
    </>}
  </section>;
}
