import type { AdminPermissionKey, PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { requireCataloguedAdminPermission } from "../../domain/admin-authorization/model.ts";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
  type AdminGrantScope,
  type AdminPermissionGrant,
} from "../../domain/admin-authorization/grants.ts";

export const ADMIN_PORTAL_SECTION_KEYS = [
  "overview", "work-queues", "organizations", "users-access", "claims-verification",
  "geographies", "institutions-partners", "rfx-opportunities", "referrals-teaming",
  "resource-providers", "credibility", "trust-safety", "commerce", "support-feedback", "communications",
  "analytics", "policies-configuration", "integrations-system", "audit-security",
] as const;
export type AdminPortalSectionKey = (typeof ADMIN_PORTAL_SECTION_KEYS)[number];

export interface AdminPortalSection {
  readonly key: AdminPortalSectionKey;
  readonly label: string;
  readonly href: `/admin/${string}`;
  readonly description: string;
  readonly visibilityPermissions: readonly AdminPermissionKey[];
}
function P(...values: string[]): readonly AdminPermissionKey[] { return Object.freeze(values.map(requireCataloguedAdminPermission)); }

export const ADMIN_PORTAL_SECTIONS: readonly AdminPortalSection[] = Object.freeze([
  Object.freeze({ key:"overview",label:"Overview",href:"/admin/overview",description:"Attention-first administrative command center.",visibilityPermissions:P("admin.authority.read","analytics.dashboard.read","organization.claim.read","provider.application.read","support.case.read","trust.report.read","rfx.record.read","credibility.organization.verify","commerce.account.read","system.health.read") }),
  Object.freeze({ key:"work-queues",label:"Work Queues",href:"/admin/work-queues",description:"Unified work requiring human action.",visibilityPermissions:P("organization.claim.read","provider.application.read","support.case.read","trust.report.read","rfx.moderation.review","credibility.organization.verify","commerce.account.read","system.health.read") }),
  Object.freeze({ key:"organizations",label:"Organizations",href:"/admin/organizations",description:"Canonical organization records and Organization 360.",visibilityPermissions:P("organization.profile.read") }),
  Object.freeze({ key:"users-access",label:"Users & Access",href:"/admin/users",description:"Individual identity, memberships, roles and access.",visibilityPermissions:P("user.profile.read","user.access.read") }),
  Object.freeze({ key:"claims-verification",label:"Claims & Verification",href:"/admin/claims-verification",description:"Organization authority and independent verification as separate facts.",visibilityPermissions:P("organization.claim.read","credibility.organization.verify") }),
  Object.freeze({ key:"geographies",label:"Geographies",href:"/admin/geographies",description:"Physical geography, market overlays and release state.",visibilityPermissions:P("geography.definition.read","geography.release.read") }),
  Object.freeze({ key:"institutions-partners",label:"Institutions & Partners",href:"/admin/institutions",description:"Current delegated geography and program authority.",visibilityPermissions:P("geography.release.read") }),
  Object.freeze({ key:"rfx-opportunities",label:"RFx & Opportunities",href:"/admin/rfx",description:"RFx lifecycle, publication and operating exceptions.",visibilityPermissions:P("rfx.record.read") }),
  Object.freeze({ key:"referrals-teaming",label:"Referrals & Teaming",href:"/admin/referrals-teaming",description:"Governed referral, teaming and dispute operations.",visibilityPermissions:P("referral.record.read") }),
  Object.freeze({ key:"resource-providers",label:"Resource Providers",href:"/admin/resource-providers",description:"Provider applications, lifecycle and source-backed promotion.",visibilityPermissions:P("provider.application.read") }),
  Object.freeze({ key:"credibility",label:"Credibility",href:"/admin/credibility",description:"Verification and credential facts without hidden scoring.",visibilityPermissions:P("credibility.organization.verify","credibility.badge.award") }),
  Object.freeze({ key:"trust-safety",label:"Trust & Safety",href:"/admin/trust-safety",description:"Reports, restrictions, integrity holds and investigations.",visibilityPermissions:P("trust.report.read","trust.case.review") }),
  Object.freeze({ key:"commerce",label:"Commerce",href:"/admin/commerce",description:"RFxchange commercial accounts and billing operations.",visibilityPermissions:P("commerce.account.read") }),
  Object.freeze({ key:"support-feedback",label:"Support & Feedback",href:"/admin/support",description:"Canonical administrative support cases and feedback.",visibilityPermissions:P("support.case.read") }),
  Object.freeze({ key:"communications",label:"Communications",href:"/admin/communications",description:"Transactional delivery operations and bounded notices.",visibilityPermissions:P("admin.authority.read","system.health.read") }),
  Object.freeze({ key:"analytics",label:"Analytics",href:"/admin/analytics",description:"Privacy-safe operating intelligence and drill-through.",visibilityPermissions:P("analytics.dashboard.read") }),
  Object.freeze({ key:"policies-configuration",label:"Policies & Configuration",href:"/admin/configuration",description:"Governed effective values, history and feature controls.",visibilityPermissions:P("platform.policy.read","config.value.read") }),
  Object.freeze({ key:"integrations-system",label:"Integrations & System",href:"/admin/system",description:"System health, background work and technical operations.",visibilityPermissions:P("system.health.read") }),
  Object.freeze({ key:"audit-security",label:"Audit & Security",href:"/admin/audit-security",description:"Immutable audit evidence and administrator access oversight.",visibilityPermissions:P("audit.event.read","admin.authority.read") }),
]);

