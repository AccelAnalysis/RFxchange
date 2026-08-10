import type { AdminPermissionKey, PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { requireCataloguedAdminPermission } from "../../domain/admin-authorization/model.ts";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
  type AdminGrantScope,
  type AdminPermissionGrant,
} from "../../domain/admin-authorization/grants.ts";

export const ADMIN_PORTAL_SECTION_KEYS = [
  "overview",
  "work-queues",
  "organizations",
  "users-access",
  "claims-verification",
  "rfx-opportunities",
  "referrals-teaming",
  "resource-providers",
  "credibility",
  "trust-safety",
  "geographies",
  "institutions-partners",
  "commerce",
  "support-feedback",
  "communications",
  "analytics",
  "policies-configuration",
  "integrations-system",
  "audit-security",
] as const;

export type AdminPortalSectionKey = (typeof ADMIN_PORTAL_SECTION_KEYS)[number];

export interface AdminPortalSection {
  readonly key: AdminPortalSectionKey;
  readonly label: string;
  readonly href: `/admin/${string}`;
  readonly description: string;
  /** Any one of these permissions grants section visibility. Action authorization remains separate. */
  readonly visibilityPermissions: readonly AdminPermissionKey[];
}

function P(...values: string[]): readonly AdminPermissionKey[] {
  return Object.freeze(values.map(requireCataloguedAdminPermission));
}

export const ADMIN_PORTAL_SECTIONS: readonly AdminPortalSection[] = Object.freeze([
  Object.freeze({ key: "overview", label: "Overview", href: "/admin/overview", description: "Global command center.", visibilityPermissions: P("admin.authority.read", "analytics.dashboard.read") }),
  Object.freeze({ key: "work-queues", label: "Work Queues", href: "/admin/work-queues", description: "Unified work requiring human action.", visibilityPermissions: P("support.case.read", "trust.report.read", "provider.application.read", "rfx.record.read") }),
  Object.freeze({ key: "organizations", label: "Organizations", href: "/admin/organizations", description: "Organization records and Organization 360.", visibilityPermissions: P("organization.profile.read") }),
  Object.freeze({ key: "users-access", label: "Users & Access", href: "/admin/users-access", description: "User accounts, memberships, roles and permissions.", visibilityPermissions: P("user.access.read") }),
  Object.freeze({ key: "claims-verification", label: "Claims & Verification", href: "/admin/claims-verification", description: "Claims, identity verification and authority.", visibilityPermissions: P("credibility.organization.verify", "provider.application.review") }),
  Object.freeze({ key: "rfx-opportunities", label: "RFx & Opportunities", href: "/admin/rfx-opportunities", description: "Marketplace lifecycle and process oversight.", visibilityPermissions: P("rfx.record.read") }),
  Object.freeze({ key: "referrals-teaming", label: "Referrals & Teaming", href: "/admin/referrals-teaming", description: "Connections, teaming and disputes.", visibilityPermissions: P("referral.record.read") }),
  Object.freeze({ key: "resource-providers", label: "Resource Providers", href: "/admin/resource-providers", description: "Provider applications and resource operations.", visibilityPermissions: P("provider.application.read") }),
  Object.freeze({ key: "credibility", label: "Credibility", href: "/admin/credibility", description: "Badges, endorsements, feedback and integrity.", visibilityPermissions: P("credibility.organization.verify", "credibility.badge.award") }),
  Object.freeze({ key: "trust-safety", label: "Trust & Safety", href: "/admin/trust-safety", description: "Reports, restrictions, suspensions and investigations.", visibilityPermissions: P("trust.report.read") }),
  Object.freeze({ key: "geographies", label: "Geographies", href: "/admin/geographies", description: "Network releases, boundaries and locality administration.", visibilityPermissions: P("geography.definition.read") }),
  Object.freeze({ key: "institutions-partners", label: "Institutions & Partners", href: "/admin/institutions-partners", description: "Institutional programs and partner relationships.", visibilityPermissions: P("geography.release.read") }),
  Object.freeze({ key: "commerce", label: "Commerce", href: "/admin/commerce", description: "Plans, subscriptions, credits, payments and referral economics.", visibilityPermissions: P("commerce.account.read") }),
  Object.freeze({ key: "support-feedback", label: "Support & Feedback", href: "/admin/support-feedback", description: "Member cases, bugs, feedback and Founder channel.", visibilityPermissions: P("support.case.read") }),
  Object.freeze({ key: "communications", label: "Communications", href: "/admin/communications", description: "Announcements, notifications, campaigns and templates.", visibilityPermissions: P("admin.authority.read") }),
  Object.freeze({ key: "analytics", label: "Analytics", href: "/admin/analytics", description: "Network, commercial, engagement and trust intelligence.", visibilityPermissions: P("analytics.dashboard.read") }),
  Object.freeze({ key: "policies-configuration", label: "Policies & Configuration", href: "/admin/policies-configuration", description: "Rules, definitions, templates and feature flags.", visibilityPermissions: P("platform.policy.read", "config.value.read") }),
  Object.freeze({ key: "integrations-system", label: "Integrations & System", href: "/admin/integrations-system", description: "API health and technical operations.", visibilityPermissions: P("system.health.read") }),
  Object.freeze({ key: "audit-security", label: "Audit & Security", href: "/admin/audit-security", description: "Immutable administrative record and access oversight.", visibilityPermissions: P("audit.event.read", "admin.authority.read") }),
]);

