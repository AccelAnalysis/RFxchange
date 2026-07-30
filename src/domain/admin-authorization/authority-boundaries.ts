import {
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AdministrativeBoundaryEventId = Brand<string, "AdministrativeBoundaryEventId">;
export type AdministrativeBoundaryTimestamp = Brand<string, "AdministrativeBoundaryTimestamp">;

export const RESERVED_SUPER_ADMIN_ACTIONS = [
  "super-admin.grant",
  "super-admin.remove",
  "permission-template.global.change",
  "organization.permanent-terminate",
  "integrity-hold.override",
  "commercial-terms.global.change",
  "founding-policy-history.change",
  "verification-standard.change",
  "credibility-algorithm.change",
  "retention-requirement.override",
  "production-emergency.authorize",
  "restricted-system-data.unlock",
  "production-integration.manage",
  "destructive-data-operation.approve",
] as const;

export type ReservedSuperAdminAction = (typeof RESERVED_SUPER_ADMIN_ACTIONS)[number];

export const MARKETPLACE_ADMIN_PROHIBITED_ACTIONS = [
  "rfx.requirements.rewrite-without-issuer-authorization",
  "rfx.evaluator-score.change",
  "rfx.winner.select",
  "rfx.submission.fabricate",
  "rfx.submission.change-after-deadline",
  "rfx.award.insert",
  "rfx.valid-response.suppress-for-preference",
  "rfx.confidential-response.expose",
  "rfx.procurement-rule.retroactive-change",
] as const;

export type MarketplaceAdminProhibitedAction = (typeof MARKETPLACE_ADMIN_PROHIBITED_ACTIONS)[number];

export const CROSS_DOMAIN_ADMIN_PROHIBITED_ACTIONS = [
  "institutional-admin.business-ownership.assume",
  "support.user.silent-impersonation",
  "payment.matching-rank.boost",
  "access-removal.history.erase",
] as const;

export type CrossDomainAdminProhibitedAction = (typeof CROSS_DOMAIN_ADMIN_PROHIBITED_ACTIONS)[number];

export type AdministrativeBoundaryAction =
  | ReservedSuperAdminAction
  | MarketplaceAdminProhibitedAction
  | CrossDomainAdminProhibitedAction;

export type AdministrativeBoundaryDecision =
  | Readonly<{
      readonly kind: "allow";
      readonly administratorId: PlatformAdministratorId;
      readonly action: ReservedSuperAdminAction;
      readonly requiredPermissions: readonly AdminPermissionKey[];
    }>
  | Readonly<{
      readonly kind: "deny";
      readonly administratorId: PlatformAdministratorId;
      readonly action: AdministrativeBoundaryAction;
      readonly reason:
        | "reserved-authority-not-satisfied"
        | "issuer-authority-required"
        | "separation-of-authority";
      readonly missingPermissions: readonly AdminPermissionKey[];
    }>;

export interface AdministrativeBoundaryEvent {
  readonly id: AdministrativeBoundaryEventId;
  readonly administratorId: PlatformAdministratorId;
  readonly action: AdministrativeBoundaryAction;
  readonly outcome: "allowed" | "denied";
  readonly reason: string;
  readonly occurredAt: AdministrativeBoundaryTimestamp;
  readonly missingPermissions: readonly AdminPermissionKey[];
}

export interface EvaluateAdministrativeBoundaryInput {
  readonly eventId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string): AdministrativeBoundaryTimestamp {
  const normalized = requiredValue(value, "Administrative boundary timestamp");
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error("Administrative boundary timestamp must be a valid date-time.");
  return new Date(parsed).toISOString() as AdministrativeBoundaryTimestamp;
}

function eventId(value: string): AdministrativeBoundaryEventId {
  return requiredValue(value, "Administrative boundary event id") as AdministrativeBoundaryEventId;
}

const P = (...values: string[]): readonly AdminPermissionKey[] =>
  Object.freeze(values.map(requireCataloguedAdminPermission));

/**
 * Reserved authority remains permission-driven. No runtime decision branches on a role name.
 * The current default Super Admin bundle satisfies every requirement; ordinary presets do not.
 */
export const RESERVED_SUPER_ADMIN_REQUIREMENTS: Readonly<
  Record<ReservedSuperAdminAction, readonly AdminPermissionKey[]>
> = Object.freeze({
  "super-admin.grant": P(
    "admin.lifecycle.access.manage",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "super-admin.remove": P(
    "admin.lifecycle.access.manage",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "permission-template.global.change": P(
    "admin.lifecycle.access.manage",
    "config.history.read",
    "audit.correction.append",
  ),
  "organization.permanent-terminate": P(
    "admin.lifecycle.disable",
    "trust.case.review",
    "audit.correction.append",
  ),
  "integrity-hold.override": P(
    "trust.case.review",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "commercial-terms.global.change": P(
    "platform.policy.change-directive.read",
    "commerce.adjustment.review",
    "audit.correction.append",
  ),
  "founding-policy-history.change": P(
    "platform.policy.change-directive.read",
    "config.history.read",
    "audit.correction.append",
  ),
  "verification-standard.change": P(
    "platform.policy.change-directive.read",
    "credibility.organization.verify",
    "audit.correction.append",
  ),
  "credibility-algorithm.change": P(
    "platform.policy.change-directive.read",
    "credibility.record.correct",
    "audit.correction.append",
  ),
  "retention-requirement.override": P(
    "platform.policy.change-directive.read",
    "config.history.read",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "production-emergency.authorize": P(
    "system.maintenance.request",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "restricted-system-data.unlock": P(
    "system.health.read",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "production-integration.manage": P(
    "system.maintenance.request",
    "config.history.read",
    "admin.security.reauthentication.require",
    "audit.correction.append",
  ),
  "destructive-data-operation.approve": P(
    "admin.security.reauthentication.require",
    "config.history.read",
    "audit.correction.append",
  ),
});

function isReservedAction(action: AdministrativeBoundaryAction): action is ReservedSuperAdminAction {
  return (RESERVED_SUPER_ADMIN_ACTIONS as readonly string[]).includes(action);
}

function isMarketplaceProhibited(action: AdministrativeBoundaryAction): action is MarketplaceAdminProhibitedAction {
  return (MARKETPLACE_ADMIN_PROHIBITED_ACTIONS as readonly string[]).includes(action);
}

export function authorizeAdministrativeBoundaryAction(
  context: PlatformAdministratorAuthorityContext,
  action: AdministrativeBoundaryAction,
): AdministrativeBoundaryDecision {
  if (isMarketplaceProhibited(action)) {
    return Object.freeze({
      kind: "deny" as const,
      administratorId: context.administratorId,
      action,
      reason: "issuer-authority-required" as const,
      missingPermissions: Object.freeze([]),
    });
  }

  if (!isReservedAction(action)) {
    return Object.freeze({
      kind: "deny" as const,
      administratorId: context.administratorId,
      action,
      reason: "separation-of-authority" as const,
      missingPermissions: Object.freeze([]),
    });
  }

  const requiredPermissions = RESERVED_SUPER_ADMIN_REQUIREMENTS[action];
  const missingPermissions = requiredPermissions.filter(
    (permission) => !context.effectivePermissions.includes(permission),
  );
  if (missingPermissions.length > 0) {
    return Object.freeze({
      kind: "deny" as const,
      administratorId: context.administratorId,
      action,
      reason: "reserved-authority-not-satisfied" as const,
      missingPermissions: Object.freeze(missingPermissions),
    });
  }

  return Object.freeze({
    kind: "allow" as const,
    administratorId: context.administratorId,
    action,
    requiredPermissions,
  });
}

export function evaluateAndRecordAdministrativeBoundary(
  context: PlatformAdministratorAuthorityContext,
  action: AdministrativeBoundaryAction,
  input: EvaluateAdministrativeBoundaryInput,
): Readonly<{ readonly decision: AdministrativeBoundaryDecision; readonly event: AdministrativeBoundaryEvent }> {
  const decision = authorizeAdministrativeBoundaryAction(context, action);
  const event: AdministrativeBoundaryEvent = Object.freeze({
    id: eventId(input.eventId),
    administratorId: context.administratorId,
    action,
    outcome: decision.kind === "allow" ? "allowed" : "denied",
    reason: requiredValue(input.reason, "Administrative boundary reason"),
    occurredAt: timestamp(input.occurredAt),
    missingPermissions:
      decision.kind === "deny" ? decision.missingPermissions : Object.freeze([]),
  });
  return Object.freeze({ decision, event });
}

export interface AdministrativeSeparationInvariant {
  readonly key: string;
  readonly statement: string;
}

export const ADMINISTRATIVE_SEPARATION_INVARIANTS: readonly AdministrativeSeparationInvariant[] =
  Object.freeze([
    Object.freeze({
      key: "verification-not-endorsement",
      statement: "Verification authority does not imply endorsement authority.",
    }),
    Object.freeze({
      key: "membership-not-credibility",
      statement: "Membership state does not create credibility authority or credibility outcomes.",
    }),
    Object.freeze({
      key: "payment-not-matching-rank",
      statement: "Payment or commercial status does not improve matching rank.",
    }),
    Object.freeze({
      key: "admin-not-issuer",
      statement: "Platform administrators cannot select RFx winners through administrative authority.",
    }),
    Object.freeze({
      key: "institutional-admin-not-business-owner",
      statement: "Institutional administration does not create ownership of local businesses.",
    }),
    Object.freeze({
      key: "support-not-user-impersonation",
      statement: "Support authority does not permit silent unrestricted user impersonation.",
    }),
    Object.freeze({
      key: "technical-not-marketplace",
      statement: "Technical maintenance authority does not imply marketplace authority.",
    }),
    Object.freeze({
      key: "access-removal-preserves-evidence",
      statement: "Removing access does not erase historical evidence.",
    }),
    Object.freeze({
      key: "admin-actions-attributable",
      statement: "Administrative actions remain attributable to an individual administrator.",
    }),
  ]);
