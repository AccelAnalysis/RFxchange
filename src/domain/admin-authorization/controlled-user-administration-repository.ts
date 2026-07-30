import type { PlatformAdministrativeAuditEvent } from "./admin-audit.ts";
import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import type { AccessRestrictionRecord } from "../lifecycle/model.ts";
import type { OrganizationUserInvitation } from "../organization-invitations/model.ts";
import type { OrganizationMembership } from "../users/model.ts";

export type ControlledUserAdministrationMutation =
  | Readonly<{ kind: "invitation"; mode: "create" | "update"; record: OrganizationUserInvitation }>
  | Readonly<{ kind: "membership"; mode: "update"; record: OrganizationMembership }>
  | Readonly<{ kind: "authorization"; mode: "update"; record: OrganizationUserAuthorization }>
  | Readonly<{ kind: "restriction"; mode: "create" | "update"; record: AccessRestrictionRecord }>;

/** State mutation and immutable administrative audit evidence commit atomically. */
export interface ControlledUserAdministrationUnitOfWork {
  commit(input: Readonly<{
    mutation: ControlledUserAdministrationMutation;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
}
