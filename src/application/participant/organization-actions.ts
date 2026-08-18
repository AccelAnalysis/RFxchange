export type OrganizationActionId = "manage-profile" | "view-resources" | "start-referral" | "opportunities-rfx";

export interface OrganizationActionProjection {
  readonly id: OrganizationActionId;
  readonly availability: "available" | "unavailable";
  readonly href: string | null;
  readonly reason: "self-only" | "not-an-official-provider" | "exchange-action-unavailable" | null;
}

export function projectOrganizationActions(input: Readonly<{
  viewerOrganizationId: string;
  selectedOrganizationId: string;
  officialResourceProvider: boolean;
  operationalActionsAvailable?: boolean;
}>): readonly OrganizationActionProjection[] {
  const self = input.viewerOrganizationId === input.selectedOrganizationId;
  const operationalActionsAvailable = input.operationalActionsAvailable ?? true;
  return Object.freeze([
    Object.freeze({
      id: "manage-profile" as const,
      availability: self ? "available" as const : "unavailable" as const,
      href: self ? "/organization-profile" : null,
      reason: self ? null : "self-only" as const,
    }),
    Object.freeze({
      id: "view-resources" as const,
      availability: operationalActionsAvailable && (self || input.officialResourceProvider)
        ? "available" as const
        : "unavailable" as const,
      href: !operationalActionsAvailable
        ? null
        : self
        ? "/resources"
        : input.officialResourceProvider
          ? `/resources?provider=${encodeURIComponent(input.selectedOrganizationId)}`
          : null,
      reason: !operationalActionsAvailable
        ? "exchange-action-unavailable" as const
        : self || input.officialResourceProvider
          ? null
          : "not-an-official-provider" as const,
    }),
    Object.freeze({
      id: "start-referral" as const,
      availability: operationalActionsAvailable ? "available" as const : "unavailable" as const,
      href: operationalActionsAvailable
        ? self
          ? "/referrals?intent=manage"
          : `/referrals?organization=${encodeURIComponent(input.selectedOrganizationId)}`
        : null,
      reason: operationalActionsAvailable ? null : "exchange-action-unavailable" as const,
    }),
    Object.freeze({
      id: "opportunities-rfx" as const,
      availability: operationalActionsAvailable && self ? "available" as const : "unavailable" as const,
      href: operationalActionsAvailable && self ? "/opportunities" : null,
      reason: !operationalActionsAvailable
        ? "exchange-action-unavailable" as const
        : self
          ? null
          : "self-only" as const,
    }),
  ]);
}
