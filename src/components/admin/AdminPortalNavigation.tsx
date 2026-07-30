import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model";
import { visibleAdminPortalSections } from "../../application/admin/portal-navigation";

export interface AdminPortalNavigationProps {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly currentPath?: string;
}

export function AdminPortalNavigation({ authority, currentPath }: AdminPortalNavigationProps) {
  const sections = visibleAdminPortalSections(authority);

  return (
    <nav aria-label="Administrative portal" className="admin-portal-nav">
      <div className="admin-portal-nav-heading">
        <span>RFxchange</span>
        <strong>Administration</strong>
      </div>
      <ul>
        {sections.map((section) => (
          <li key={section.key}>
            <a
              href={section.href}
              aria-current={currentPath === section.href ? "page" : undefined}
              title={section.description}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
