import type { AdminPortalSectionKey } from "./portal-navigation.ts";

export type AdminDomainSurfaceKey =
  | Exclude<AdminPortalSectionKey, "overview" | "work-queues" | "resource-providers">
  | "data-promotion";

export interface AdminDomainFactDefinition {
  readonly label: string;
  readonly fields: readonly string[];
}

export interface AdminDomainCollectionDefinition {
  readonly collection: string;
  readonly kind: string;
  readonly kindLabel: string;
}

export interface AdminDomainSurfaceDefinition {
  readonly key: AdminDomainSurfaceKey;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly searchPlaceholder: string;
  readonly collections: readonly AdminDomainCollectionDefinition[];
  readonly titleFields: readonly string[];
  readonly subtitleFields: readonly string[];
  readonly statusFields: readonly string[];
  readonly searchFields: readonly string[];
  readonly facts: readonly AdminDomainFactDefinition[];
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly detailKind: "organization" | "user" | "case" | "inline";
  readonly relatedAction?: Readonly<{ label: string; href: string }>;
}

const C = (collection: string, kind: string, kindLabel: string): AdminDomainCollectionDefinition =>
  Object.freeze({ collection, kind, kindLabel });
const F = (label: string, ...fields: string[]): AdminDomainFactDefinition =>
  Object.freeze({ label, fields: Object.freeze(fields) });

