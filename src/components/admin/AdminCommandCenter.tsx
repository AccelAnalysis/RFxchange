import Link from "next/link";

import type { AdministrativeCommandCenter } from "../../application/admin/command-center";

import styles from "./AdminOperatingCore.module.css";

function queueHref(key: AdministrativeCommandCenter["attentionQueues"][number]["key"]): string {
  if (key === "claims-awaiting-review") return "/admin/organization-claims";
  if (key === "resource-provider-applications") return "/admin/resource-providers";
  return "/admin/work-queues";
}

export function AdminCommandCenter({
  model,
  assignedToMe,
  unassigned,
  overdue,
}: Readonly<{
  model: AdministrativeCommandCenter;
  assignedToMe: number;
  unassigned: number;
  overdue: number;
}>) {
  return (
    <section className={styles.workspace} aria-labelledby="admin-command-center-heading">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Administration</p>
          <h1 id="admin-command-center-heading">What needs attention?</h1>
          <p className={styles.intro}>
            Start with work that requires a decision, response, correction, or operational follow-up.
            Counts and health signals are limited to the authority active for this workspace.
          </p>
        </div>
        <div className={styles.summary} aria-label={`${model.totalAttentionCount} attention items`}>
          <strong>{model.totalAttentionCount}</strong>
          <span>attention items</span>
        </div>
      </header>

      <div className={styles.highlightStrip} aria-label="Work queue highlights">
        <div><span>Assigned to me</span><strong>{assignedToMe}</strong></div>
        <div><span>Unassigned</span><strong>{unassigned}</strong></div>
        <div><span>Overdue</span><strong>{overdue}</strong></div>
      </div>

      <section className={styles.section} aria-labelledby="attention-queues-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Operate</p>
            <h2 id="attention-queues-heading">Attention queues</h2>
          </div>
          <Link href="/admin/work-queues">Open work queues</Link>
        </div>
        {model.attentionQueues.length ? (
          <ul className={styles.attentionList}>
            {model.attentionQueues.map((queue) => (
              <li className={styles.attentionRow} key={queue.key}>
                <Link href={queueHref(queue.key)}>
                  <strong>{queue.label}</strong>
                </Link>
                <span className={styles.attentionCount}>{queue.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <strong>No attention queues are available in this access context.</strong>
            <p>The workspace does not invent counts for permissions that are not currently granted.</p>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="platform-health-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Conditions</p>
            <h2 id="platform-health-heading">Platform health</h2>
          </div>
        </div>
        {model.healthPanels.length ? (
          <ul className={styles.healthList}>
            {model.healthPanels.map((panel) => (
              <li className={styles.healthRow} key={panel.key}>
                <div>
                  <strong>{panel.label}</strong>
                </div>
                <div className={styles.metricLine}>
                  {panel.metrics.map((item) => (
                    <span key={item.key}>{item.label}: {item.value}</span>
                  ))}
                </div>
                <span className={styles.healthState} data-state={panel.status}>{panel.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <strong>No health domains are available in this access context.</strong>
            <p>Unavailable telemetry remains unavailable rather than being presented as healthy.</p>
          </div>
        )}
      </section>
    </section>
  );
}
