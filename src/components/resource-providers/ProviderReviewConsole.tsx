"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  OfficialResourceProviderApplication,
  ProviderApplicationEvent,
  ProviderServiceProfile,
} from "../../domain/resource-providers/model";

import styles from "./ProviderReviewConsole.module.css";

interface QueueItem {
  readonly id: string;
  readonly organizationId: string;
  readonly displayName: string;
  readonly status: string;
  readonly version: number;
  readonly categories: readonly string[];
  readonly submittedAt: string | null;
  readonly updatedAt: string;
}

interface Detail {
  readonly application: OfficialResourceProviderApplication;
  readonly organization: {
    readonly displayName: string;
    readonly website: { readonly disposition: string; readonly url: string | null } | null;
    readonly primaryContact: { readonly displayName: string; readonly email: string } | null;
  } | null;
  readonly profileComplete: boolean;
  readonly location: { readonly geographyId: string; readonly visibility: string } | null;
  readonly serviceGeography: { readonly geographyIds: readonly string[] } | null;
  readonly history: readonly ProviderApplicationEvent[];
  readonly serviceProfile: ProviderServiceProfile | null;
}

type ReviewAction = "review-started" | "information-requested" | "approved" | "denied";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function joined(values: readonly string[]): string {
  return values.length ? values.map(readable).join(", ") : "Unavailable";
}

/**
 * Minimum-necessary application projection: this component receives only the fields already
 * authorized by the server. Private evidence bytes remain behind their separate access boundary.
 */
