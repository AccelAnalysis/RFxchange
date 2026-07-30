import type { ReactNode } from "react";
import type { AdminUniversalSearchResponse } from "../../application/admin/universal-search";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model";
import { AdminPortalNavigation } from "./AdminPortalNavigation";
import { AdminUniversalSearch } from "./AdminUniversalSearch";

export interface AdminPortalShellProps {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly currentPath: string;
  readonly searchResponse?: AdminUniversalSearchResponse | null;
  readonly children: ReactNode;
}

export function AdminPortalShell({
  authority,
  currentPath,
  searchResponse = null,
  children,
}: AdminPortalShellProps) {
  return (
    <div className="admin-portal-shell">
      <AdminPortalNavigation authority={authority} currentPath={currentPath} />
      <main className="admin-portal-main">
        <AdminUniversalSearch response={searchResponse} />
        {children}
      </main>
    </div>
  );
}
