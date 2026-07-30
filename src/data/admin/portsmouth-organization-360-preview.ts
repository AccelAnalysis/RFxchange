import type { Organization360Projection } from "../../application/admin/organization-360.ts";
import { organizationId } from "../../domain/organizations/model.ts";

export function createPortsmouthOrganization360Preview(
  requestedOrganizationId: string,
): Organization360Projection {
  const scopedOrganizationId = organizationId(requestedOrganizationId);
  const tabs = [
    ["overview", "Overview", "available", 1],
    ["users", "Users", "available", 3],
    ["profile", "Profile", "available", 1],
    ["locations-service-areas", "Locations & Service Areas", "available", 4],
    ["capabilities", "Capabilities", "available", 3],
    ["rfx", "RFx", "empty", 0],
    ["responses", "Responses", "empty", 0],
    ["referrals", "Referrals", "empty", 0],
    ["teaming", "Teaming", "empty", 0],
    ["resources", "Resources", "restricted", null],
    ["credibility", "Credibility", "available", 1],
    ["commerce", "Commerce", "available", 1],
    ["support", "Support", "available", 1],
    ["audit", "Audit", "available", 12],
  ] as const;
  return Object.freeze({
    scope: Object.freeze({
      kind: "ORGANIZATION" as const,
      organizationId: scopedOrganizationId,
      displayName: "Portsmouth Works",
    }),
    header: Object.freeze({
      accountAccess: "integrity-hold" as const,
      profileCompletion: "complete" as const,
      markerActivation: "inactive" as const,
      verification: "pending" as const,
      officialProvider: "not-evaluated" as const,
      commercial: Object.freeze({
        planKey: "founding",
        subscriptionStatus: "active",
        foundingRecognition: true,
      }),
      primaryGeography: Object.freeze({
        id: "us-va-portsmouth",
        name: "Portsmouth, Virginia",
        releaseState: "released",
      }),
      restriction: "integrity-hold" as const,
      investigation: "active" as const,
      governingCase: Object.freeze({
        visible: true,
        caseNumber: "CASE-2026-0048",
        href: "/admin/cases/case-2026-0048" as const,
      }),
    }),
    tabs: Object.freeze(
      tabs.map(([key, label, state, count]) =>
        Object.freeze({
          key,
          label,
          state,
          count,
          organizationId: scopedOrganizationId,
        }),
      ),
    ),
    overview: Object.freeze({
      activeMemberships: 3,
      capabilities: 3,
      serviceGeographies: 4,
      publicLocationVisibility: "approximate",
      privateLocation: Object.freeze({
        visible: false,
        addressLine1: null,
        coordinate: null,
      }),
    }),
  });
}