export function ProviderReviewConsole({
  applications,
  detail,
  canReview,
}: Readonly<{
  applications: readonly QueueItem[];
  detail: Detail | null;
  canReview: boolean;
}>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(action: ReviewAction, note: string) {
    if (!detail) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/provider-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          commandId: crypto.randomUUID(),
          organizationId: String(detail.application.organizationId),
          expectedVersion: detail.application.version,
          action,
          note,
        }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review action failed.");
      setNotice(`${readable(action)} saved.`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Review action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.console}>
      <header className={styles.header}>
        <div>
          <p>Resource providers</p>
          <h1>Applications</h1>
          <p className={styles.intro}>
            Review an organization&apos;s services, eligibility, reach, and evidence before making
            an Official Resource Provider decision.
          </p>
        </div>
        <div className={styles.summary} aria-label={`${applications.length} applications in this scope`}>
          <strong>{applications.length}</strong>
          <span>in this scope</span>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.queue} aria-labelledby="provider-review-queue-heading">
          <header className={styles.queueHeader}>
            <p>Review queue</p>
            <h2 id="provider-review-queue-heading">Provider applications</h2>
          </header>

          {applications.length ? (
            <div className={styles.queueList}>
              {applications.map((application) => {
                const selected = String(detail?.application.organizationId ?? "") === application.organizationId;
                return (
                  <Link
                    key={application.id}
                    href={`/admin/resource-providers?organizationId=${encodeURIComponent(application.organizationId)}`}
                    className={styles.queueItem}
                    data-selected={selected ? "true" : "false"}
                    aria-current={selected ? "page" : undefined}
                  >
                    <div>
                      <strong>{application.displayName}</strong>
                      <small>{joined(application.categories)}</small>
                    </div>
                    <span>{readable(application.status)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyQueue}>
              <strong>Nothing is waiting for review.</strong>
              <p>No provider applications are present in this access scope.</p>
            </div>
          )}
        </section>

        <section className={styles.detail} aria-live="polite">
          {!detail ? (
            <div className={styles.empty}>
              <span aria-hidden="true">○</span>
              <h2>Select an application</h2>
              <p>Choose an organization from the review queue to inspect its application.</p>
            </div>
          ) : (
            <>
              <div className={styles.title}>
                <div>
                  <p>Provider application · Version {detail.application.version}</p>
                  <h2>{detail.organization?.displayName ?? "Organization"}</h2>
                </div>
                <span>{readable(detail.application.status)}</span>
              </div>

              <div className={styles.signals} aria-label="Provider application summary">
                <div>
                  <small>Profile</small>
                  <strong>{detail.profileComplete ? "Complete" : "Incomplete"}</strong>
                </div>
                <div>
                  <small>Primary geography</small>
                  <strong>{detail.location?.geographyId ?? "Unavailable"}</strong>
                </div>
                <div>
                  <small>Service reach</small>
                  <strong>{detail.serviceGeography?.geographyIds.join(", ") || "Unavailable"}</strong>
                </div>
              </div>

              <section className={styles.section}>
                <h3>Organization</h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>Profile</dt>
                    <dd>{detail.organization?.displayName ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>Website</dt>
                    <dd>
                      {detail.organization?.website?.url
                        ?? detail.organization?.website?.disposition
                        ?? "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt>Primary contact</dt>
                    <dd>
                      {detail.organization?.primaryContact
                        ? `${detail.organization.primaryContact.displayName} · ${detail.organization.primaryContact.email}`
                        : "Unavailable"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Application details</h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>Categories</dt>
                    <dd>{joined(detail.application.content.categories)}</dd>
                  </div>
                  <div className={styles.wideFact}>
                    <dt>Services and programs</dt>
                    <dd>
                      {detail.application.content.services.length
                        ? detail.application.content.services.map((service) => (
                            `${service.name} — ${service.description} (${readable(service.availability)})`
                          )).join("; ")
                        : "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt>Organizations or people served</dt>
                    <dd>{detail.application.content.populationsServed}</dd>
                  </div>
                  <div>
                    <dt>Eligibility</dt>
                    <dd>{detail.application.content.eligibility}</dd>
                  </div>
                  <div>
                    <dt>Intake or referral</dt>
                    <dd>{detail.application.content.intakeMethod}</dd>
                  </div>
                  <div>
                    <dt>Modality and languages</dt>
                    <dd>
                      {joined(detail.application.content.modalities)} · {detail.application.content.languages.join(", ") || "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt>Official contact</dt>
                    <dd>
                      {detail.application.content.officialContact.displayName} · {detail.application.content.officialContact.email}
                    </dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>
                      {detail.application.content.evidenceAssetIds.length
                        ? `${detail.application.content.evidenceAssetIds.length} private reference${detail.application.content.evidenceAssetIds.length === 1 ? "" : "s"}. File access is separately controlled.`
                        : "No evidence references submitted."}
                    </dd>
                  </div>
                </dl>
              </section>

              {detail.application.informationRequest ? (
                <section className={styles.exchange}>
                  <h3>Information exchange</h3>
                  <div>
                    <strong>Administrator request</strong>
                    <p>{detail.application.informationRequest}</p>
                  </div>
                  <div>
                    <strong>Applicant response</strong>
                    <p>{detail.application.applicantResponse ?? "Awaiting response"}</p>
                  </div>
                </section>
              ) : null}

              <section className={styles.section}>
                <h3>Review history</h3>
                <ol className={styles.history}>
                  {[...detail.history].reverse().map((event) => (
                    <li key={String(event.id)}>
                      <strong>{readable(event.kind)}</strong>
                      <span>{readable(event.actorKind)} · {new Date(event.occurredAt).toLocaleString()}</span>
                      {event.note ? <p>{event.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>

              {canReview && ["submitted", "resubmitted", "under-review"].includes(detail.application.status) ? (
                <ReviewActions status={detail.application.status} busy={busy} onAction={act} />
              ) : (
                <p className={styles.readOnly}>
                  {canReview
                    ? "No review action is available from this stage."
                    : "This application is available for review in read-only mode."}
                </p>
              )}

              {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
            </>
          )}
        </section>
      </div>
    </section>
  );
}

function ReviewActions({
  status,
  busy,
  onAction,
}: Readonly<{
  status: string;
  busy: boolean;
  onAction: (action: ReviewAction, note: string) => void;
}>) {
  const [note, setNote] = useState("");

  if (["submitted", "resubmitted"].includes(status)) {
    return (
      <section className={styles.actions} aria-busy={busy}>
        <div>
          <p>Next action</p>
          <h3>Begin the review</h3>
        </div>
        <button
          type="button"
          className={styles.primaryAction}
          disabled={busy}
          onClick={() => onAction("review-started", "")}
        >
          Begin review
        </button>
      </section>
    );
  }

  return (
    <section className={styles.actions} aria-busy={busy}>
      <div>
        <p>Decision workspace</p>
        <h3>Record the reason</h3>
      </div>
      <label htmlFor="review-note">Information request or decision reason</label>
      <textarea
        id="review-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={styles.secondaryAction}
          disabled={busy || !note.trim()}
          onClick={() => onAction("information-requested", note)}
        >
          Request information
        </button>
        <button
          type="button"
          className={styles.primaryAction}
          disabled={busy || !note.trim()}
          onClick={() => onAction("approved", note)}
        >
          Approve
        </button>
        <button
          type="button"
          className={styles.dangerAction}
          disabled={busy || !note.trim()}
          onClick={() => onAction("denied", note)}
        >
          Deny
        </button>
      </div>
    </section>
  );
}
