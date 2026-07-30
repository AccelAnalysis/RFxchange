import type { AdminCommandCenterSnapshot } from "../../application/admin/command-center";

export interface AdminCommandCenterProps {
  readonly snapshot: AdminCommandCenterSnapshot;
}

function metricValue(value: number | string | null, unit: string | null): string {
  if (value === null) return "—";
  return unit ? `${String(value)} ${unit}` : String(value);
}

export function AdminCommandCenter({ snapshot }: AdminCommandCenterProps) {
  return (
    <section className="admin-command-center" aria-labelledby="admin-command-center-title">
      <header>
        <p className="eyebrow">Overview</p>
        <h1 id="admin-command-center-title">What needs attention?</h1>
        <p>
          <strong>{snapshot.attentionTotal}</strong> open items visible to your current administrative authority.
        </p>
      </header>

      <div className="admin-command-center-queues" aria-label="Operational work queues">
        {snapshot.queueCards.map((card) => (
          <a key={card.key} href={card.href} className="admin-command-center-queue-card">
            <span>{card.label}</span>
            <strong>{card.count}</strong>
          </a>
        ))}
      </div>

      <section aria-labelledby="admin-platform-health-title">
        <header>
          <h2 id="admin-platform-health-title">Platform health</h2>
          <p>Stage-appropriate operating signals below the current workload.</p>
        </header>
        <div className="admin-command-center-health-grid">
          {snapshot.healthPanels.map((panel) => (
            <article key={panel.domain}>
              <h3>{panel.label}</h3>
              <dl>
                {panel.metrics.map((metric) => (
                  <div key={metric.key} data-state={metric.state}>
                    <dt>{metric.label}</dt>
                    <dd>{metricValue(metric.value, metric.unit)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <footer>Generated {snapshot.generatedAt}</footer>
    </section>
  );
}