export function visibleAdminPortalSections(context: PlatformAdministratorAuthorityContext): readonly AdminPortalSection[] {
  return Object.freeze(ADMIN_PORTAL_SECTIONS.filter((section) => section.visibilityPermissions.some((permission) => context.effectivePermissions.includes(permission))));
}
export function canAccessAdminPortalSection(context: PlatformAdministratorAuthorityContext, sectionKey: AdminPortalSectionKey): boolean {
  return visibleAdminPortalSections(context).some((section) => section.key === sectionKey);
}
export function assertAdminPortalSectionAccess(context: PlatformAdministratorAuthorityContext, sectionKey: AdminPortalSectionKey): AdminPortalSection {
  const section = ADMIN_PORTAL_SECTIONS.find((candidate) => candidate.key === sectionKey);
  if (!section) throw new Error(`Unknown administrative portal section: ${sectionKey}.`);
  if (!canAccessAdminPortalSection(context, sectionKey)) throw new Error(`Administrative portal section access denied: ${sectionKey}.`);
  return section;
}

export const IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS = [
  ...ADMIN_PORTAL_SECTION_KEYS,
  "organization-claims",
] as const;
export type ImplementedAdminRuntimeDestinationKey = (typeof IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS)[number];
export type ImplementedAdminRuntimeLabelKey =
  | "adminOverview" | "adminWorkQueues" | "adminOrganizations" | "adminUsersAccess"
  | "adminClaimsVerification" | "adminGeographies" | "adminInstitutionsPartners" | "adminRfxOpportunities"
  | "adminReferralsTeaming" | "adminResourceProviders" | "adminCredibility" | "adminTrustSafety"
  | "adminCommerce" | "adminSupportFeedback" | "adminCommunications" | "adminAnalytics"
  | "adminPoliciesConfiguration" | "adminIntegrationsSystem" | "adminAuditSecurity" | "organizationClaims";

interface ImplementedAdminRuntimeRegistration {
  readonly key: ImplementedAdminRuntimeDestinationKey;
  readonly labelKey: ImplementedAdminRuntimeLabelKey;
  readonly description: string;
  readonly permissions: readonly AdminPermissionKey[];
  readonly supportedScopeKinds: readonly AdminGrantScope["kind"][];
  readonly href: (scope: AdminGrantScope) => `/admin/${string}`;
}
export interface ImplementedAdminRuntimeDestination {
  readonly navigationId:string; readonly key:ImplementedAdminRuntimeDestinationKey; readonly labelKey:ImplementedAdminRuntimeLabelKey;
  readonly description:string; readonly permission:AdminPermissionKey; readonly scope:AdminGrantScope; readonly grantId:string; readonly href:`/admin/${string}`;
}

const OPERATING=P("admin.authority.read","analytics.dashboard.read","organization.claim.read","provider.application.read","support.case.read","trust.report.read","rfx.record.read","rfx.moderation.review","credibility.organization.verify","commerce.account.read","system.health.read","audit.event.read");
function href(path:`/admin/${string}`,scope:AdminGrantScope):`/admin/${string}` { return scope.kind==="GLOBAL"?path:`${path}?scope=${encodeURIComponent(scope.value)}` as `/admin/${string}`; }
const R=(key:ImplementedAdminRuntimeDestinationKey,labelKey:ImplementedAdminRuntimeLabelKey,description:string,permissions:readonly AdminPermissionKey[],supportedScopeKinds:readonly AdminGrantScope["kind"][],path:`/admin/${string}`):ImplementedAdminRuntimeRegistration=>Object.freeze({key,labelKey,description,permissions,supportedScopeKinds:Object.freeze(supportedScopeKinds),href:(scope)=>href(path,scope)});

