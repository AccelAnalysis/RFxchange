import type { AdministrativeWorkItem } from "../../domain/admin-work-queue/model";

export function UnifiedAdministrativeWorkQueue({ items }: Readonly<{ items: readonly AdministrativeWorkItem[] }>) {
  return (
    <section aria-labelledby="admin-work-queue-heading">
      <h1 id="admin-work-queue-heading">Unified work queue</h1>
      <table>
        <thead>
          <tr>
            <th>Case</th><th>Type</th><th>Severity</th><th>Status</th><th>Organization</th><th>User</th><th>Geography</th><th>Assigned</th><th>SLA</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.caseNumber}</td>
              <td>{item.type}</td>
              <td>{item.severity}</td>
              <td>{item.status}</td>
              <td>{item.organizationId ?? "—"}</td>
              <td>{item.userId ?? "—"}</td>
              <td>{item.geography ?? "—"}</td>
              <td>{item.assignedAdministratorId ?? "Unassigned"}</td>
              <td>{item.slaDueAt ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
