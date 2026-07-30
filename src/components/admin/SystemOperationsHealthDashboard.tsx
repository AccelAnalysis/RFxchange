import type { SystemOperationsHealthSnapshot } from "../../application/admin/system-operations-health";

export interface SystemOperationsHealthDashboardProps {
  readonly health: SystemOperationsHealthSnapshot;
}

export function SystemOperationsHealthDashboard({ health }: SystemOperationsHealthDashboardProps) {
  return (
    <section className="admin-system-health" aria-labelledby="admin-system-health-title">
      <header>
        <p className="eyebrow">Integrations &amp; System</p>
        <h1 id="admin-system-health-title">System Operations Health</h1>
        <p>
          Overall status: <strong>{health.overall}</strong> · generated {health.generatedAt}
        </p>
      </header>

      <dl className="admin-system-health-summary">
        <div><dt>Operational</dt><dd>{health.operationalCount}</dd></div>
        <div><dt>Degraded</dt><dd>{health.degradedCount}</dd></div>
        <div><dt>Outage</dt><dd>{health.outageCount}</dd></div>
        <div><dt>Unknown</dt><dd>{health.unknownCount}</dd></div>
        <div><dt>Not configured</dt><dd>{health.notConfiguredCount}</dd></div>
      </dl>

      <div className="admin-system-health-grid">
        {health.measurements.map((measurement) => (
          <article key={measurement.surface} data-state={measurement.state}>
            <header>
              <h2>{measurement.surface.replaceAll("-", " ")}</h2>
              <span>{measurement.state}</span>
            </header>
            <p>{measurement.summary}</p>
            <dl>
              <dt>Source</dt><dd>{measurement.source}</dd>
              <dt>Checked</dt><dd>{measurement.checkedAt}</dd>
              <dt>Version</dt><dd>{measurement.version ?? "—"}</dd>
              {measurement.diagnosticReference ? (
                <><dt>Diagnostic</dt><dd>{measurement.diagnosticReference}</dd></>
              ) : null}
            </dl>
            {Object.keys(measurement.metrics).length > 0 ? (
              <ul>
                {Object.entries(measurement.metrics).map(([key, value]) => (
                  <li key={key}><span>{key}</span>: <strong>{String(value ?? "—")}</strong></li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
