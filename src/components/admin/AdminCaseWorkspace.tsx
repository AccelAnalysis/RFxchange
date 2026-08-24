import Link from "next/link";

import type {
  AdministrativeCase,
  AdministrativeCaseEvent,
  AdministrativeCaseSlaState,
  AdministrativeCaseStatus,
} from "../../domain/admin-cases/model";
import { AdminCaseTransition } from "./AdminCaseTransition";

import styles from "./AdminOperatingCore.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminCaseWorkspace({
  caseRecord,
  events,
  slaState,
  nextStatus,
  canTransition,
  organizationHref,
}: Readonly<{
  caseRecord: AdministrativeCase;
  events: readonly AdministrativeCaseEvent[];
  slaState: AdministrativeCaseSlaState;
  nextStatus: AdministrativeCaseStatus | null;
  canTransition: boolean;
  organizationHref: string | null;
}>) {
  return (
    <section className={styles.workspace} aria-labelledby="admin-case-heading">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Administrative case</p>
          <h1 id="admin-case-heading">{String(caseRecord.caseNumber)}</h1>
          <p className={styles.intro}>
            {readable(caseRecord.type)} work coordinated through the canonical case lifecycle.
            Domain decisions continue through their own governed services.
          </p>
        </div>
        <div className={styles.summary}>
          <strong>{readable(caseRecord.severity)}</strong>
          <span>severity</span>
        </div>
      </header>

      <section className={styles.caseHeader} aria-label="Case status">
        <p className={styles.sectionEyebrow}>Current state</p>
        <div className={styles.caseMeta}>
          <strong>{readable(caseRecord.status)}</strong>
          <span>SLA: {readable(slaState)}</span>
          <span>{caseRecord.assignedAdministratorId ? "Assigned" : "Unassigned"}</span>
          <span>Updated {new Date(caseRecord.updatedAt).toLocaleString()}</span>
        </div>
      </section>

      <div className={styles.caseGrid}>
        <div>
          <section className={styles.section} aria-labelledby="case-context-heading">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Context</p>
                <h2 id="case-context-heading">Case details</h2>
              </div>
              {organizationHref ? <Link href={organizationHref}>Open organization</Link> : null}
            </div>
            <dl className={styles.facts}>
              <div className={styles.fact}><dt>Source</dt><dd>{readable(caseRecord.source)}</dd></div>
              <div className={styles.fact}><dt>Related object</dt><dd>{readable(caseRecord.objectType)}</dd></div>
              <div className={styles.fact}><dt>Organization</dt><dd>{caseRecord.organizationId ?? "Not attached"}</dd></div>
              <div className={styles.fact}><dt>User</dt><dd>{caseRecord.userId ?? "Not attached"}</dd></div>
              <div className={styles.fact}><dt>Geography</dt><dd>{caseRecord.geography ?? "Not attached"}</dd></div>
              <div className={styles.fact}><dt>SLA due</dt><dd>{caseRecord.slaDueAt ? new Date(caseRecord.slaDueAt).toLocaleString() : "Not configured"}</dd></div>
              <div className={styles.fact}><dt>Evidence</dt><dd>{caseRecord.evidenceReferences.length} reference{caseRecord.evidenceReferences.length === 1 ? "" : "s"}</dd></div>
              <div className={styles.fact}><dt>Related cases</dt><dd>{caseRecord.relatedCaseIds.length || "None"}</dd></div>
            </dl>
          </section>

          <section className={styles.section} aria-labelledby="case-history-heading">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>History</p>
                <h2 id="case-history-heading">Lifecycle events</h2>
              </div>
            </div>
            {events.length ? (
              <ol className={styles.timeline}>
                {[...events].reverse().map((event) => (
                  <li key={String(event.id)}>
                    <strong>{readable(event.fromStatus)} → {readable(event.toStatus)}</strong>
                    <span>{event.reason}</span>
                    <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.empty}>
                <strong>No transition events yet.</strong>
                <p>The original case state remains authoritative until the first governed transition.</p>
              </div>
            )}
          </section>
        </div>

        <aside>
          {nextStatus && canTransition ? (
            <AdminCaseTransition
              caseId={String(caseRecord.id)}
              currentStatus={caseRecord.status}
              nextStatus={nextStatus}
            />
          ) : (
            <div className={styles.transition}>
              <p className={styles.sectionEyebrow}>Next action</p>
              <h2>{nextStatus ? "Read-only access" : "Lifecycle complete"}</h2>
              <p className={styles.transitionNotice}>
                {nextStatus
                  ? "This case is visible, but the next transition is not authorized in the current access context."
                  : "No later lifecycle state is available for this case."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
