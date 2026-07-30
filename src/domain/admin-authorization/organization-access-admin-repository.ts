import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import type { OrganizationRoleBundle } from "../authorization/organization-role-bundles.ts";
import type { OrganizationMembership } from "../users/model.ts";
import type { PlatformAdministrativeAuditEvent } from "./admin-audit.ts";

/**
 * Atomic administrative persistence boundary for organization access changes.
 * Access state and its canonical ADM-085 audit evidence must become visible together.
 */
export interface OrganizationAccessAdministrationUnitOfWork {
  saveMembershipAccess(input: Readonly<{
    membership?: OrganizationMembership;
    authorization?: OrganizationUserAuthorization;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;

  saveRoleBundle(input: Readonly<{
    bundle: OrganizationRoleBundle;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
}
