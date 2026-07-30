import type { PlatformAdministrativeAuditEvent } from "./admin-audit.ts";
import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import type { AccessRestrictionRecord } from "../lifecycle/model.ts";
import type { OrganizationUserInvitation } from "../organization-invitations/model.ts";
import type { OrganizationMembership } from "../users/model.ts";

export type ControlledUserAdministrationStateMutation =
  | Readonly<{
      readonly kind: "invitation";
      readonly mode: "create" | "update";
      readonly record: OrganizationUserInvitation;
    }>
  | Readonly<{
      readonly kind: "membership";
      readonly mode: "update";
      readonly record: OrganizationMembership;
    }>
  | Readonly<{
      readonly kind: "authorization";
      readonly mode: "update";
      readonly record: OrganizationUserAuthorization;
    }>
  | Readonly<{
      readonly kind: "restriction";
      readonly mode: "create" | "update";
      readonly record: AccessRestrictionRecord;
    }>;

/**
 * Atomic persistence boundary for ADM-068. The controlled user-access state mutation and its
 * canonical platform administrative audit event must become visible together or not at all.
 */
export interface ControlledUserAdministrationUnitOfWork {
  commit(input: Readonly<{
    mutation: ControlledUserAdministrationStateMutation;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
}
