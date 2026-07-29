import type { OrganizationId } from "../organizations/model";
import type { OrganizationMembershipId, UserId } from "../users/model";
import type { OrganizationActionAuditEvent, OrganizationAuditEventId } from "./model";

/**
 * Append-only persistence boundary for organization user-action history.
 * Corrections, retention policy, export and administrator audit controls are separate concerns.
 */
export interface OrganizationAuditRepository {
  append(event: OrganizationActionAuditEvent): Promise<void>;
  getById(id: OrganizationAuditEventId): Promise<OrganizationActionAuditEvent | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationActionAuditEvent[]>;
  listByActorUserId(userId: UserId): Promise<readonly OrganizationActionAuditEvent[]>;
  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly OrganizationActionAuditEvent[]>;
}

export interface AuditRepositories {
  readonly organizationAudit: OrganizationAuditRepository;
}
