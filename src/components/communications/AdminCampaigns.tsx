"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicCampaign } from "@/src/domain/acquisition/campaign";
import { applicationOrigins } from "@/src/application/platform/application-origins";
import styles from "./ServiceSettings.module.css";
const empty: PublicCampaign = { id: "", version: 0, status: "draft", title: "", summary: "", actionLabel: "Join RFxchange", updatedAt: "" };
export function AdminCampaigns() {
  const [rows, setRows] = useState<(PublicCampaign & { counts: Record<string, number> })[]>([]);
  const [campaign, setCampaign] = useState(empty);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/campaigns", { signal: controller.signal }).then(async r => { if (!r.ok) throw Error(); setRows((await r.json()).campaigns); }).catch(() => { if (!controller.signal.aborted) setMessage("Campaigns could not be loaded."); });
    return () => controller.abort();
  }, []);
  return <section className={styles.panel}><Link href="/admin/communications/lifecycle">Communications settings</Link><h1>Marketing campaigns</h1>
    <p>Published campaigns have a public landing page and a registration link. Campaign reporting records reported attribution; it does not grant referrals, ranking or access.</p>
    <button type="button" className={styles.secondary} onClick={() => setCampaign(empty)}>New campaign</button>
    <form onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMessage("");
      try {
        const r = await fetch("/api/admin/campaigns", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaign, expectedVersion: campaign.version, commandId: crypto.randomUUID(), reason }) });
        if (!r.ok) {
          const failure = await r.json().catch(() => null);
          throw Error(typeof failure?.error === "string" ? failure.error : "Campaign could not be saved. Reload it and review the fields.");
        }
        setCampaign((await r.json()).campaign); setReason("");
        const refreshed = await fetch("/api/admin/campaigns"); if (!refreshed.ok) throw Error("Saved; refresh the list."); setRows((await refreshed.json()).campaigns); setMessage("Campaign saved.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Save unavailable."); } finally { setBusy(false); }
    }}><fieldset disabled={busy}><legend>Campaign content</legend>
      <label>Campaign ID<input required disabled={campaign.version > 0} pattern="[a-z0-9][a-z0-9-]{2,79}" value={campaign.id} onChange={e => setCampaign({ ...campaign, id: e.target.value })}/></label>
      <label>Title<input required maxLength={140} value={campaign.title} onChange={e => setCampaign({ ...campaign, title: e.target.value })}/></label>
      <label>Summary<textarea required maxLength={1500} value={campaign.summary} onChange={e => setCampaign({ ...campaign, summary: e.target.value })}/></label>
      <label>Registration link label<input required maxLength={60} value={campaign.actionLabel} onChange={e => setCampaign({ ...campaign, actionLabel: e.target.value })}/></label>
      <label>Status<select value={campaign.status} onChange={e => setCampaign({ ...campaign, status: e.target.value as PublicCampaign["status"] })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label>Reason<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)}/></label>
      <button>Save campaign</button></fieldset></form><p role="status">{message}</p>
    <h2>Campaign reporting</h2><p>Counts cover the latest 500 acquisition contexts. “Bound” means attached to a signed-in account; “resumed” means the acquisition journey continued. Neither implies a purchase.</p>
    {rows.map(row => <details key={row.id}><summary>{row.title} · {row.status}</summary><p>Issued: {row.counts.issued} · Bound: {row.counts.bound} · Resumed: {row.counts.resumed}</p>
      {row.status === "published" && <p><a href={`${applicationOrigins.marketing}/campaigns/${row.id}`} target="_blank" rel="noreferrer">Open public campaign</a></p>}
      <button className={styles.secondary} disabled={busy} onClick={() => setCampaign(row)}>Edit campaign</button></details>)}
  </section>;
}
