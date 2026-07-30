import type {
  AdministrativeWorkQueueSnapshot,
  AdministrativeWorkSeverity,
} from "../../application/admin/unified-work-queue";

export interface UnifiedAdministrativeWorkQueueProps {
  readonly queue: AdministrativeWorkQueueSnapshot;
}

function severityLabel(severity: AdministrativeWorkSeverity): string {
  return severity === "critical" ? "Critical" : severity === "high" ? "High" : severity === "low" ? "Low" : "Normal";
}

export function UnifiedAdministrativeWorkQueue({ queue }: UnifiedAdministrativeWorkQueueProps) {
  return (
    <section className="admin-unified-work-queue" aria-labelledby="admin-unified-work-queue-title">
      <header>
        <p className="eyebrow">Work Queues</p>
        <h1 id="admin-unified-work-queue-title">Unified administrative work queue</h1>
        <p>{queue.total} visible items · generated {queue.generatedAt}</p>
      </header>

      <div className="admin-work-queue-domain-counts" aria-label="Work item counts by domain">
        {Object.entries(queue.countsByDomain).map(([domain, count]) => (
          <span key={domain}>{domain.replaceAll("-", " ")}: <strong>{count}</strong></span>
        ))}
      </div>

      <ol className="admin-work-queue-items">
        {queue.items.map((item) => (
          <li key={item.id} data-domain={item.domain} data-severity={item.severity} data-status={item.status}>
            <article>
              <header>
                <span>{item.domain.replaceAll("-", " ")} · {severityLabel(item.severity)}</span>
                <h2>{item.title}</h2>
              </header>
              <dl>
                <dt>Status</dt><dd>{item.status}</dd>
                <dt>Type</dt><dd>{item.type}</dd>
                <dt>Object</dt><dd>{item.object.kind} · {item.object.id}</dd>
                <dt>Assigned</dt><dd>{item.assignedAdministratorId ?? "Unassigned"}</dd>
                <dt>Due</dt><dd>{item.dueAt ?? "—"}</dd>
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