const IMPLEMENTED_ADMIN_RUNTIME_REGISTRY: readonly ImplementedAdminRuntimeRegistration[] = Object.freeze([
  R("overview","adminOverview","See administrative work and operating conditions that need attention now.",OPERATING,["GLOBAL"],"/admin/overview"),
  R("work-queues","adminWorkQueues","Review canonical administrative cases within current authority.",OPERATING,["GLOBAL"],"/admin/work-queues"),
  R("organizations","adminOrganizations","Find canonical organizations and continue into Organization 360.",P("organization.profile.read"),["GLOBAL","GEOGRAPHY","ORGANIZATION"],"/admin/organizations"),
  R("users-access","adminUsersAccess","Inspect individual identity, memberships and access state.",P("user.profile.read","user.access.read"),["GLOBAL","ORGANIZATION"],"/admin/users"),
  R("claims-verification","adminClaimsVerification","Review authority and independent verification as separate facts.",P("organization.claim.read","credibility.organization.verify"),["GLOBAL","GEOGRAPHY","ORGANIZATION","CASE"],"/admin/claims-verification"),
  R("geographies","adminGeographies","Operate canonical physical geography and separate market overlays.",P("geography.definition.read","geography.release.read"),["GLOBAL","GEOGRAPHY"],"/admin/geographies"),
  R("institutions-partners","adminInstitutionsPartners","Inspect persisted delegated geography and program authority.",P("geography.release.read"),["GLOBAL","GEOGRAPHY"],"/admin/institutions"),
  R("rfx-opportunities","adminRfxOpportunities","Inspect RFx lifecycle, publication and exceptions without invented response state.",P("rfx.record.read"),["GLOBAL","GEOGRAPHY","ORGANIZATION","CASE"],"/admin/rfx"),
  R("referrals-teaming","adminReferralsTeaming","Operate governed referral and teaming relationships.",P("referral.record.read"),["GLOBAL","ORGANIZATION","CASE"],"/admin/referrals-teaming"),
  R("resource-providers","adminResourceProviders","Review provider applications and lifecycle within current authority.",P("provider.application.read"),["GLOBAL","GEOGRAPHY","ORGANIZATION","CASE"],"/admin/resource-providers"),
  R("credibility","adminCredibility","Inspect verification and credential facts without hidden ranking.",P("credibility.organization.verify","credibility.badge.award"),["GLOBAL","ORGANIZATION","CASE"],"/admin/credibility"),
  R("trust-safety","adminTrustSafety","Inspect reports, restrictions and governed safety cases.",P("trust.report.read","trust.case.review"),["GLOBAL","ORGANIZATION","CASE"],"/admin/trust-safety"),
  R("commerce","adminCommerce","Inspect RFxchange commercial state and billing exceptions.",P("commerce.account.read"),["GLOBAL","ORGANIZATION","CASE"],"/admin/commerce"),
  R("support-feedback","adminSupportFeedback","Operate support through the canonical administrative case lifecycle.",P("support.case.read"),["GLOBAL","ORGANIZATION","CASE"],"/admin/support"),
  R("communications","adminCommunications","Inspect transactional communications and delivery failures.",P("admin.authority.read","system.health.read"),["GLOBAL"],"/admin/communications"),
  R("analytics","adminAnalytics","Review privacy-safe operating intelligence with protected drill-through.",P("analytics.dashboard.read"),["GLOBAL","GEOGRAPHY"],"/admin/analytics"),
  R("policies-configuration","adminPoliciesConfiguration","Inspect governed effective configuration and version history.",P("platform.policy.read","config.value.read"),["GLOBAL"],"/admin/configuration"),
  R("integrations-system","adminIntegrationsSystem","Inspect measured system health and background operations; unknown remains unknown.",P("system.health.read"),["GLOBAL"],"/admin/system"),
  R("audit-security","adminAuditSecurity","Inspect immutable administrative evidence and access oversight.",P("audit.event.read","admin.authority.read"),["GLOBAL","ORGANIZATION","CASE"],"/admin/audit-security"),
  Object.freeze({key:"organization-claims",labelKey:"organizationClaims",description:"Supporting authority-claim adjudication workflow.",permissions:P("organization.claim.read"),supportedScopeKinds:Object.freeze(["GLOBAL","GEOGRAPHY"] as const),href:(scope)=>scope.kind==="GEOGRAPHY"?`/admin/organization-claims?geographyId=${encodeURIComponent(String(scope.targetId))}`:"/admin/organization-claims"}),
]);

function scopePriority(scope:AdminGrantScope):number{return scope.kind==="GLOBAL"?0:1;}
export function visibleImplementedAdminRuntimeDestinations(context:PlatformAdministratorAuthorityContext,grants:readonly AdminPermissionGrant[],now:string):readonly ImplementedAdminRuntimeDestination[]{
  return Object.freeze(IMPLEMENTED_ADMIN_RUNTIME_REGISTRY.flatMap((registration)=>{
    const candidateScopes=[...new Map(grants.filter((grant)=>grant.administratorId===context.administratorId&&registration.permissions.includes(grant.permission)&&registration.supportedScopeKinds.includes(grant.scope.kind)).map((grant)=>[grant.scope.value,grant.scope] as const)).values()].sort((a,b)=>scopePriority(a)-scopePriority(b)||a.value.localeCompare(b.value));
    return candidateScopes.flatMap((scope)=>{
      for(const permission of registration.permissions){
        const decision=authorizeScopedAdministrativeAction(context,grants,createScopedAdministrativeActionRequirement({permission,access:"read",scope:scope.value}),{now,satisfiedConditionKeys:Object.freeze([])});
        if(decision.kind==="allow")return[Object.freeze({navigationId:`${registration.key}:${scope.value}`,key:registration.key,labelKey:registration.labelKey,description:registration.description,permission,scope,grantId:String(decision.grantId),href:registration.href(scope)})];
      }
      return[];
    });
  }));
}
