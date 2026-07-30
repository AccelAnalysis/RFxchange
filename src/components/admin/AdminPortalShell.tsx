import type { ReactNode } from "react";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model";
import { AdminPortalNavigation } from "./AdminPortalNavigation";

export interface AdminPortalShellProps {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly currentPath: string;
  readonly children: ReactNode;
}

export function AdminPortalShell({ authority, currentPath, children }: AdminPortalShellProps) {
  return (
    <div className="admin-portal-shell">
      <AdminPortalNavigation authority={authority} currentPath={currentPath} />
      <main className="admin-portal-main">{children}</main>
    </div>
  );
}
