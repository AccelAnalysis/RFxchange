import Link from "next/link";

import type { AdministrativeWorkItem } from "../../domain/admin-work-queue/model";

import styles from "./AdminOperatingCore.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function queueHref(input: Readonly<{
  status: string;
  severity: string;
  assignment: string;
  caseId?: string | null;
}>): string {
  const search = new URLSearchParams();
  if (input.status !== "all") search.set("status", input.status);
  if (input.severity !== "all") search.set("severity", input.severity);
  if (input.assignment !== "all") search.set("assignment", input.assignment);
  if (input.caseId) search.set("caseId", input.caseId);
  const query = search.toString();
  return query ? `/admin/work-queues?${query}` : "/admin/work-queues";
}

export function AdminWorkQueueWorkspace({
  items,
  selected,
  currentAdministratorId,
  status,
  severity,
  assignment,
}: Readonly<{
  items: readonly AdministrativeWorkItem[];
  selected: AdministrativeWorkItem | null;
  currentAdministratorId: string;
  status: string;
  severity: string;
  assignment: string;
}>) {
  return (
    <section className={styles.workspace} aria-labelledby="admin-work-queue-heading">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Operate</p>
          <h1 id="admin-work-queue-heading">Work queues</h1>
          <p className={styles.intro}>
            Review canonical administrative cases without losing your filters or list position.
            Claims and provider applications remain available in their dedicated review workspaces.
          </p>
        </div>
        <div className={styles.summary} aria-label={`${items.length} visible work items`}>
          <strong>{items.length}</strong>
          <span>visible cases</span>
        </div>
      </header>

      <form className={styles.filters} method="get" action="/admin/work-queues">
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="all">All open statuses</option>
            <option value="new">New</option>
            <option value="triaged">Triaged</option>
            <option value="assigned">Assigned</option>
            <option value="in-review">In review</option>
            <option value="waiting-for-participant">Waiting for participant</option>
            <option value="action-required">Action required</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label>
          Severity
          <select name="severity" defaultValue={severity}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          Assignment
          <select name="assignment" defaultValue={assignment}>
            <option value="all">All assignments</option>
            <option value="mine">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
      </form>

      <div className={styles.queueLayout}>
        <section className={styles.queuePanel} aria-labelledby="queue-list-heading">
          <header className={styles.queuePanelHeader}>
            <p className={styles.sectionEyebrow}>Current view</p>
            <h2 id="queue-list-heading">Cases</h2>
          </header>
          {items.length ? (
            <ul className={styles.queueList}>
              {items.map((item) => {
                const isSelected = String(selected?.id ?? "") === String(item.id);
                return (
                  <li className={styles.queueItem} data-selected={isSelected ? "true" : "false"} key={String(item.id)}>
                    <Link
                      href={queueHref({
                        status,
                        severity,
                        assignment,
                        caseId: String(item.id),
                      })}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div>
                        <strong>{String(item.caseNumber)}</strong>
                        <small>{readable(item.type)} · {readable(item.severity)}</small>
                      </div>
                      <span>{readable(item.status)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>
              <strong>No cases match this view.</strong>
              <p>Change the filters or return when new work enters the current authority scope.</p>
            </div>
          )}
        </section>

        <section className={styles.inspector} aria-live="polite" aria-labelledby="queue-inspector-heading">
          {selected ? (
            <>
              <header className={styles.inspectorHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Selected case</p>
                  <h2 id="queue-inspector-heading">{String(selected.caseNumber)}</h2>
                </div>
                <span className={styles.statusPill}>{readable(selected.status)}</span>
              </header>
              <dl className={styles.facts}>
                <div className={styles.fact}><dt>Type</dt><dd>{readable(selected.type)}</dd></div>
                <div className={styles.fact}><dt>Severity</dt><dd>{readable(selected.severity)}</dd></div>
                <div className={styles.fact}><dt>Source</dt><dd>{readable(selected.source)}</dd></div>
                <div className={styles.fact}><dt>Assignment</dt><dd>{selected.assignedAdministratorId === currentAdministratorId ? "Assigned to me" : selected.assignedAdministratorId ? "Assigned" : "Unassigned"}</dd></div>
                <div className={styles.fact}><dt>Organization</dt><dd>{selected.organizationId ?? "Not attached"}</dd></div>
                <div className={styles.fact}><dt>User</dt><dd>{selected.userId ?? "Not attached"}</dd></div>
                <div className={styles.fact}><dt>Geography</dt><dd>{selected.geography ?? "Not attached"}</dd></div>
                <div className={styles.fact}><dt>SLA</dt><dd>{selected.slaDueAt ? new Date(selected.slaDueAt).toLocaleString() : "Not configured"}</dd></div>
                <div className={styles.fact}><dt>Evidence</dt><dd>{selected.evidenceReferences.length} reference{selected.evidenceReferences.length === 1 ? "" : "s"}</dd></div>
                <div className={styles.fact}><dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div>
              </dl>
              <footer className={styles.inspectorFooter}>
                <Link href={`/admin/cases/${encodeURIComponent(String(selected.id))}`}>Open full case</Link>
              </footer>
            </>
          ) : (
            <div className={styles.empty}>
              <strong>No case selected.</strong>
              <p>Select a case to review its operational context without leaving this queue.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
