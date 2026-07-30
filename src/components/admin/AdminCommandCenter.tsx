import type { AdministrativeCommandCenter } from "../../application/admin/command-center";

export function AdminCommandCenter({ model }: Readonly<{ model: AdministrativeCommandCenter }>) {
  return (
    <section aria-labelledby="admin-command-center-heading">
      <header>
        <h1 id="admin-command-center-heading">What needs attention?</h1>
        <p>{model.totalAttentionCount} open items across the queues you can access.</p>
      </header>
      <div aria-label="Administrative attention queues">
        {model.attentionQueues.map((queue) => (
          <article key={queue.key}>
            <h2>{queue.label}</h2>
            <p>{queue.count}</p>
          </article>
        ))}
      </div>
      <section aria-labelledby="platform-health-heading">
        <h2 id="platform-health-heading">Platform health</h2>
        {model.healthPanels.map((panel) => (
          <article key={panel.key}>
            <h3>{panel.label}</h3>
            <p>{panel.status}</p>
            <dl>
              {panel.metrics.map((metric) => (
                <div key={metric.key}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </section>
  );
}