export const ADMIN_DOMAIN_SURFACES: Readonly<Record<AdminDomainSurfaceKey, AdminDomainSurfaceDefinition>> = Object.freeze({
  organizations: Object.freeze({
    key: "organizations", eyebrow: "Network & Identity", title: "Organizations",
    description: "Find canonical organizations, see what needs attention, and continue into the authoritative Organization 360 record.",
    searchPlaceholder: "Name, organization ID, website or identifier",
    collections: Object.freeze([C("organizationProfiles", "organization", "Organization")]),
    titleFields: Object.freeze(["displayName", "name"]), subtitleFields: Object.freeze(["website", "primaryWebsite", "organizationId"]),
    statusFields: Object.freeze(["status", "lifecycleStatus", "claimState"]),
    searchFields: Object.freeze(["displayName", "name", "organizationId", "website", "primaryWebsite", "uei", "cage", "cageCode"]),
    facts: Object.freeze([F("Organization", "organizationId"), F("Website", "website", "primaryWebsite"), F("Geography", "primaryGeographyId", "geographyId"), F("Updated", "updatedAt")]),
    emptyTitle: "No organizations in this scope", emptyBody: "No canonical organization records match the current scope and filters.", detailKind: "organization",
  }),
  "users-access": Object.freeze({
    key: "users-access", eyebrow: "Network & Identity", title: "Users & Access",
    description: "Inspect individual identity, organization memberships, access state and the controlled administration paths already supported by RFxchange.",
    searchPlaceholder: "Name, email or user ID", collections: Object.freeze([C("users", "user", "User")]),
    titleFields: Object.freeze(["name", "primaryEmail"]), subtitleFields: Object.freeze(["primaryEmail", "id"]), statusFields: Object.freeze(["status", "accountStatus"]),
    searchFields: Object.freeze(["name", "primaryEmail", "id"]),
    facts: Object.freeze([F("User", "id"), F("Email", "primaryEmail"), F("Created", "createdAt"), F("Updated", "updatedAt")]),
    emptyTitle: "No users in this scope", emptyBody: "No user records match the current scope and filters.", detailKind: "user",
  }),
  "claims-verification": Object.freeze({
    key: "claims-verification", eyebrow: "Network & Identity", title: "Claims & Verification",
    description: "Authority answers who may represent an organization. Verification answers what RFxchange has independently established. These remain separate facts.",
    searchPlaceholder: "Organization, claim, credential or case",
    collections: Object.freeze([C("organizationAuthorityClaims", "authority", "Authority claim"), C("organizationCredentials", "verification", "Verification / credential")]),
    titleFields: Object.freeze(["displayName", "credentialType", "claimType", "organizationId"]), subtitleFields: Object.freeze(["organizationId", "userId", "issuer"]),
    statusFields: Object.freeze(["status", "state", "verificationStatus"]), searchFields: Object.freeze(["organizationId", "userId", "credentialType", "claimType", "issuer", "status"]),
    facts: Object.freeze([F("Organization", "organizationId"), F("State", "status", "state", "verificationStatus"), F("Submitted", "submittedAt", "createdAt"), F("Updated", "updatedAt")]),
    emptyTitle: "No claims or verification work", emptyBody: "There are no authority claims or verification records in the current scope.", detailKind: "inline",
    relatedAction: Object.freeze({ label: "Open authority adjudication", href: "/admin/organization-claims" }),
  }),
  geographies: Object.freeze({
    key: "geographies", eyebrow: "Network & Identity", title: "Geographies",
    description: "Operate canonical physical geography and market overlays without treating a market as a physical containment level.",
    searchPlaceholder: "Geography, FIPS, market or locality", collections: Object.freeze([C("geographies", "geography", "Geography")]),
    titleFields: Object.freeze(["displayName", "name", "label"]), subtitleFields: Object.freeze(["type", "geographyType", "fipsCode"]), statusFields: Object.freeze(["releaseState", "participationState", "status"]),
    searchFields: Object.freeze(["displayName", "name", "label", "fipsCode", "type", "geographyType", "id"]),
    facts: Object.freeze([F("Type", "type", "geographyType"), F("FIPS", "fipsCode"), F("Release", "releaseState"), F("Boundary version", "boundary.vintage")]),
    emptyTitle: "No geographies in this scope", emptyBody: "No canonical geography records match the current scope.", detailKind: "inline",
  }),
  "institutions-partners": Object.freeze({
    key: "institutions-partners", eyebrow: "Network & Identity", title: "Institutions & Partners",
    description: "Inspect current delegated geography and program authority. RFxchange does not invent a separate institution entity where one is not persisted.",
    searchPlaceholder: "Partner, geography, program or authority", collections: Object.freeze([C("geographyParticipationAuthorizations", "delegation", "Delegated authority")]),
    titleFields: Object.freeze(["subject.organizationId", "subject.userId"]), subtitleFields: Object.freeze(["geographyId", "programId", "organizationId"]), statusFields: Object.freeze(["status", "state"]),
    searchFields: Object.freeze(["institutionName", "organizationName", "programName", "organizationId", "geographyId", "programId"]),
    facts: Object.freeze([F("Organization", "organizationId"), F("Geography", "geographyId"), F("Program", "programId", "programName"), F("Subject", "subject.kind")]),
    emptyTitle: "No delegated partner authority", emptyBody: "No persisted institution or partner delegations match the current scope.", detailKind: "inline",
  }),
  "rfx-opportunities": Object.freeze({
    key: "rfx-opportunities", eyebrow: "Exchange Operations", title: "RFx & Opportunities",
    description: "Inspect issuer-owned RFx lifecycle, publication state, geography and operating exceptions without fabricating response or submission records.",
    searchPlaceholder: "RFx, issuer or opportunity", collections: Object.freeze([C("rfxAggregates", "rfx", "RFx")]),
    titleFields: Object.freeze(["package.title", "id"]), subtitleFields: Object.freeze(["issuerOrganizationId", "organizationId", "rfxNumber"]), statusFields: Object.freeze(["lifecycleState"]),
    searchFields: Object.freeze(["package.title", "issuerOrganizationId", "id"]),
    facts: Object.freeze([F("Issuer", "issuerOrganizationId", "organizationId"), F("Geography", "geographyId", "performanceGeographyId"), F("Deadline", "package.timing.responseDeadline"), F("Updated", "updatedAt")]),
    emptyTitle: "No RFx records in this scope", emptyBody: "No RFx records match the current scope and filters.", detailKind: "inline",
  }),
  "referrals-teaming": Object.freeze({
    key: "referrals-teaming", eyebrow: "Exchange Operations", title: "Referrals & Teaming",
    description: "Operate the cross-lens referral and teaming workflow as governed relationships rather than a fifth participant lens.",
    searchPlaceholder: "Referral, sender, recipient or opportunity", collections: Object.freeze([C("businessReferrals", "referral", "Referral")]),
    titleFields: Object.freeze(["senderOrganizationName", "id"]), subtitleFields: Object.freeze(["senderOrganizationId", "attachedRecipientOrganizationId", "opportunityReference"]), statusFields: Object.freeze(["status", "state"]),
    searchFields: Object.freeze(["referralNumber", "senderOrganizationId", "attachedRecipientOrganizationId", "opportunityReference", "recipient.email", "id"]),
    facts: Object.freeze([F("Sender", "senderOrganizationId"), F("Recipient", "attachedRecipientOrganizationId", "recipient.email"), F("Opportunity", "opportunityReference", "rfxId"), F("Updated", "updatedAt")]),
    emptyTitle: "No referral or teaming records", emptyBody: "No governed referral records match the current scope and filters.", detailKind: "inline",
  }),
  credibility: Object.freeze({
    key: "credibility", eyebrow: "Exchange Operations", title: "Credibility",
    description: "Inspect verification and credential facts without converting self-report, evidence or endorsements into a hidden score.",
    searchPlaceholder: "Organization, credential or issuer", collections: Object.freeze([C("organizationCredentials", "credential", "Credential")]),
    titleFields: Object.freeze(["credentialType", "name", "issuer"]), subtitleFields: Object.freeze(["organizationId", "issuer"]), statusFields: Object.freeze(["status", "verificationStatus", "state"]),
    searchFields: Object.freeze(["credentialType", "name", "issuer", "organizationId", "status"]),
    facts: Object.freeze([F("Organization", "organizationId"), F("Issuer", "issuer"), F("Status", "status", "verificationStatus"), F("Expires", "expiresAt", "expirationDate")]),
    emptyTitle: "No credibility records", emptyBody: "No verified credential facts match the current scope.", detailKind: "inline",
  }),
  "trust-safety": Object.freeze({
    key: "trust-safety", eyebrow: "Exchange Operations", title: "Trust & Safety",
    description: "Inspect active restrictions and governed cases with the subject, current state and consequence kept explicit.",
    searchPlaceholder: "Organization, user, restriction or case", collections: Object.freeze([C("accessRestrictions", "restriction", "Restriction")]),
    titleFields: Object.freeze(["reason", "type", "state"]), subtitleFields: Object.freeze(["target.organizationId", "target.userId", "target.membershipId"]), statusFields: Object.freeze(["state", "status"]),
    searchFields: Object.freeze(["reason", "type", "state", "organizationId", "userId", "membershipId", "id"]),
    facts: Object.freeze([F("Organization", "target.organizationId"), F("User", "target.userId"), F("State", "state", "status"), F("Effective", "effectiveAt", "createdAt")]),
    emptyTitle: "No trust restrictions in this scope", emptyBody: "No persisted restrictions match the current scope and filters.", detailKind: "inline",
  }),
  commerce: Object.freeze({
    key: "commerce", eyebrow: "Business Operations", title: "Commerce",
    description: "Inspect RFxchange commercial state while keeping Stripe and other provider truth behind their provider boundaries.",
    searchPlaceholder: "Organization, customer or subscription", collections: Object.freeze([C("organizationCommercialAccounts", "commercial-account", "Commercial account")]),
    titleFields: Object.freeze(["organizationName", "planName", "organizationId"]), subtitleFields: Object.freeze(["organizationId", "providerCustomerId"]), statusFields: Object.freeze(["status", "subscriptionStatus", "foundingStatus"]),
    searchFields: Object.freeze(["organizationId", "providerCustomerId", "providerSubscriptionId", "planName", "status"]),
    facts: Object.freeze([F("Organization", "organizationId"), F("Plan", "planName", "plan"), F("Subscription", "subscriptionStatus", "status"), F("Updated", "updatedAt")]),
    emptyTitle: "No commercial accounts", emptyBody: "No RFxchange commercial accounts match the current scope.", detailKind: "inline",
  }),
  "support-feedback": Object.freeze({
    key: "support-feedback", eyebrow: "Business Operations", title: "Support & Feedback",
    description: "Operate participant support through the canonical administrative case lifecycle instead of a second ticket system.",
    searchPlaceholder: "Case, organization, user or issue", collections: Object.freeze([C("administrativeCases", "case", "Administrative case")]),
    titleFields: Object.freeze(["caseNumber", "title", "type"]), subtitleFields: Object.freeze(["organizationId", "userId", "source"]), statusFields: Object.freeze(["status", "slaState"]),
    searchFields: Object.freeze(["caseNumber", "title", "type", "source", "organizationId", "userId", "id"]),
    facts: Object.freeze([F("Type", "type"), F("Organization", "organizationId"), F("Assigned", "assignedAdministratorId"), F("SLA", "slaState", "slaDueAt")]),
    emptyTitle: "No support cases", emptyBody: "No canonical administrative cases match the current support scope.", detailKind: "case",
  }),
  communications: Object.freeze({
    key: "communications", eyebrow: "Business Operations", title: "Communications",
    description: "Inspect transactional delivery state and failures. Broad outbound sending remains absent until a dedicated mutation permission and workflow exist.",
    searchPlaceholder: "Delivery, template, event or provider reference", collections: Object.freeze([C("transactionalEmailDeliveries", "delivery", "Transactional delivery")]),
    titleFields: Object.freeze(["templateKey", "eventKey", "messageKey"]), subtitleFields: Object.freeze(["providerReference", "organizationId"]), statusFields: Object.freeze(["status", "deliveryState"]),
    searchFields: Object.freeze(["templateKey", "eventKey", "messageKey", "providerReference", "organizationId", "status"]),
    facts: Object.freeze([F("Template", "templateKey", "templateVersion"), F("Event", "eventKey", "eventVersion"), F("State", "status", "deliveryState"), F("Updated", "updatedAt")]),
    emptyTitle: "No delivery records", emptyBody: "No transactional communication records match the current scope.", detailKind: "inline",
  }),
  analytics: Object.freeze({
    key: "analytics", eyebrow: "Business Operations", title: "Analytics",
    description: "Privacy-safe operating intelligence derived from canonical records. Counts are current bounded facts, not credibility or participant rankings.",
    searchPlaceholder: "Filter operating facts", collections: Object.freeze([]), titleFields: Object.freeze([]), subtitleFields: Object.freeze([]), statusFields: Object.freeze([]), searchFields: Object.freeze([]), facts: Object.freeze([]),
    emptyTitle: "No analytical drill-through selected", emptyBody: "Use the operating counts to move into the corresponding protected administrative surface.", detailKind: "inline",
  }),
  "policies-configuration": Object.freeze({
    key: "policies-configuration", eyebrow: "Platform", title: "Policies & Configuration",
    description: "Inspect current effective governed values and versioned configuration history. Changes create new governed history rather than erasing prior state.",
    searchPlaceholder: "Configuration or policy key", collections: Object.freeze([C("governedConfigurationValues", "configuration", "Configuration")]),
    titleFields: Object.freeze(["key", "name"]), subtitleFields: Object.freeze(["policyVersion", "environment"]), statusFields: Object.freeze(["status"]),
    searchFields: Object.freeze(["key", "name", "policyVersion", "environment"]),
    facts: Object.freeze([F("Revision", "revision"), F("Policy version", "policyVersion"), F("Effective", "effectiveAt"), F("Updated by", "updatedByAdministratorId")]),
    emptyTitle: "No governed configuration values", emptyBody: "No persisted governed configuration is visible in the current scope.", detailKind: "inline",
  }),
  "integrations-system": Object.freeze({
    key: "integrations-system", eyebrow: "Platform", title: "Integrations & System",
    description: "Inspect current background work and system conditions. Unmeasured health stays Unknown rather than being reported as healthy.",
    searchPlaceholder: "Job, integration or operation", collections: Object.freeze([C("backgroundJobs", "job", "Background job")]),
    titleFields: Object.freeze(["jobName", "operation", "name"]), subtitleFields: Object.freeze(["correlationId", "environment"]), statusFields: Object.freeze(["status"]),
    searchFields: Object.freeze(["jobName", "operation", "name", "correlationId", "status", "environment"]),
    facts: Object.freeze([F("Operation", "operation", "jobName"), F("State", "status"), F("Attempts", "attempts", "attempt"), F("Updated", "updatedAt", "finishedAt")]),
    emptyTitle: "No background operations", emptyBody: "No persisted background operations match the current filters. Missing telemetry must still be treated as Unknown.", detailKind: "inline",
  }),
  "audit-security": Object.freeze({
    key: "audit-security", eyebrow: "Platform", title: "Audit & Security",
    description: "Inspect immutable administrative evidence, exact authority and security-sensitive outcomes without mutating historical events.",
    searchPlaceholder: "Administrator, action, permission, target or case", collections: Object.freeze([C("platformAdministrativeAuditEvents", "audit", "Administrative audit event")]),
    titleFields: Object.freeze(["action", "eventType", "id"]), subtitleFields: Object.freeze(["actorAdministratorId", "target.organizationId"]), statusFields: Object.freeze(["outcome", "sensitivity"]),
    searchFields: Object.freeze(["administratorId", "action", "eventType", "permission", "scope", "outcome", "relatedCaseId", "id"]),
    facts: Object.freeze([F("Administrator", "actorAdministratorId"), F("Permission", "permission"), F("Outcome", "outcome"), F("Recorded", "occurredAt")]),
    emptyTitle: "No audit events", emptyBody: "No immutable administrative audit events match the current scope and filters.", detailKind: "inline",
  }),
  "data-promotion": Object.freeze({
    key: "data-promotion", eyebrow: "Provider Data Promotion", title: "Source Packages",
    description: "Review source-backed provider packages through one geography-agnostic promotion path. Hampton Roads is the first real package, not a product boundary.",
    searchPlaceholder: "Market, package, source or provider", collections: Object.freeze([C("providerSeedSourceRecords", "source-record", "Source record")]),
    titleFields: Object.freeze(["displayName", "seedKey", "marketKey"]), subtitleFields: Object.freeze(["marketKey", "primarySourceId"]), statusFields: Object.freeze(["status", "disposition"]),
    searchFields: Object.freeze(["displayName", "seedKey", "marketKey", "primarySourceId", "website"]),
    facts: Object.freeze([F("Market / package", "marketKey"), F("Source", "primarySourceId"), F("Prepared", "preparedAt"), F("Location", "locationKey")]),
    emptyTitle: "No source-backed provider packages", emptyBody: "No persisted provider seed source records are available in the current scope.", detailKind: "inline",
  }),
});

export function adminDomainSurface(key: AdminDomainSurfaceKey): AdminDomainSurfaceDefinition {
  return ADMIN_DOMAIN_SURFACES[key];
}
