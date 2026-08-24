import type { ReactNode } from "react";
import type {
  ImplementedAdminRuntimeDestination,
  ImplementedAdminRuntimeDestinationKey,
} from "../../application/admin/portal-navigation";
import { AdminPortalNavigation } from "./AdminPortalNavigation";

import styles from "./AdminPortalShell.module.css";

export interface AdminPortalShellProps {
  readonly destinations: readonly ImplementedAdminRuntimeDestination[];
  readonly currentDestination?: ImplementedAdminRuntimeDestinationKey;
  readonly currentScope: string;
  readonly children: ReactNode;
}

function scopePresentation(scope: string): Readonly<{ label: string; detail: string | null }> {
  if (scope === "GLOBAL") {
    return Object.freeze({ label: "All authorized records", detail: null });
  }

  const [rawKind, ...rawTarget] = scope.split(":");
  const kind = rawKind.toUpperCase();
  const labels: Readonly<Record<string, string>> = Object.freeze({
    GEOGRAPHY: "Geography access",
    ORGANIZATION: "Organization access",
    CASE: "Case access",
  });

  return Object.freeze({
    label: labels[kind] ?? "Scoped access",
    detail: rawTarget.join(":") || null,
  });
}

export function AdminPortalShell({
  destinations,
  currentDestination,
  currentScope,
  children,
}: AdminPortalShellProps) {
  const navigationDestinations = destinations.map(({
    navigationId,
    key,
    labelKey,
    description,
    href,
    scope,
  }) => Object.freeze({
    navigationId,
    key,
    labelKey,
    description,
    href,
    scopeValue: scope.value,
    scopeTargetId: scope.kind === "GLOBAL" ? null : String(scope.targetId),
  }));
  const scope = scopePresentation(currentScope);

  return (
    <div className={styles.shell}>
      <AdminPortalNavigation
        destinations={navigationDestinations}
        currentDestination={currentDestination}
        currentScope={currentScope}
      />
      <section className={styles.contentColumn}>
        <header className={styles.contextBar} aria-label="Administrative access context">
          <div className={styles.contextCopy}>
            <span>Current access</span>
            <strong>{scope.label}</strong>
            {scope.detail ? <small>{scope.detail}</small> : null}
          </div>
          <div className={styles.contextState}>
            <span aria-hidden="true" />
            Administration
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </section>
    </div>
  );
}
