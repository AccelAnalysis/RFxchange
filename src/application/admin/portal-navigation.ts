import type { AdminPermissionKey, PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { requireCataloguedAdminPermission } from "../../domain/admin-authorization/model.ts";

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
