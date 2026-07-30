import type { AdminPermissionGrant } from "../../domain/admin-authorization/grants.ts";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
} from "../../domain/admin-authorization/grants.ts";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { AdministrativeCase } from "../../domain/admin-cases/model.ts";
import type { OrganizationCommercialAccount } from "../../domain/commercial/model.ts";
import type { GeographyDefinition } from "../../domain/geography/model.ts";
import type { AccessRestrictionRecord } from "../../domain/lifecycle/model.ts";
import type {
  ConfirmedOrganizationLocation,
  OrganizationServiceGeography,
} from "../../domain/organization-location/model.ts";
import type {
  EssentialOrganizationProfile,
  OrganizationProfileCompletion,
} from "../../domain/organization-profile/model.ts";
import type { OrganizationMarkerActivation } from "../../domain/organization-markers/model.ts";
import type { OrganizationAccount, OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";

export const ORGANIZATION_360_TAB_KEYS = [
  "overview",
  "users",
  "profile",
  "locations-service-areas",
  "capabilities",
  "rfx",
  "responses",
  "referrals",
  "teaming",
  "resources",
  "credibility",
  "commerce",
  "support",
  "audit",
] as const;

export type Organization360TabKey = (typeof ORGANIZATION_360_TAB_KEYS)[number];
export type Organization360TabState = "available" | "empty" | "restricted";

const ORGANIZATION_360_TAB_DEFINITIONS = Object.freeze([
  ["overview", "Overview", "organization.profile.read"],
  ["users", "Users", "user.access.read"],
  ["profile", "Profile", "organization.profile.read"],
  ["locations-service-areas", "Locations & Service Areas", "geography.definition.read"],
  ["capabilities", "Capabilities", "organization.profile.read"],
  ["rfx", "RFx", "rfx.record.read"],
  ["responses", "Responses", "rfx.record.read"],
  ["referrals", "Referrals", "referral.record.read"],
  ["teaming", "Teaming", "referral.record.read"],
  ["resources", "Resources", "provider.application.read"],
  ["credibility", "Credibility", "credibility.organization.verify"],
  ["commerce", "Commerce", "commerce.account.read"],
  ["support", "Support", "support.case.read"],
  ["audit", "Audit", "audit.event.read"],
] as const satisfies ReadonlyArray<readonly [Organization360TabKey, string, string]>);

export interface Organization360Input {
  readonly organization: OrganizationAccount;
  readonly profile: EssentialOrganizationProfile;
  readonly completion: OrganizationProfileCompletion | null;
  readonly marker: OrganizationMarkerActivation | null;
  readonly primaryGeography: GeographyDefinition;
  readonly location: ConfirmedOrganizationLocation | null;
  readonly serviceGeography: OrganizationServiceGeography | null;
  readonly memberships: readonly OrganizationMembership[];
  readonly restriction: AccessRestrictionRecord | null;
  readonly verificationState: "not-evaluated" | "pending" | "verified" | "denied";
  readonly officialProviderState: "not-evaluated" | "pending" | "official" | "denied";
  readonly commercialAccount: OrganizationCommercialAccount | null;
  readonly administrativeCases: readonly AdministrativeCase[];
  readonly domainCounts?: Readonly<Partial<Record<Organization360TabKey, number>>>;
}

export interface Organization360Context {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly grants: readonly AdminPermissionGrant[];
  readonly now: string;
  readonly satisfiedConditionKeys?: readonly string[];
}

export interface Organization360Tab {
  readonly key: Organization360TabKey;
  readonly label: string;
  readonly organizationId: OrganizationId;
  readonly state: Organization360TabState;
  readonly count: number | null;
}

export interface Organization360Projection {
  readonly scope: Readonly<{
    readonly kind: "ORGANIZATION";
    readonly organizationId: OrganizationId;
    readonly displayName: string;
  }>;
  readonly header: Readonly<{
    readonly accountAccess: "active" | "restricted" | "suspended" | "integrity-hold" | "terminated";
    readonly profileCompletion: "complete" | "incomplete";
    readonly markerActivation: "active" | "inactive";
    readonly verification: Organization360Input["verificationState"];
    readonly officialProvider: Organization360Input["officialProviderState"];
    readonly commercial: Readonly<{
      readonly planKey: string;
      readonly subscriptionStatus: string;
      readonly foundingRecognition: boolean;
    }>;
    readonly primaryGeography: Readonly<{
      readonly id: string;
      readonly name: string;
      readonly releaseState: string;
    }>;
    readonly restriction: AccessRestrictionRecord["state"];
    readonly investigation: "none" | "active";
    readonly governingCase: Readonly<{
      readonly visible: boolean;
      readonly caseNumber: string | null;
      readonly href: `/admin/cases/${string}` | null;
    }> | null;
  }>;
  readonly tabs: readonly Organization360Tab[];
  readonly overview: Readonly<{
    readonly activeMemberships: number;
    readonly capabilities: number;
    readonly serviceGeographies: number;
    readonly publicLocationVisibility: string | null;
    readonly privateLocation: Readonly<{
      readonly visible: boolean;
      readonly addressLine1: string | null;
      readonly coordinate: readonly [number, number] | null;
    }>;
  }>;
}

function authorizeOrganizationScope(
  context: Organization360Context,
  organizationId: OrganizationId,
  permission: string,
): boolean {
  const decision = authorizeScopedAdministrativeAction(
    context.authority,
    context.grants,
    createScopedAdministrativeActionRequirement({
      permission,
      access: "read",
      scope: `ORGANIZATION:${organizationId}`,
    }),
    {
      now: context.now,
      satisfiedConditionKeys: context.satisfiedConditionKeys,
    },
  );
  return decision.kind === "allow";
}

function authorizedCase(
  context: Organization360Context,
  caseRecord: AdministrativeCase,
): boolean {
  const decision = authorizeScopedAdministrativeAction(
    context.authority,
    context.grants,
    createScopedAdministrativeActionRequirement({
      permission: caseRecord.readPermission,
      access: "read",
      scope: `CASE:${caseRecord.id}`,
    }),
    {
      now: context.now,
      satisfiedConditionKeys: context.satisfiedConditionKeys,
    },
  );
  return decision.kind === "allow";
}

function isActiveCase(caseRecord: AdministrativeCase): boolean {
  return caseRecord.status !== "resolved" && caseRecord.status !== "closed";
}

export function buildOrganization360(
  context: Organization360Context,
  input: Organization360Input,
): Organization360Projection {
  const organizationId = input.organization.id;
  if (input.profile.organizationId !== organizationId) {
    throw new Error("Organization 360 profile belongs to a different organization scope.");
  }
  if (input.location && input.location.organizationId !== organizationId) {
    throw new Error("Organization 360 location belongs to a different organization scope.");
  }
  if (
    input.restriction &&
    (input.restriction.target.kind !== "organization" ||
      input.restriction.target.organizationId !== organizationId)
  ) {
    throw new Error("Organization 360 restriction belongs to a different organization scope.");
  }
  if (
    !authorizeOrganizationScope(
      context,
      organizationId,
      "organization.profile.read",
    )
  ) {
    throw new Error("Organization 360 denied: scoped organization.profile.read is required.");
  }

  const organizationCases = input.administrativeCases.filter(
    (caseRecord) => caseRecord.organizationId === organizationId,
  );
  const activeCases = organizationCases.filter(isActiveCase);
  const governingCase = activeCases[0] ?? null;
  const canViewGoverningCase =
    governingCase !== null && authorizedCase(context, governingCase);
  const privateLocationVisible =
    input.location !== null &&
    authorizeOrganizationScope(
      context,
      organizationId,
      "organization.location.private.read",
    );

  const tabs = ORGANIZATION_360_TAB_DEFINITIONS.map(
    ([key, label, permission]): Organization360Tab => {
      const allowed = authorizeOrganizationScope(
        context,
        organizationId,
        permission,
      );
      const count =
        key === "users"
          ? input.memberships.filter(
              (membership) => membership.organizationId === organizationId,
            ).length
          : key === "capabilities"
            ? input.profile.capabilities.length
            : key === "locations-service-areas"
              ? input.serviceGeography?.serviceGeographyIds.length ?? 0
              : input.domainCounts?.[key] ?? 0;
      return Object.freeze({
        key,
        label,
        organizationId,
        state: allowed ? (count > 0 || key === "overview" || key === "profile" ? "available" : "empty") : "restricted",
        count: allowed ? count : null,
      });
    },
  );

  const restriction = input.restriction?.state ?? "none";
  const accountAccess = restriction === "none" ? "active" : restriction;
  const commercial = input.commercialAccount;
  return Object.freeze({
    scope: Object.freeze({
      kind: "ORGANIZATION" as const,
      organizationId,
      displayName: input.profile.displayName,
    }),
    header: Object.freeze({
      accountAccess,
      profileCompletion:
        input.completion?.status === "active" ? "complete" as const : "incomplete" as const,
      markerActivation:
        input.marker?.status === "active" ? "active" as const : "inactive" as const,
      verification: input.verificationState,
      officialProvider: input.officialProviderState,
      commercial: Object.freeze({
        planKey: commercial?.planKey ?? "free",
        subscriptionStatus: commercial?.subscription.status ?? "not-subscribed",
        foundingRecognition:
          commercial?.planKey === "founding" ||
          commercial?.entitlementKeys.some(
            (entitlement) => entitlement === "founding-recognition",
          ) === true,
      }),
      primaryGeography: Object.freeze({
        id: input.primaryGeography.id,
        name: input.primaryGeography.name,
        releaseState: input.primaryGeography.releaseState,
      }),
      restriction,
      investigation: activeCases.length > 0 ? "active" as const : "none" as const,
      governingCase: governingCase
        ? Object.freeze({
            visible: canViewGoverningCase,
            caseNumber: canViewGoverningCase ? governingCase.caseNumber : null,
            href: canViewGoverningCase
              ? `/admin/cases/${governingCase.id}` as const
              : null,
          })
        : null,
    }),
    tabs: Object.freeze(tabs),
    overview: Object.freeze({
      activeMemberships: input.memberships.filter(
        (membership) =>
          membership.organizationId === organizationId &&
          membership.status === "active",
      ).length,
      capabilities: input.profile.capabilities.length,
      serviceGeographies: input.serviceGeography?.serviceGeographyIds.length ?? 0,
      publicLocationVisibility: input.location?.visibility ?? null,
      privateLocation: Object.freeze({
        visible: privateLocationVisible,
        addressLine1:
          privateLocationVisible ? input.location?.physicalAddress.addressLine1 ?? null : null,
        coordinate:
          privateLocationVisible ? input.location?.coordinate ?? null : null,
      }),
    }),
  });
}
