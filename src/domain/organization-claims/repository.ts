import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { GeographyId } from "../geography/model.ts";
import type { AccessLifecycleRecord } from "../lifecycle/model.ts";
import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembership, UserId } from "../users/model.ts";
import type {
  OrganizationAuthorityClaim,
  OrganizationAuthorityClaimEvent,
  OrganizationAuthorityClaimId,
  OrganizationAuthorityClaimStatus,
  OrganizationAuthorityDecision,
} from "./model.ts";
import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";

export interface OrganizationAuthorityClaimRepository {
  getById(id: OrganizationAuthorityClaimId): Promise<OrganizationAuthorityClaim | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationAuthorityClaim[]>;
  listByUserId(userId: UserId): Promise<readonly OrganizationAuthorityClaim[]>;
  listByStatus(status: OrganizationAuthorityClaimStatus): Promise<readonly OrganizationAuthorityClaim[]>;
  listByGeographyId(geographyId: GeographyId): Promise<readonly OrganizationAuthorityClaim[]>;
  create(claim: OrganizationAuthorityClaim, event: OrganizationAuthorityClaimEvent): Promise<void>;
}

export interface OrganizationAuthorityClaimUnitOfWork {
  update(input: Readonly<{
    claim: OrganizationAuthorityClaim;
    event: OrganizationAuthorityClaimEvent;
    decision?: OrganizationAuthorityDecision;
    auditEvent?: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
  approve(input: Readonly<{
    claim: OrganizationAuthorityClaim;
    event: OrganizationAuthorityClaimEvent;
    decision: OrganizationAuthorityDecision;
    membership: OrganizationMembership;
    authorization: OrganizationUserAuthorization;
    lifecycle: AccessLifecycleRecord;
    auditEvent?: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
  establishParticipantCreated(input: Readonly<{
    membership: OrganizationMembership;
    authorization: OrganizationUserAuthorization;
    lifecycle: AccessLifecycleRecord;
    auditEvent: OrganizationActionAuditEvent;
  }>): Promise<void>;
}
