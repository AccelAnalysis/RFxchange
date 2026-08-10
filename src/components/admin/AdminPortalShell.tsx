import type { ReactNode } from "react";
import type {
  ImplementedAdminRuntimeDestination,
  ImplementedAdminRuntimeDestinationKey,
} from "../../application/admin/portal-navigation";
import { AdminPortalNavigation } from "./AdminPortalNavigation";

import styles from "./AdminPortalShell.module.css";

export interface AdminPortalShellProps {
  readonly destinations: readonly ImplementedAdminRuntimeDestination[];
  readonly currentDestination: ImplementedAdminRuntimeDestinationKey;
  readonly currentScope: string;
  readonly children: ReactNode;
}

export function AdminPortalShell({ destinations, currentDestination, currentScope, children }: AdminPortalShellProps) {
  const navigationDestinations = destinations.map(({ navigationId, key, labelKey, description, href, scope }) =>
    Object.freeze({
      navigationId,
      key,
      labelKey,
      description,
      href,
      scopeValue: scope.value,
      scopeTargetId: scope.kind === "GLOBAL" ? null : String(scope.targetId),
    }),
  );
  return (
    <div className={styles.shell}>
      <AdminPortalNavigation
        destinations={navigationDestinations}
        currentDestination={currentDestination}
        currentScope={currentScope}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
