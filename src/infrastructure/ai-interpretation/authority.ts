import type { OrganizationPermission } from "../../domain/authorization/model.ts";
import { authorizeOrganizationOperation, type OrganizationOperationAuthorizationDependencies } from "../../application/auth/authorize-organization-operation.ts";
import type { InterpretationAuthorityPort } from "../../application/ai-interpretation/ports.ts";
import type { AmacsInterpretationPurpose } from "../../domain/amacs/contracts.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";

const PURPOSE_PERMISSION: Readonly<Record<AmacsInterpretationPurpose, OrganizationPermission>> = Object.freeze({
  seller_capability_declaration: "organization.profile.manage", buyer_need_definition: "rfx.create",
  provider_service_definition: "resource.manage", evidence_linking: "document.manage", request_structure: "rfx.create",
  response_assistance: "response.create", outcome_classification: "organization.profile.manage", other: "organization.profile.manage",
});

export class CanonicalInterpretationAuthority implements InterpretationAuthorityPort {
  private readonly dependencies: OrganizationOperationAuthorizationDependencies;
  constructor(dependencies: OrganizationOperationAuthorizationDependencies) { this.dependencies = dependencies; }
  async authorize(input: Parameters<InterpretationAuthorityPort["authorize"]>[0]) {
    const decision = await authorizeOrganizationOperation({ context: input.context, organizationId: organizationId(input.organizationId), membershipId: organizationMembershipId(input.membershipId), permission: PURPOSE_PERMISSION[input.purpose] }, this.dependencies);
    if (!decision.allowed) return Object.freeze({ allowed: false as const, reason: decision.reason });
    return Object.freeze({ allowed: true as const, scope: Object.freeze({ organizationId: String(decision.organization.id), membershipId: String(decision.membership.id), userId: String(decision.context.user.id), tenantId: String(decision.organization.id) }) });
  }
}