export function visibleAdminPortalSections(
  context: PlatformAdministratorAuthorityContext,
): readonly AdminPortalSection[] {
  return Object.freeze(
    ADMIN_PORTAL_SECTIONS.filter((section) =>
      section.visibilityPermissions.some((permission) => context.effectivePermissions.includes(permission)),
    ),
  );
}

export function canAccessAdminPortalSection(
  context: PlatformAdministratorAuthorityContext,
  sectionKey: AdminPortalSectionKey,
): boolean {
  return visibleAdminPortalSections(context).some((section) => section.key === sectionKey);
}

export function assertAdminPortalSectionAccess(
  context: PlatformAdministratorAuthorityContext,
  sectionKey: AdminPortalSectionKey,
): AdminPortalSection {
  const section = ADMIN_PORTAL_SECTIONS.find((candidate) => candidate.key === sectionKey);
  if (!section) throw new Error(`Unknown administrative portal section: ${sectionKey}.`);
  if (!canAccessAdminPortalSection(context, sectionKey)) {
    throw new Error(`Administrative portal section access denied: ${sectionKey}.`);
  }
  return section;
}

export const IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS = [
  "organization-claims",
  "resource-providers",
] as const;

export type ImplementedAdminRuntimeDestinationKey =
  (typeof IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS)[number];

interface ImplementedAdminRuntimeRegistration {
  readonly key: ImplementedAdminRuntimeDestinationKey;
  readonly labelKey: "organizationClaims" | "resourceProviders";
  readonly description: string;
  readonly permission: AdminPermissionKey;
  readonly supportedScopeKinds: readonly AdminGrantScope["kind"][];
  readonly href: (scope: AdminGrantScope) => `/admin/${string}`;
}

export interface ImplementedAdminRuntimeDestination {
  readonly navigationId: string;
  readonly key: ImplementedAdminRuntimeDestinationKey;
  readonly labelKey: ImplementedAdminRuntimeRegistration["labelKey"];
  readonly description: string;
  readonly permission: AdminPermissionKey;
  readonly scope: AdminGrantScope;
  readonly grantId: string;
  readonly href: `/admin/${string}`;
}

/**
 * Server-owned registry of protected administrative routes that have truthful production runtimes.
 * Specification-only portal sections intentionally remain outside this registry.
 */
const IMPLEMENTED_ADMIN_RUNTIME_REGISTRY: readonly ImplementedAdminRuntimeRegistration[] =
  Object.freeze([
    Object.freeze({
      key: "organization-claims",
      labelKey: "organizationClaims",
      description: "Review live organization authority claims within the active grant scope.",
      permission: requireCataloguedAdminPermission("organization.claim.read"),
      supportedScopeKinds: Object.freeze(["GLOBAL", "GEOGRAPHY"] as const),
      href: (scope: AdminGrantScope): `/admin/${string}` => scope.kind === "GEOGRAPHY"
        ? `/admin/organization-claims?geographyId=${encodeURIComponent(String(scope.targetId))}`
        : "/admin/organization-claims",
    }),
    Object.freeze({
      key: "resource-providers",
      labelKey: "resourceProviders",
      description: "Review live Official Resource Provider applications within the active grant scope.",
      permission: requireCataloguedAdminPermission("provider.application.read"),
      supportedScopeKinds: Object.freeze(["GLOBAL", "ORGANIZATION"] as const),
      href: (scope: AdminGrantScope): `/admin/${string}` => scope.kind === "ORGANIZATION"
        ? `/admin/resource-providers?organizationId=${encodeURIComponent(String(scope.targetId))}`
        : "/admin/resource-providers",
    }),
  ]);

function scopePriority(scope: AdminGrantScope): number {
  return scope.kind === "GLOBAL" ? 0 : 1;
}

/**
 * Produces only destinations that are both implemented and authorized by a current exact grant.
 * The returned href preserves a bounded grant scope instead of widening it to GLOBAL.
 */
export function visibleImplementedAdminRuntimeDestinations(
  context: PlatformAdministratorAuthorityContext,
  grants: readonly AdminPermissionGrant[],
  now: string,
): readonly ImplementedAdminRuntimeDestination[] {
  return Object.freeze(
    IMPLEMENTED_ADMIN_RUNTIME_REGISTRY.flatMap((registration) => {
      const candidateScopes = [...new Map(grants
        .filter((grant) =>
          grant.administratorId === context.administratorId &&
          grant.permission === registration.permission &&
          registration.supportedScopeKinds.includes(grant.scope.kind),
        )
        .map((grant) => [grant.scope.value, grant.scope] as const),
      ).values()]
        .sort((left, right) =>
          scopePriority(left) - scopePriority(right) || left.value.localeCompare(right.value),
        );

      return candidateScopes.flatMap((scope) => {
        const decision = authorizeScopedAdministrativeAction(
          context,
          grants,
          createScopedAdministrativeActionRequirement({
            permission: registration.permission,
            access: "read",
            scope: scope.value,
          }),
          // The landing routes do not accept action-specific condition evidence. A conditioned
          // grant therefore remains hidden until the destination can resolve that evidence too.
          { now, satisfiedConditionKeys: Object.freeze([]) },
        );
        if (decision.kind === "allow") {
          return [Object.freeze({
            navigationId: `${registration.key}:${scope.value}`,
            key: registration.key,
            labelKey: registration.labelKey,
            description: registration.description,
            permission: registration.permission,
            scope,
            grantId: String(decision.grantId),
            href: registration.href(scope),
          })];
        }
        return [];
      });
    }),
  );
}
