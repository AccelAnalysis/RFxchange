"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OfficialResourceProviderApplication, ProviderApplicationEvent, ProviderServiceProfile } from "../../domain/resource-providers/model";

import styles from "./ProviderReviewConsole.module.css";

interface QueueItem { readonly id: string; readonly organizationId: string; readonly status: string; readonly version: number; readonly categories: readonly string[]; readonly submittedAt: string | null; readonly updatedAt: string; }
interface Detail { readonly application: OfficialResourceProviderApplication; readonly organization: { readonly displayName: string; readonly website: { readonly disposition: string; readonly url: string | null } | null; readonly primaryContact: { readonly displayName: string; readonly email: string } | null } | null; readonly profileComplete: boolean; readonly location: { readonly geographyId: string; readonly visibility: string } | null; readonly serviceGeography: { readonly geographyIds: readonly string[] } | null; readonly history: readonly ProviderApplicationEvent[]; readonly serviceProfile: ProviderServiceProfile | null; }
function readable(value: string): string { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

export function ProviderReviewConsole({ applications, detail, canReview }: Readonly<{ applications: readonly QueueItem[]; detail: Detail | null; canReview: boolean }>) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  async function act(action: "review-started" | "information-requested" | "approved" | "denied", note: string) {
    if (!detail) return; setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/provider-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commandId: crypto.randomUUID(), organizationId: String(detail.application.organizationId), expectedVersion: detail.application.version, action, note }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review action failed.");
      setNotice(`${readable(action)} recorded.`); router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Review action failed."); }
    finally { setBusy(false); }
  }
  return (
    <div className={styles.console}>
      <header className={styles.header}><div><p>Administration · Resource Providers</p><h1>Provider approval console</h1></div><span>{applications.length} scoped applications</span></header>
      <div className={styles.layout}>
        <section className={styles.queue} aria-label="Provider application queue"><h2>Review queue</h2>{applications.length ? applications.map((application) => <Link key={application.id} href={`/admin/resource-providers?organizationId=${encodeURIComponent(application.organizationId)}`} className={detail?.application.organizationId === application.organizationId ? styles.selected : undefined}><strong>{application.organizationId}</strong><span>{readable(application.status)} · v{application.version}</span><small>{application.categories.map(readable).join(", ")}</small></Link>) : <p>No provider applications are present in this authorized scope.</p>}</section>
        <section className={styles.detail} aria-live="polite">
          {!detail ? <div className={styles.empty}><h2>Select an application</h2><p>Protected application detail appears only after the exact read scope is authorized.</p></div> : <>
            <div className={styles.title}><div><p>Application {String(detail.application.id)}</p><h2>{detail.organization?.displayName ?? "Organization"}</h2></div><span>{readable(detail.application.status)}</span></div>
            <div className={styles.signals}><div><small>Profile Complete</small><strong>{detail.profileComplete ? "Active" : "Inactive"}</strong></div><div><small>Primary geography</small><strong>{detail.location?.geographyId ?? "Unavailable"}</strong></div><div><small>Service geography</small><strong>{detail.serviceGeography?.geographyIds.join(", ") || "Unavailable"}</strong></div></div>
            <section><h3>Authoritative organization references</h3><dl className={styles.facts}><div><dt>Organization profile</dt><dd>{detail.organization?.displayName ?? "Unavailable"}</dd></div><div><dt>Authoritative website</dt><dd>{detail.organization?.website?.url ?? detail.organization?.website?.disposition ?? "Unavailable"}</dd></div><div><dt>Primary contact</dt><dd>{detail.organization?.primaryContact ? `${detail.organization.primaryContact.displayName} · ${detail.organization.primaryContact.email}` : "Unavailable"}</dd></div></dl></section>
            <section><h3>Minimum-necessary application</h3><dl className={styles.facts}><div><dt>Categories</dt><dd>{detail.application.content.categories.map(readable).join(", ")}</dd></div><div><dt>Services/programs</dt><dd>{detail.application.content.services.map((service) => `${service.name} — ${service.description} (${service.availability})`).join("; ")}</dd></div><div><dt>Organizations/people served</dt><dd>{detail.application.content.populationsServed}</dd></div><div><dt>Eligibility</dt><dd>{detail.application.content.eligibility}</dd></div><div><dt>Intake/referral</dt><dd>{detail.application.content.intakeMethod}</dd></div><div><dt>Modality/languages</dt><dd>{detail.application.content.modalities.map(readable).join(", ")} · {detail.application.content.languages.join(", ")}</dd></div><div><dt>Official contact</dt><dd>{detail.application.content.officialContact.displayName} · {detail.application.content.officialContact.email}</dd></div><div><dt>Evidence metadata</dt><dd>{detail.application.content.evidenceAssetIds.length ? `${detail.application.content.evidenceAssetIds.length} private references; bytes require separate evidence access.` : "No evidence references submitted."}</dd></div></dl></section>
            {detail.application.informationRequest ? <section className={styles.exchange}><h3>Information exchange</h3><strong>Administrator request</strong><p>{detail.application.informationRequest}</p><strong>Applicant response</strong><p>{detail.application.applicantResponse ?? "Awaiting response"}</p></section> : null}
            <section><h3>Immutable history</h3><ol className={styles.history}>{[...detail.history].reverse().map((event) => <li key={String(event.id)}><strong>{readable(event.kind)}</strong><span>{event.actorKind} · {new Date(event.occurredAt).toLocaleString()}</span>{event.note ? <p>{event.note}</p> : null}</li>)}</ol></section>
            {canReview && ["submitted", "resubmitted", "under-review"].includes(detail.application.status) ? <ReviewActions status={detail.application.status} busy={busy} onAction={act} /> : <p className={styles.readOnly}>{canReview ? "No review transition is available from this stage." : "Read-only: provider.application.review is not present."}</p>}
            {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          </>}
        </section>
      </div>
    </div>
  );
}

function ReviewActions({ status, busy, onAction }: Readonly<{ status: string; busy: boolean; onAction: (action: "review-started" | "information-requested" | "approved" | "denied", note: string) => void }>) {
  const [note, setNote] = useState("");
  if (["submitted", "resubmitted"].includes(status)) return <div className={styles.actions}><button disabled={busy} onClick={() => onAction("review-started", "")}>Begin review</button></div>;
  return <div className={styles.actions}><label htmlFor="review-note">Information request or decision reason</label><textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} /><div><button disabled={busy || !note.trim()} onClick={() => onAction("information-requested", note)}>Request information</button><button disabled={busy || !note.trim()} onClick={() => onAction("approved", note)}>Approve</button><button className={styles.deny} disabled={busy || !note.trim()} onClick={() => onAction("denied", note)}>Deny</button></div></div>;
}
